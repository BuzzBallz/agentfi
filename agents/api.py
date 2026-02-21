from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

import uvicorn
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)  # Must run before orchestrator import (reads HEDERA_ENABLED)

from fastapi import FastAPI, Request  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from fastapi.responses import JSONResponse  # noqa: E402
from pydantic import BaseModel  # noqa: E402

from agents.orchestrator import AGENT_REGISTRY, AgentOrchestrator, HEDERA_ENABLED  # noqa: E402
from agents.payments.mock_provider import MockPaymentProvider  # noqa: E402
from agent_factory import run_agent  # noqa: E402
from dynamic_registry import register_agent as registry_register, get_token_map, get_dynamic_agents, set_hedera_info, get_all_hedera_accounts, get_afc_balances  # noqa: E402

# Lazy imports: x402/adi depend on web3 which can hang on some platforms (Windows/MINGW).
# Probe web3 in a subprocess first to avoid deadlocking the main process.
# Set SKIP_WEB3=1 to skip the probe entirely (faster startup, safe for --reload).
import subprocess, sys  # noqa: E401
_X402_AVAILABLE = False
try:
    if os.getenv("SKIP_WEB3"):
        raise ImportError("SKIP_WEB3 set — using mock fallbacks")
    _probe = subprocess.run(
        [sys.executable, "-c", "import web3"],
        timeout=8, capture_output=True,
    )
    if _probe.returncode == 0:
        from x402.config import AGENT_NAME_TO_TOKEN_ID, KITEAI_USDT_ADDRESS, get_registry_config  # noqa: E402
        from x402.server_middleware import x402_middleware_check, settle_x402_payment  # noqa: E402
        from x402.cross_agent_service import CrossAgentService  # noqa: E402
        from x402.afc_payment_service import AFCPaymentService, MockAFCPaymentService  # noqa: E402
        from adi.compliance_service import ADIComplianceService, MockADIComplianceService  # noqa: E402
        _X402_AVAILABLE = True
    else:
        raise ImportError(f"web3 import returned {_probe.returncode}: {_probe.stderr.decode()[:200]}")
except Exception as _e:
    logging.getLogger(__name__).warning(f"x402/adi modules unavailable (web3 issue): {_e}")
    _X402_AVAILABLE = False

    # Mock fallbacks so the server can start without x402/adi
    AGENT_NAME_TO_TOKEN_ID: dict[str, int] = {"portfolio_analyzer": 0, "yield_optimizer": 1, "risk_scorer": 2}
    KITEAI_USDT_ADDRESS = ""

    def get_registry_config(token_id: int) -> dict:
        return {"x402_enabled": False, "price_afc": 0, "price_usdt": 0, "max_budget_afc": 0, "allow_cross_agent": False,
                "agent_hedera_account": "", "owner_hedera_account": ""}

    async def x402_middleware_check(request: Any, agent_id: str, wallet: str | None) -> None:
        return None

    async def settle_x402_payment(payment_data: Any) -> None:
        return None

    class CrossAgentService:
        def __init__(self, **kwargs: Any): pass
        async def execute_with_cross_agent(self, **kwargs: Any) -> dict:
            return {"enhanced_result": kwargs.get("main_result", ""), "cross_agent_report": [], "x402_payments": []}

    class AFCPaymentService:
        pass

    class MockAFCPaymentService:
        pass

    class ADIComplianceService:
        def __init__(self): self.enabled = False
        async def verify_kyc(self, *a: Any, **kw: Any) -> dict: return {"verified": False}
        async def record_payment(self, *a: Any, **kw: Any) -> dict: return {}
        async def check_compliance(self, *a: Any, **kw: Any) -> dict: return {"compliant": True}

    class MockADIComplianceService:
        def __init__(self): self.enabled = False
        async def verify_kyc(self, *a: Any, **kw: Any) -> dict: return {"verified": True, "kyc_tier": 2, "jurisdiction": "US"}
        async def record_payment(self, *a: Any, **kw: Any) -> dict: return {"tx_hash": "0xmock", "status": "recorded"}
        async def check_compliance(self, *a: Any, **kw: Any) -> dict: return {"compliant": True}

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger(__name__)

# ── x402 services ──────────────────────────────────────────────────

if HEDERA_ENABLED:
    try:
        from hedera.service_factory import get_hts_service
        _hts = get_hts_service()
        _afc_payment_svc = AFCPaymentService(
            hts_service=_hts,
            afc_token_id=os.getenv("HEDERA_TOKEN_ID", ""),
        )
    except Exception:
        _afc_payment_svc = MockAFCPaymentService()
else:
    _afc_payment_svc = MockAFCPaymentService()

# ── ADI compliance service ────────────────────────────────────────

if os.getenv("ADI_PAYMENTS_ADDRESS"):
    adi_service = ADIComplianceService()
else:
    adi_service = MockADIComplianceService()

cross_agent_service = CrossAgentService(
    afc_payment_service=_afc_payment_svc,
    backend_base_url=os.getenv("BACKEND_BASE_URL", "http://localhost:8000"),
    afc_token_id=os.getenv("HEDERA_TOKEN_ID", ""),
)

app = FastAPI(title="AgentFi API", version="0.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExecuteRequest(BaseModel):
    query: str
    wallet_address: str | None = None
    cross_agent: bool = False


class AgentResponse(BaseModel):
    success: bool
    data: Any
    error: str | None


class AgentInfo(BaseModel):
    name: str
    description: str
    price_per_call: float


# ── Core endpoints ──────────────────────────────────────────────────


@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/agents")
async def list_agents() -> AgentResponse:
    agents = [
        AgentInfo(
            name=agent.name,
            description=agent.description,
            price_per_call=agent.price_per_call,
        )
        for agent in AGENT_REGISTRY.values()
    ]
    return AgentResponse(success=True, data=[a.model_dump() for a in agents], error=None)


async def _execute_with_fallback(agent_id: str, query: str, wallet_address: str | None) -> str:
    """Try new LangChain agent first, fall back to legacy agent.

    Dynamic agents (user-created via /agents/register) skip the LangChain
    tool chain and execute directly via their own system prompt + Claude.
    """
    from agents.dynamic_agent import DynamicAgent

    agent = AGENT_REGISTRY.get(agent_id)
    # Dynamic agents have their own system prompt — execute directly (fast, no tools)
    if isinstance(agent, DynamicAgent):
        return await agent.execute(query, wallet_address=wallet_address)

    # Static agents use the full LangChain ReAct agent with Hedera/DeFi tools
    try:
        return await run_agent(agent_id, query, wallet_address)
    except Exception as e:
        logger.warning(f"LangChain agent failed, falling back to legacy: {e}")
        if agent:
            return await agent.execute(query, wallet_address=wallet_address)
        raise


@app.post("/agents/{agent_id}/execute")
async def execute_single(agent_id: str, request: Request, body: ExecuteRequest) -> AgentResponse:
    if agent_id not in AGENT_REGISTRY:
        return AgentResponse(success=False, data=None, error=f"Unknown agent: {agent_id}")

    # ─── x402 middleware check (on-chain isAuthorized or x402 payment) ───
    payment_response = await x402_middleware_check(request, agent_id, body.wallet_address)
    if payment_response is not None:
        return payment_response

    try:
        result = await _execute_with_fallback(agent_id, body.query, body.wallet_address)
    except Exception as e:
        return AgentResponse(success=False, data=None, error=str(e))

    # Hedera attestation for single-agent calls
    hedera_proof = None
    if HEDERA_ENABLED:
        try:
            from hedera.attestation import attest_execution
            proof = await attest_execution(agent_id, body.query, result)
            hedera_proof = {
                "hcs_messages": [proof["hcs_tx"]] if proof.get("hcs_tx") else [],
                "agents_used": [agent_id],
            }
        except Exception:
            pass

    # AFC token reward — 1.00 AFC per execution
    afc_reward = None
    if HEDERA_ENABLED:
        try:
            from hedera.afc_rewards import reward_agent
            afc_reward = await reward_agent(agent_id)
        except Exception:
            pass

    # ─── Cross-agent collaboration (x402) ────────────────
    cross_agent_data = {"enhanced_result": result, "cross_agent_report": [], "x402_payments": []}
    if body.cross_agent:
        try:
            cross_agent_data = await cross_agent_service.execute_with_cross_agent(
                caller_agent_name=agent_id,
                query=body.query,
                main_result=result,
                cross_agent_enabled=True,
            )
        except Exception as e:
            logger.error(f"Cross-agent collaboration failed: {e}")

    # ─── x402 settlement (Pieverse /v2/settle) ───────────
    x402_settlement = None
    payment_data = getattr(request.state, "x402_payment", None)
    if payment_data:
        x402_settlement = await settle_x402_payment(payment_data)

    response_data = {
        "result": cross_agent_data["enhanced_result"],
        "hedera_proof": hedera_proof,
        "afc_reward": afc_reward,
        "cross_agent": {
            "enabled": body.cross_agent,
            "report": cross_agent_data["cross_agent_report"],
            "payments": cross_agent_data["x402_payments"],
        },
    }

    if x402_settlement:
        response_data["x402_settled"] = True
        return JSONResponse(
            content={"success": True, "data": response_data, "error": None},
            headers={"X-PAYMENT-RESPONSE": x402_settlement},
        )

    return AgentResponse(success=True, data=response_data, error=None)


@app.post("/orchestrate")
async def orchestrate(request: Request, body: ExecuteRequest) -> AgentResponse:
    """Chain all 3 agents: analyze -> score -> optimize."""
    # ─── x402 middleware check (uses portfolio_analyzer as representative agent) ───
    payment_response = await x402_middleware_check(request, "portfolio_analyzer", body.wallet_address)
    if payment_response is not None:
        return payment_response

    results = []
    all_hcs: list[str] = []
    all_afc: list[dict] = []
    agents_used: list[str] = []

    for agent_id in ["portfolio_analyzer", "risk_scorer", "yield_optimizer"]:
        try:
            result = await _execute_with_fallback(agent_id, body.query, body.wallet_address)
            results.append(f"## {agent_id.replace('_', ' ').title()}\n\n{result}")
            agents_used.append(agent_id)

            # Hedera attestation
            if HEDERA_ENABLED:
                try:
                    from hedera.attestation import attest_execution
                    proof = await attest_execution(agent_id, body.query, result)
                    if proof.get("hcs_tx"):
                        all_hcs.append(proof["hcs_tx"])
                except Exception:
                    pass

            # AFC token reward
            if HEDERA_ENABLED:
                try:
                    from hedera.afc_rewards import reward_agent
                    afc = await reward_agent(agent_id)
                    if afc.get("status"):
                        all_afc.append(afc)
                except Exception:
                    pass
        except Exception as e:
            results.append(f"## {agent_id.replace('_', ' ').title()}\n\nError: {e}")

    combined = "\n\n---\n\n".join(results)

    return AgentResponse(
        success=True,
        data={
            "result": combined,
            "hedera_proof": {
                "hcs_messages": all_hcs,
                "agents_used": agents_used,
            },
            "afc_rewards": all_afc,
        },
        error=None,
    )


@app.get("/payments/status")
async def payment_status() -> AgentResponse:
    provider = MockPaymentProvider()
    available = await provider.is_available()
    return AgentResponse(
        success=True,
        data={
            "provider": provider.name,
            "currency": provider.currency,
            "available": available,
        },
        error=None,
    )


# ── Dynamic agent endpoints ────────────────────────────────────────


class RegisterAgentRequest(BaseModel):
    agent_id: str
    name: str
    description: str
    system_prompt: str
    token_id: int
    price_per_call: float = 0.001
    x402_enabled: bool = False
    allow_cross_agent: bool = False


@app.post("/agents/register")
async def register_dynamic_agent(body: RegisterAgentRequest) -> AgentResponse:
    """Register a new dynamic agent (called after on-chain mint)."""
    # If agent_id already exists, try with token_id suffix to avoid collision
    agent_id = body.agent_id
    if agent_id in AGENT_REGISTRY:
        agent_id = f"{body.agent_id}_t{body.token_id}"
    if agent_id in AGENT_REGISTRY:
        return AgentResponse(success=False, data=None, error=f"Agent '{agent_id}' already exists")

    try:
        agent = registry_register(
            agent_id=agent_id,
            name=body.name,
            description=body.description,
            system_prompt=body.system_prompt,
            token_id=body.token_id,
            price_per_call=body.price_per_call,
            x402_enabled=body.x402_enabled,
            allow_cross_agent=body.allow_cross_agent,
        )
        # Add to the live orchestrator registry so it's immediately executable
        AGENT_REGISTRY[agent_id] = agent

        # Auto-register on Hedera (create topics) in background — don't block the response
        if HEDERA_ENABLED:
            import threading

            def _register_hedera() -> None:
                try:
                    from hedera.register_dynamic import register_agent_on_hedera
                    hedera_data = register_agent_on_hedera(agent_id, body.name)
                    if hedera_data and hedera_data.get("inbound"):
                        set_hedera_info(agent_id, hedera_data)
                        logger.info(f"Hedera registration for {agent_id}: {hedera_data}")
                except Exception as he:
                    logger.warning(f"Hedera registration failed for {agent_id} (non-blocking): {he}")

            threading.Thread(target=_register_hedera, daemon=True).start()

        return AgentResponse(
            success=True,
            data={
                "agent_id": agent_id,
                "token_id": body.token_id,
            },
            error=None,
        )
    except ValueError as e:
        return AgentResponse(success=False, data=None, error=str(e))


@app.get("/agents/token-map")
async def token_map() -> AgentResponse:
    """Returns full tokenId -> agent_id mapping (static + dynamic)."""
    tmap = get_token_map()
    # JSON keys must be strings
    return AgentResponse(success=True, data={str(k): v for k, v in tmap.items()}, error=None)


# ── x402 endpoints ─────────────────────────────────────────────────


@app.get("/agents/{agent_id}/x402")
async def get_x402_info(agent_id: str) -> AgentResponse:
    """Returns x402 payment requirements for this agent (discovery endpoint)."""
    token_id = AGENT_NAME_TO_TOKEN_ID.get(agent_id, 0)
    config = get_registry_config(token_id)

    if not config.get("x402_enabled", False):
        return AgentResponse(
            success=True,
            data={"x402_enabled": False, "message": "This agent does not accept x402 payments"},
            error=None,
        )

    return AgentResponse(
        success=True,
        data={
            "x402_enabled": True,
            "agent": agent_id,
            "pricing": {
                "afc": {
                    "network": "hedera-testnet",
                    "asset": "AFC (AgentFi Credits)",
                    "amount": config["price_afc"],
                    "description": "Pay in AFC for AgentFi inter-agent calls",
                },
                "usdt": {
                    "network": "kite-testnet (chain 2368)",
                    "asset": KITEAI_USDT_ADDRESS,
                    "amount": config["price_usdt"],
                    "description": "Pay in USDT via KiteAI x402 protocol",
                },
            },
            "payment_split": {
                "owner": "70%",
                "agent_reputation": "20%",
                "platform": "10%",
            },
            "x402Version": 2,
        },
        error=None,
    )


# ── Hedera endpoints ───────────────────────────────────────────────


@app.get("/hedera/status")
async def hedera_status() -> AgentResponse:
    """Check Hedera integration status — token, registered agents, connectivity."""
    from hedera.attestation import get_agent_topics

    token_id = os.environ.get("HEDERA_TOKEN_ID", "")
    agent_names = ["portfolio_analyzer", "yield_optimizer", "risk_scorer"]
    agents_info = {}
    for name in agent_names:
        topics = get_agent_topics(name)
        if topics.get("inbound"):
            agents_info[name] = topics

    return AgentResponse(
        success=True,
        data={
            "enabled": HEDERA_ENABLED,
            "network": "testnet",
            "operator": os.environ.get("HEDERA_ACCOUNT_ID", ""),
            "token_id": token_id,
            "token_explorer": f"https://hashscan.io/testnet/token/{token_id}" if token_id else None,
            "registered_agents": agents_info,
        },
        error=None,
    )


@app.get("/hedera/agents/{agent_id}/topics")
async def get_agent_topics_endpoint(agent_id: str) -> AgentResponse:
    """Get HCS-10 topic IDs for a registered agent."""
    from hedera.attestation import get_agent_topics

    topics = get_agent_topics(agent_id)
    if not topics.get("inbound"):
        return AgentResponse(success=False, data=None, error=f"Agent {agent_id} not registered on Hedera")

    return AgentResponse(
        success=True,
        data={
            "agent_id": agent_id,
            **topics,
            "inbound_explorer": f"https://hashscan.io/testnet/topic/{topics['inbound']}",
            "outbound_explorer": f"https://hashscan.io/testnet/topic/{topics['outbound']}",
        },
        error=None,
    )


@app.get("/hedera/accounts")
async def hedera_accounts() -> AgentResponse:
    """Return tokenId -> Hedera account mapping for all agents (static + dynamic)."""
    accounts = get_all_hedera_accounts()
    return AgentResponse(
        success=True,
        data={str(k): v for k, v in accounts.items()},
        error=None,
    )


@app.get("/hedera/afc-balances")
async def hedera_afc_balances() -> AgentResponse:
    """Return tokenId -> tracked AFC balance for dynamic agents."""
    balances = get_afc_balances()
    return AgentResponse(
        success=True,
        data={str(k): v for k, v in balances.items()},
        error=None,
    )


@app.get("/hedera/registration")
async def hedera_registration() -> AgentResponse:
    """Return cached registration results from the Node.js registration script."""
    results_path = Path(__file__).resolve().parent.parent / "scripts" / "hedera" / "registration-results.json"
    if not results_path.exists():
        return AgentResponse(success=False, data=None, error="No registration results found. Run scripts/hedera/register-agents.js first.")

    results = json.loads(results_path.read_text())
    return AgentResponse(success=True, data=results, error=None)


# ── ADI compliance endpoints ──────────────────────────────────────


class ComplianceExecuteRequest(BaseModel):
    """Request body for Mode B (compliant) execution."""
    query: str
    adi_payment_id: int
    wallet_address: str
    cross_agent: bool = False


@app.post("/agents/{agent_id}/execute-compliant")
async def execute_agent_compliant(
    agent_id: str,
    body: ComplianceExecuteRequest,
) -> AgentResponse:
    """
    Mode B: Compliant agent execution via ADI Chain.

    Flow:
    1. Verify user is KYC-verified on ADI
    2. Verify ADI payment exists and is PENDING
    3. Execute agent (same as Mode A)
    4. Record Hedera proofs (HCS + AFC)
    5. Write execution receipt back to ADI Chain
    6. Return result with compliance metadata
    """
    if agent_id not in AGENT_REGISTRY:
        return AgentResponse(success=False, data=None, error=f"Unknown agent: {agent_id}")

    # ─── Step 1: Verify KYC ─────────────────────────────
    if not adi_service.is_kyc_verified(body.wallet_address):
        return AgentResponse(
            success=False,
            data={"mode": "compliant", "reason": "kyc_required"},
            error="KYC verification required. Complete verification on ADI Chain first.",
        )

    # ─── Step 2: Verify ADI payment ─────────────────────
    payment = adi_service.verify_adi_payment(body.adi_payment_id)
    if not payment:
        return AgentResponse(
            success=False,
            data={"mode": "compliant", "reason": "payment_not_found"},
            error="No valid ADI payment found for this ID.",
        )

    if payment["status"] != "PENDING":
        return AgentResponse(
            success=False,
            data={"mode": "compliant", "status": payment["status"]},
            error="Payment already processed.",
        )

    # ─── Step 3: Execute agent (SAME as Mode A) ────────
    try:
        result = await _execute_with_fallback(agent_id, body.query, body.wallet_address)
    except Exception as e:
        return AgentResponse(success=False, data=None, error=str(e))

    # ─── Step 4: Hedera proofs (SAME as Mode A) ────────
    hedera_proof = None
    hedera_topic_id = ""
    if HEDERA_ENABLED:
        try:
            from hedera.attestation import attest_execution
            proof = await attest_execution(agent_id, body.query, result)
            hedera_topic_id = proof.get("topic_id", "")
            hedera_proof = {
                "hcs_messages": [proof["hcs_tx"]] if proof.get("hcs_tx") else [],
                "agents_used": [agent_id],
            }
        except Exception:
            pass

    afc_reward = None
    if HEDERA_ENABLED:
        try:
            from hedera.afc_rewards import reward_agent
            afc_reward = await reward_agent(agent_id)
        except Exception:
            pass

    # ─── Step 5: Cross-agent if enabled ─────────────────
    cross_agent_data = {"enhanced_result": result, "cross_agent_report": [], "x402_payments": []}
    if body.cross_agent:
        try:
            cross_agent_data = await cross_agent_service.execute_with_cross_agent(
                caller_agent_name=agent_id,
                query=body.query,
                main_result=result,
                cross_agent_enabled=True,
            )
        except Exception as e:
            logger.error(f"Cross-agent collaboration failed: {e}")

    # ─── Step 6: Record receipt on ADI Chain ────────────
    import hashlib
    execution_hash = "0x" + hashlib.sha256(result.encode()).hexdigest() if result else "0x0"

    adi_receipt_tx = await adi_service.record_execution_receipt(
        payment_id=body.adi_payment_id,
        hedera_topic_id=hedera_topic_id,
        execution_hash=execution_hash,
    )

    return AgentResponse(
        success=True,
        data={
            "result": cross_agent_data["enhanced_result"],
            "mode": "compliant",
            "compliance": {
                "kyc_verified": True,
                "jurisdiction": payment["jurisdiction"],
                "kyc_tier": payment["kyc_tier"],
                "adi_payment_id": body.adi_payment_id,
                "adi_amount": payment["amount_adi"],
                "adi_receipt_tx": adi_receipt_tx,
                "travel_rule_recorded": True,
            },
            "hedera_proof": hedera_proof,
            "afc_reward": afc_reward,
            "cross_agent": {
                "enabled": body.cross_agent,
                "report": cross_agent_data["cross_agent_report"],
                "payments": cross_agent_data["x402_payments"],
            },
        },
        error=None,
    )


@app.get("/adi/status")
async def adi_status() -> AgentResponse:
    """ADI Chain compliance status and statistics."""
    stats = adi_service.get_compliance_stats()
    return AgentResponse(success=True, data=stats, error=None)


@app.get("/adi/kyc/{wallet_address}")
async def adi_kyc_check(wallet_address: str) -> AgentResponse:
    """Check if a wallet is KYC-verified on ADI Chain."""
    is_verified = adi_service.is_kyc_verified(wallet_address)
    return AgentResponse(
        success=True,
        data={
            "wallet": wallet_address,
            "kyc_verified": is_verified,
            "chain": "ADI Testnet (99999)",
        },
        error=None,
    )


@app.get("/adi/payment/{payment_id}")
async def adi_payment_info(payment_id: int) -> AgentResponse:
    """Get ADI payment record details."""
    payment = adi_service.verify_adi_payment(payment_id)
    if not payment:
        return AgentResponse(success=False, data=None, error="Payment not found")
    return AgentResponse(success=True, data=payment, error=None)


class MockKYCRequest(BaseModel):
    wallet_address: str


@app.post("/adi/kyc/mock-verify")
async def adi_mock_kyc_verify(body: MockKYCRequest) -> AgentResponse:
    """Mock KYC verification for demo — adds wallet to in-memory verified set."""
    if hasattr(adi_service, "mock_verify_kyc"):
        adi_service.mock_verify_kyc(body.wallet_address)
        return AgentResponse(
            success=True,
            data={
                "wallet": body.wallet_address,
                "kyc_verified": True,
                "mock": True,
            },
            error=None,
        )
    return AgentResponse(
        success=False,
        data=None,
        error="Mock KYC not available (real ADI service active)",
    )


if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)

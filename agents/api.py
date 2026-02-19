from __future__ import annotations

import json
import logging
import os
from pathlib import Path
from typing import Any

import uvicorn
from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent / ".env", override=True)  # Must run before orchestrator import (reads HEDERA_ENABLED)

from fastapi import FastAPI  # noqa: E402
from fastapi.middleware.cors import CORSMiddleware  # noqa: E402
from pydantic import BaseModel  # noqa: E402

from agents.orchestrator import AGENT_REGISTRY, AgentOrchestrator, HEDERA_ENABLED  # noqa: E402
from agents.payments.mock_provider import MockPaymentProvider  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] [%(name)s] %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)

app = FastAPI(title="AgentFi API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExecuteRequest(BaseModel):
    query: str


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


@app.post("/agents/{agent_id}/execute")
async def execute_single(agent_id: str, body: ExecuteRequest) -> AgentResponse:
    agent = AGENT_REGISTRY.get(agent_id)
    if not agent:
        return AgentResponse(success=False, data=None, error=f"Unknown agent: {agent_id}")

    result = await agent.execute(body.query)

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

    return AgentResponse(
        success=True,
        data={"result": result, "hedera_proof": hedera_proof},
        error=None,
    )


@app.post("/orchestrate")
async def orchestrate(body: ExecuteRequest) -> AgentResponse:
    # Payment provider is resolved here.
    # To switch to x402: instantiate X402PaymentProvider() instead.
    orchestrator = AgentOrchestrator(payment_provider=MockPaymentProvider())
    output = await orchestrator.execute(body.query)
    return AgentResponse(
        success=True,
        data={
            "result": output["result"],
            "hedera_proof": output.get("hedera_proof"),
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


@app.get("/hedera/registration")
async def hedera_registration() -> AgentResponse:
    """Return cached registration results from the Node.js registration script."""
    results_path = Path(__file__).resolve().parent.parent / "scripts" / "hedera" / "registration-results.json"
    if not results_path.exists():
        return AgentResponse(success=False, data=None, error="No registration results found. Run scripts/hedera/register-agents.js first.")

    results = json.loads(results_path.read_text())
    return AgentResponse(success=True, data=results, error=None)


if __name__ == "__main__":
    uvicorn.run("api:app", host="0.0.0.0", port=8000, reload=True)

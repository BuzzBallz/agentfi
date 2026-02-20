"""
x402 Server Middleware — makes each agent endpoint respond to HTTP 402.
External agents and KiteAI-compatible clients can pay to use our agents.

Verification and settlement happen via the Pieverse facilitator:
  https://facilitator.pieverse.io/v2/verify
  https://facilitator.pieverse.io/v2/settle
"""

import base64
import json
import logging
import os

import httpx
from fastapi import Request
from fastapi.responses import JSONResponse

from x402.config import (
    AGENT_HEDERA_ACCOUNTS,
    AGENT_NAME_TO_TOKEN_ID,
    KITEAI_CHAIN_ID,
    KITEAI_USDT_ADDRESS,
    get_registry_config,
    is_authorized_on_chain,
)

logger = logging.getLogger(__name__)

PIEVERSE_FACILITATOR = "https://facilitator.pieverse.io"
KITE_WALLET_ADDRESS = os.getenv("KITE_WALLET_ADDRESS", "")
HEDERA_TOKEN_ID = os.getenv("HEDERA_TOKEN_ID", "")
HEDERA_MIRROR_NODE = "https://testnet.mirrornode.hedera.com"
X402_VERSION = 2


def _build_payment_requirements(agent_name: str, config: dict) -> dict:
    """Build the x402 paymentRequirements object for KiteAI USDT payments."""
    return {
        "scheme": "exact",
        "network": f"eip155:{KITEAI_CHAIN_ID}",
        "maxAmountRequired": str(int(config.get("price_usdt", 0.01) * 1_000_000)),
        "resource": f"/agents/{agent_name}/execute",
        "description": f"AgentFi {agent_name} — AI DeFi analysis via x402",
        "payTo": KITE_WALLET_ADDRESS,
        "mimeType": "application/json",
        "maxTimeoutSeconds": 300,
        "asset": KITEAI_USDT_ADDRESS,
    }


def create_402_response(agent_name: str, config: dict) -> JSONResponse:
    """
    Create a standard x402 Payment Required response.
    Lists both AFC (Hedera) and USDT (KiteAI) as accepted payment methods.
    """
    token_id = AGENT_NAME_TO_TOKEN_ID.get(agent_name, 0)

    accepts = []

    # Option 1: Pay in AFC via Hedera (for AgentFi internal agents)
    if config.get("price_afc", 0) > 0:
        accepts.append({
            "scheme": "hedera-hts",
            "network": "hedera-testnet",
            "asset": "AFC",
            "maxAmountRequired": str(int(config["price_afc"] * 100)),
            "resource": f"/agents/{agent_name}/execute",
            "description": f"AgentFi {agent_name} — inter-agent analysis",
            "payTo": config.get("agent_hedera_account", ""),
            "mimeType": "application/json",
            "maxTimeoutSeconds": 60,
            "extra": {
                "tokenId": token_id,
                "ownerAccount": config.get("owner_hedera_account", ""),
                "splitModel": "70-20-10",
            },
        })

    # Option 2: Pay in USDT via KiteAI x402 (for external agents)
    if config.get("price_usdt", 0) > 0:
        accepts.append(_build_payment_requirements(agent_name, config))

    return JSONResponse(
        status_code=402,
        content={
            "error": "X402PaymentRequired",
            "message": "This agent requires payment. Choose from the accepted payment methods below.",
            "accepts": accepts,
            "x402Version": X402_VERSION,
        },
        headers={
            "X-Payment-Required": "true",
        },
    )


async def _verify_hedera_payment(payment: dict, agent_name: str) -> dict | None:
    """
    Verify a Hedera HTS (AFC) payment via the Mirror Node API.
    Checks that the transaction exists, succeeded, and transferred the
    correct AFC token amount to the agent's Hedera account.
    Returns {"amount": str} on success, None on failure.
    """
    tx_hash = payment.get("txHash") or payment.get("transactionId")
    if not tx_hash:
        logger.warning("[x402] Hedera payment missing txHash/transactionId")
        return None

    try:
        token_id = AGENT_NAME_TO_TOKEN_ID.get(agent_name, 0)
        config = get_registry_config(token_id)
        expected_recipient = config.get("agent_hedera_account", AGENT_HEDERA_ACCOUNTS.get(token_id, ""))
        required_amount = int(config.get("price_afc", 1.0) * 100)  # AFC has 2 decimals

        # Mirror Node expects format like 0.0.12345-1234567890-123456789
        # Normalize: some clients send with @ instead of -
        normalized_tx = tx_hash.replace("@", "-")

        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{HEDERA_MIRROR_NODE}/api/v1/transactions/{normalized_tx}")

        if resp.status_code != 200:
            logger.warning(f"[x402] Mirror Node returned {resp.status_code} for tx {tx_hash}")
            return None

        tx_data = resp.json()
        transactions = tx_data.get("transactions", [])
        if not transactions:
            logger.warning(f"[x402] No transaction found for {tx_hash}")
            return None

        tx = transactions[0]

        # Check transaction succeeded
        if tx.get("result") != "SUCCESS":
            logger.warning(f"[x402] Hedera tx not successful: {tx.get('result')}")
            return None

        # Check token transfers for AFC token
        token_transfers = tx.get("token_transfers", [])
        for transfer in token_transfers:
            is_afc_token = transfer.get("token_id") == HEDERA_TOKEN_ID
            is_recipient = transfer.get("account") == expected_recipient
            amount = transfer.get("amount", 0)

            if is_afc_token and is_recipient and amount >= required_amount:
                return {"amount": str(amount)}

        logger.warning(
            f"[x402] Hedera tx {tx_hash} missing valid AFC transfer "
            f"(need {required_amount} to {expected_recipient})"
        )
        return None

    except Exception as e:
        logger.error(f"[x402] Hedera Mirror Node verification failed: {e}")
        return None


async def verify_x402_payment(request: Request, agent_name: str) -> dict | None:
    """
    Verify an x402 payment via the Pieverse facilitator /v2/verify.
    Returns payment details dict (including raw_payment + payment_requirements
    needed for later settlement) if valid, None if invalid / missing.
    """
    payment_header = request.headers.get("X-PAYMENT") or request.headers.get("x-payment")

    if not payment_header:
        return None

    try:
        decoded = base64.b64decode(payment_header)
        payment = json.loads(decoded)

        network = payment.get("network", "")

        # Non-EIP155 payment (e.g. Hedera HTS) — verify via Mirror Node
        if not network.startswith("eip155:"):
            verified = await _verify_hedera_payment(payment, agent_name)
            if verified:
                logger.info(f"[x402] Hedera payment VERIFIED for {agent_name}: {network}")
                return {
                    "verified": True,
                    "scheme": payment.get("scheme", "unknown"),
                    "network": network,
                    "amount": verified.get("amount", "0"),
                    "raw_payment": payment,
                }
            else:
                logger.warning(f"[x402] Hedera payment INVALID for {agent_name}: {network}")
                return None

        # EIP155 payment — verify via Pieverse facilitator
        token_id = AGENT_NAME_TO_TOKEN_ID.get(agent_name, 0)
        config = get_registry_config(token_id)
        payment_requirements = _build_payment_requirements(agent_name, config)

        async with httpx.AsyncClient(timeout=15) as client:
            resp = await client.post(
                f"{PIEVERSE_FACILITATOR}/v2/verify",
                json={
                    "x402Version": X402_VERSION,
                    "payment": payment,
                    "paymentRequirements": payment_requirements,
                },
            )

        if resp.status_code == 200:
            result = resp.json()
            if result.get("isValid"):
                logger.info(f"[x402] Payment VERIFIED for {agent_name} via Pieverse")
                return {
                    "verified": True,
                    "scheme": payment.get("scheme", "exact"),
                    "network": network,
                    "amount": payment_requirements["maxAmountRequired"],
                    "raw_payment": payment,
                    "payment_requirements": payment_requirements,
                }
            else:
                logger.warning(f"[x402] Payment INVALID for {agent_name}: {result}")
                return None
        else:
            logger.error(f"[x402] Pieverse /v2/verify returned {resp.status_code}: {resp.text}")
            return None

    except Exception as e:
        logger.error(f"[x402] Payment verification failed: {e}")
        return None


async def settle_x402_payment(payment_data: dict) -> str | None:
    """
    Settle a verified x402 payment via the Pieverse facilitator /v2/settle.
    Returns base64-encoded settlement receipt for the X-PAYMENT-RESPONSE header.
    Only settles EIP155 payments that have payment_requirements (KiteAI USDT).
    """
    if "payment_requirements" not in payment_data:
        return None

    try:
        async with httpx.AsyncClient(timeout=30) as client:
            resp = await client.post(
                f"{PIEVERSE_FACILITATOR}/v2/settle",
                json={
                    "x402Version": X402_VERSION,
                    "payment": payment_data["raw_payment"],
                    "paymentRequirements": payment_data["payment_requirements"],
                },
            )

        if resp.status_code == 200:
            result = resp.json()
            tx_hash = result.get("txHash", "unknown")
            logger.info(f"[x402] Payment SETTLED — tx: {tx_hash}")
            return base64.b64encode(json.dumps(result).encode()).decode()
        else:
            logger.error(f"[x402] Pieverse /v2/settle returned {resp.status_code}: {resp.text}")
            return None

    except Exception as e:
        logger.error(f"[x402] Payment settlement failed: {e}")
        return None


async def x402_middleware_check(
    request: Request, agent_name: str, wallet_address: str | None = None
) -> JSONResponse | None:
    """
    Check if the request needs x402 payment.

    Returns:
        None — if payment is not required or payment is valid
        JSONResponse(402) — if payment is required but not provided

    Side effect: stores verified payment data on request.state.x402_payment
    so that api.py can settle the payment after successful execution.
    """
    # Internal cross-agent call (pre-paid via AFC)
    if request.headers.get("X-AgentFi-Internal") == "true":
        return None

    # On-chain authorization via AgentNFTv2.isAuthorized()
    # User paid via hireAgent() on OG Chain → contract called authorizeUsage()
    if wallet_address:
        token_id = AGENT_NAME_TO_TOKEN_ID.get(agent_name, 0)
        if is_authorized_on_chain(token_id, wallet_address):
            logger.info(f"[x402] Wallet {wallet_address[:10]}... authorized on-chain for {agent_name}")
            return None

    # x402 payment header present — verify it
    payment = await verify_x402_payment(request, agent_name)
    if payment and payment.get("verified"):
        # Store for settlement after execution completes (used by api.py)
        request.state.x402_payment = payment
        return None

    # Check if x402 is enabled for this agent
    token_id = AGENT_NAME_TO_TOKEN_ID.get(agent_name, 0)
    config = get_registry_config(token_id)

    if not config.get("x402_enabled", False):
        return None

    # No valid payment found — return 402
    return create_402_response(agent_name, config)

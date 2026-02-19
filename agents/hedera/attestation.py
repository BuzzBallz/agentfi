"""On-chain attestation — submit proof of agent execution to Hedera."""

from __future__ import annotations

import hashlib
import logging
import os

from hedera.service_factory import get_hcs_service

logger = logging.getLogger(__name__)

# Map agent names → env var prefixes for their Hedera topic IDs
_AGENT_ENV_PREFIX = {
    "portfolio_analyzer": "HEDERA_PORTFOLIO_ANALYZER",
    "yield_optimizer": "HEDERA_YIELD_OPTIMIZER",
    "risk_scorer": "HEDERA_RISK_SCORER",
}


def get_agent_topics(agent_name: str) -> dict[str, str]:
    """Return inbound/outbound topic IDs for a registered agent."""
    prefix = _AGENT_ENV_PREFIX.get(agent_name, "")
    if not prefix:
        return {}
    return {
        "account": os.environ.get(f"{prefix}_ACCOUNT", ""),
        "inbound": os.environ.get(f"{prefix}_INBOUND_TOPIC", ""),
        "outbound": os.environ.get(f"{prefix}_OUTBOUND_TOPIC", ""),
    }


async def attest_execution(agent_name: str, query: str, result: str) -> dict:
    """Submit execution proof to Hedera. Non-blocking — errors are logged, not raised."""
    proof: dict[str, str | None] = {
        "hcs_tx": None,
    }

    try:
        topics = get_agent_topics(agent_name)
        # Use inbound topic — open for anyone to submit (no submit_key).
        # Outbound topics have a submit_key restricted to the agent's own key.
        inbound_topic = topics.get("inbound", "")

        if not inbound_topic:
            logger.debug("No inbound topic for %s — skipping attestation", agent_name)
            return proof

        result_hash = hashlib.sha256(result.encode()).hexdigest()
        hcs = get_hcs_service()
        attestation_data = f"execution_proof|agent={agent_name}|hash={result_hash}"
        proof["hcs_tx"] = hcs.submit_message(inbound_topic, agent_name, attestation_data)

    except Exception as e:
        logger.warning("[Hedera] Attestation failed for %s (non-blocking): %s", agent_name, e)

    return proof

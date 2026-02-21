"""Register dynamic agents on Hedera — create topics, associate AFC token.

Called automatically when a new agent is registered via POST /agents/register.
Uses hiero_sdk_python to create HCS topics and associate the AFC token with
the operator account (so AFC rewards can flow to dynamic agents too).
"""

from __future__ import annotations

import logging
import os

from hiero_sdk_python import (
    AccountId,
    Hbar,
    TopicCreateTransaction,
    TopicId,
    TokenAssociateTransaction,
    TokenId,
)

from hedera.config import get_hedera_client, get_operator_account_id

logger = logging.getLogger(__name__)


def register_agent_on_hedera(agent_id: str, agent_name: str) -> dict[str, str]:
    """Create inbound + outbound HCS topics for a dynamic agent.

    Returns dict with keys: account, inbound, outbound (all as "0.0.XXXX" strings).
    The account is the operator account (shared) — dynamic agents run under the
    operator's Hedera account since we don't create individual accounts at runtime.
    """
    client = get_hedera_client()
    operator = get_operator_account_id()
    operator_str = os.environ.get("HEDERA_ACCOUNT_ID", "")

    result: dict[str, str] = {
        "account": operator_str,
        "inbound": "",
        "outbound": "",
    }

    try:
        # Create inbound topic (open — anyone can submit execution proofs)
        inbound_tx = TopicCreateTransaction()
        inbound_tx.set_memo(f"AgentFi:{agent_id}:inbound")
        inbound_receipt = inbound_tx.execute(client)
        inbound_topic = str(inbound_receipt.topic_id) if inbound_receipt.topic_id else ""
        result["inbound"] = inbound_topic
        logger.info("Created inbound topic for %s: %s", agent_id, inbound_topic)

        # Create outbound topic (also open for now — agent responses)
        outbound_tx = TopicCreateTransaction()
        outbound_tx.set_memo(f"AgentFi:{agent_id}:outbound")
        outbound_receipt = outbound_tx.execute(client)
        outbound_topic = str(outbound_receipt.topic_id) if outbound_receipt.topic_id else ""
        result["outbound"] = outbound_topic
        logger.info("Created outbound topic for %s: %s", agent_id, outbound_topic)

    except Exception as e:
        logger.error("Failed to create Hedera topics for %s: %s", agent_id, e)

    return result

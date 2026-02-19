"""HCS-10 protocol message submission to Hedera."""

from __future__ import annotations

import json
import logging

from hiero_sdk_python import TopicId, TopicMessageSubmitTransaction

from hedera.config import get_hedera_client, get_operator_account_id

logger = logging.getLogger(__name__)


class HCSMessaging:
    """Submit HCS-10 formatted messages to Hedera Consensus Service topics."""

    def submit_message(
        self,
        topic_id_str: str,
        agent_id: str,
        message_data: str,
        op: str = "message",
    ) -> str:
        """Submit an HCS-10 message to a topic. Returns transaction ID."""
        client = get_hedera_client()
        operator = get_operator_account_id()

        hcs10_payload = json.dumps({
            "p": "hcs-10",
            "op": op,
            "data": message_data[:1024],
            "operator_id": f"{topic_id_str}@{operator}",
            "m": f"AgentFi:{agent_id}",
        })

        topic_id = TopicId.from_string(topic_id_str)

        tx = TopicMessageSubmitTransaction()
        tx.set_topic_id(topic_id)
        tx.set_message(hcs10_payload)

        logger.info("Submitting HCS-10 message to %s (agent=%s, op=%s)", topic_id_str, agent_id, op)
        receipt = tx.execute(client)

        tx_id = str(receipt.transaction_id) if receipt.transaction_id else "unknown"
        logger.info("HCS message submitted — tx: %s", tx_id)
        return tx_id

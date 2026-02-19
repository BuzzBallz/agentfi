"""Mock Hedera services — log actions without touching the network."""

from __future__ import annotations

import logging
import time
from dataclasses import dataclass

logger = logging.getLogger(__name__)

_call_counter = 0


def _next_id() -> int:
    global _call_counter
    _call_counter += 1
    return _call_counter


@dataclass
class MockTokenInfo:
    token_id: str
    name: str
    symbol: str
    decimals: int
    initial_supply: int


class MockHTSService:
    """Drop-in replacement for HTSService that never hits the network."""

    def create_fungible_token(
        self,
        name: str = "AgentFi Credits",
        symbol: str = "AFC",
        decimals: int = 2,
        initial_supply: int = 100_000,
    ) -> MockTokenInfo:
        fake_id = f"0.0.{9000 + _next_id()}"
        logger.info("[MOCK] Created HTS token %s (%s) → %s", name, symbol, fake_id)
        return MockTokenInfo(
            token_id=fake_id,
            name=name,
            symbol=symbol,
            decimals=decimals,
            initial_supply=initial_supply,
        )

    def transfer_tokens(
        self,
        token_id_str: str,
        from_account: str,
        to_account: str,
        amount: int,
    ) -> str:
        logger.info(
            "[MOCK] Transfer %d of %s: %s → %s",
            amount, token_id_str, from_account, to_account,
        )
        return "SUCCESS"


class MockHCSMessaging:
    """Drop-in replacement for HCSMessaging that never hits the network."""

    def submit_message(
        self,
        topic_id_str: str,
        agent_id: str,
        message_data: str,
        op: str = "message",
    ) -> str:
        fake_tx = f"0.0.{9000 + _next_id()}@{int(time.time())}.000"
        logger.info(
            "[MOCK] HCS-10 message to %s (agent=%s, op=%s) → tx %s",
            topic_id_str, agent_id, op, fake_tx,
        )
        return fake_tx

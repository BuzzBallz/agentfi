"""Real HTS service — creates tokens and executes transfers on Hedera testnet."""

from __future__ import annotations

import logging
from dataclasses import dataclass

from hiero_sdk_python import (
    AccountId,
    TokenCreateTransaction,
    TokenId,
    TransferTransaction,
)

from hedera.config import get_hedera_client, get_operator_account_id

logger = logging.getLogger(__name__)


@dataclass
class TokenInfo:
    token_id: str
    name: str
    symbol: str
    decimals: int
    initial_supply: int


class HTSService:
    """Hedera Token Service — create fungible tokens and transfer them."""

    def create_fungible_token(
        self,
        name: str = "AgentFi Credits",
        symbol: str = "AFC",
        decimals: int = 2,
        initial_supply: int = 100_000,
    ) -> TokenInfo:
        """Create a new HTS fungible token. Returns token metadata."""
        client = get_hedera_client()
        treasury = get_operator_account_id()

        tx = TokenCreateTransaction()
        tx.set_token_name(name)
        tx.set_token_symbol(symbol)
        tx.set_decimals(decimals)
        tx.set_initial_supply(initial_supply)
        tx.set_treasury_account_id(treasury)

        logger.info("Creating HTS token %s (%s) supply=%d …", name, symbol, initial_supply)
        receipt = tx.execute(client)
        token_id = receipt.token_id

        logger.info("Token created: %s", token_id)
        return TokenInfo(
            token_id=str(token_id),
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
        """Transfer fungible tokens between accounts. Returns tx status."""
        client = get_hedera_client()
        token_id = TokenId.from_string(token_id_str)
        sender = AccountId.from_string(from_account)
        receiver = AccountId.from_string(to_account)

        tx = TransferTransaction()
        tx.add_token_transfer(token_id, sender, -amount)
        tx.add_token_transfer(token_id, receiver, amount)

        logger.info(
            "Transferring %d of %s: %s → %s",
            amount, token_id_str, from_account, to_account,
        )
        receipt = tx.execute(client)

        logger.info("Transfer complete — status: %s", receipt.status)
        return str(receipt.status)

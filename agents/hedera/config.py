"""Hedera client configuration — singleton shared by all Hedera services."""

from __future__ import annotations

import logging
import os

from hiero_sdk_python import AccountId, Client, Network, PrivateKey

logger = logging.getLogger(__name__)

_client: Client | None = None


def get_hedera_client() -> Client:
    """Return a configured Hedera testnet client (cached singleton)."""
    global _client
    if _client is not None:
        return _client

    account_id_str = os.environ.get("HEDERA_ACCOUNT_ID") or os.environ.get("ACCOUNT_ID")
    private_key_str = os.environ.get("HEDERA_PRIVATE_KEY") or os.environ.get("PRIVATE_KEY")

    if not account_id_str or not private_key_str:
        raise RuntimeError(
            "Missing Hedera credentials. "
            "Set HEDERA_ACCOUNT_ID + HEDERA_PRIVATE_KEY in .env"
        )

    network = Network(network="testnet")
    client = Client(network)
    client.set_operator(
        AccountId.from_string(account_id_str),
        PrivateKey.from_string(private_key_str),
    )

    logger.info("Hedera client initialised for account %s (testnet)", account_id_str)
    _client = client
    return _client


def get_operator_account_id() -> AccountId:
    """Return the operator AccountId from env (no client needed)."""
    raw = os.environ.get("HEDERA_ACCOUNT_ID") or os.environ.get("ACCOUNT_ID", "")
    return AccountId.from_string(raw)

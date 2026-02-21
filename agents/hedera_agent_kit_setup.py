"""Hedera Agent Kit initialization — connects to Hedera testnet with all core plugins."""
from __future__ import annotations

import logging
import os

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)


def get_hedera_toolkit():
    """Create and return a configured HederaLangchainToolkit with all plugins."""
    from hedera_agent_kit.langchain.toolkit import HederaLangchainToolkit
    from hedera_agent_kit.plugins import (
        core_account_plugin,
        core_account_query_plugin,
        core_consensus_plugin,
        core_consensus_query_plugin,
        core_evm_plugin,
        core_evm_query_plugin,
        core_misc_query_plugin,
        core_token_plugin,
        core_token_query_plugin,
        core_transaction_query_plugin,
    )
    from hedera_agent_kit.shared.configuration import AgentMode, Configuration, Context
    from hiero_sdk_python import AccountId, Client, Network, PrivateKey

    account_id = os.getenv("HEDERA_ACCOUNT_ID", "")
    private_key = os.getenv("HEDERA_PRIVATE_KEY", "")

    if not account_id or not private_key:
        logger.warning("Hedera credentials not found — toolkit unavailable")
        return None

    try:
        client = Client(Network(network="testnet"))
        client.set_operator(
            AccountId.from_string(account_id),
            PrivateKey.from_string(private_key),
        )

        configuration = Configuration(
            tools=[],  # empty = load all tools from plugins
            context=Context(
                mode=AgentMode.AUTONOMOUS,
                account_id=account_id,
            ),
            plugins=[
                core_account_plugin,
                core_account_query_plugin,
                core_token_plugin,
                core_token_query_plugin,
                core_consensus_plugin,
                core_consensus_query_plugin,
                core_evm_plugin,
                core_evm_query_plugin,
                core_misc_query_plugin,
                core_transaction_query_plugin,
            ],
        )

        toolkit = HederaLangchainToolkit(
            client=client,
            configuration=configuration,
        )

        tools = toolkit.get_tools()
        logger.info(f"Hedera Agent Kit initialized with {len(tools)} tools")
        for t in tools:
            logger.info(f"  Tool: {t.name}")
        return toolkit

    except Exception as e:
        logger.error(f"Failed to initialize Hedera Agent Kit: {e}")
        return None

#!/usr/bin/env python3
"""One-time script: create agent accounts, associate AFC token, and fund them.

Creates new Hedera accounts controlled by the operator's key so that:
- The operator can sign TokenAssociateTransaction for each agent
- The operator can transfer AFC tokens to each agent
- AFC rewards (afc_rewards.py) can transfer AFC during execution

Usage:
    cd agents/
    python -m hedera.init_afc_token

Requires:
- HEDERA_ACCOUNT_ID + HEDERA_PRIVATE_KEY in .env (operator)
- HEDERA_TOKEN_ID in .env (AFC token)
"""

from __future__ import annotations

import json
import logging
import os
import sys
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from hiero_sdk_python import (  # noqa: E402
    AccountCreateTransaction,
    AccountId,
    Hbar,
    PrivateKey,
    TokenAssociateTransaction,
    TokenId,
    TransferTransaction,
)
from hedera.config import get_hedera_client, get_operator_account_id  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)

INITIAL_AFC_PER_AGENT = 1_000  # 10.00 AFC (2 decimals)

AGENTS = [
    {"name": "portfolio_analyzer", "label": "AgentFi Portfolio Analyzer"},
    {"name": "yield_optimizer", "label": "AgentFi Yield Optimizer"},
    {"name": "risk_scorer", "label": "AgentFi Risk Scorer"},
]


def main() -> None:
    token_id_str = os.environ.get("HEDERA_TOKEN_ID", "")
    if not token_id_str:
        logger.error("HEDERA_TOKEN_ID not set in .env")
        sys.exit(1)

    private_key_str = os.environ.get("HEDERA_PRIVATE_KEY", "")
    if not private_key_str:
        logger.error("HEDERA_PRIVATE_KEY not set in .env")
        sys.exit(1)

    client = get_hedera_client()
    operator = get_operator_account_id()
    token_id = TokenId.from_string(token_id_str)
    operator_key = PrivateKey.from_string(private_key_str)

    logger.info("AFC Token: %s", token_id_str)
    logger.info("Operator: %s", operator)
    logger.info("Creating %d agent accounts with operator's key...\n", len(AGENTS))

    results = {}

    for agent in AGENTS:
        agent_name = agent["name"]
        agent_label = agent["label"]

        # Step 1: Create new account with operator's public key
        logger.info("[%s] Creating Hedera account...", agent_label)
        try:
            create_tx = AccountCreateTransaction(
                key=operator_key.public_key(),
                initial_balance=Hbar(1),  # 1 HBAR for fees
            )
            create_tx.set_account_memo(f"AgentFi:{agent_name}")
            create_receipt = create_tx.execute(client)
            new_account_id = create_receipt.account_id
            new_account_str = str(new_account_id)
            logger.info("[%s] Account created: %s", agent_label, new_account_str)
        except Exception as e:
            logger.error("[%s] Account creation failed: %s", agent_label, e)
            continue

        # Step 2: Associate AFC token with the new account
        logger.info("[%s] Associating AFC token...", agent_label)
        try:
            assoc_tx = TokenAssociateTransaction()
            assoc_tx.set_account_id(new_account_id)
            assoc_tx.add_token_id(token_id)
            assoc_receipt = assoc_tx.execute(client)
            logger.info("[%s] Association status: %s", agent_label, assoc_receipt.status)
        except Exception as e:
            logger.error("[%s] Association failed: %s", agent_label, e)
            continue

        # Step 3: Transfer AFC to the new account
        logger.info("[%s] Transferring %.2f AFC...", agent_label, INITIAL_AFC_PER_AGENT / 100)
        try:
            tx = TransferTransaction()
            tx.add_token_transfer(token_id, operator, -INITIAL_AFC_PER_AGENT)
            tx.add_token_transfer(token_id, new_account_id, INITIAL_AFC_PER_AGENT)
            transfer_receipt = tx.execute(client)
            logger.info("[%s] Transfer status: %s", agent_label, transfer_receipt.status)
        except Exception as e:
            logger.error("[%s] Transfer failed: %s", agent_label, e)
            continue

        results[agent_name] = new_account_str
        logger.info("[%s] DONE — account %s funded with %.2f AFC\n",
                     agent_label, new_account_str, INITIAL_AFC_PER_AGENT / 100)

    if not results:
        logger.error("No accounts created successfully!")
        sys.exit(1)

    # Print .env update instructions
    print("\n" + "=" * 60)
    print("UPDATE YOUR .env WITH THESE NEW ACCOUNT IDs:")
    print("=" * 60)
    for agent_name, account_id in results.items():
        env_key = f"HEDERA_{agent_name.upper()}_ACCOUNT"
        print(f"{env_key}={account_id}")
    print("=" * 60)

    # Print HashScan links
    print("\nHashScan links:")
    for agent_name, account_id in results.items():
        print(f"  {agent_name}: https://hashscan.io/testnet/account/{account_id}")

    # Print AFC token verification
    print(f"\nAFC Token: https://hashscan.io/testnet/token/{token_id_str}")

    # Save results
    out_path = Path(__file__).resolve().parent.parent.parent / "scripts" / "hedera" / "afc-token-results.json"
    out_data = {
        "tokenId": token_id_str,
        "name": "AgentFi Credits",
        "symbol": "AFC",
        "decimals": 2,
        "initialSupply": 100_000,
        "explorer": f"https://hashscan.io/testnet/token/{token_id_str}",
        "agents": {
            agent_name: {
                "accountId": account_id,
                "initialBalance": f"{INITIAL_AFC_PER_AGENT / 100:.2f} AFC",
                "hashscan": f"https://hashscan.io/testnet/account/{account_id}",
            }
            for agent_name, account_id in results.items()
        },
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(out_data, indent=2) + "\n")
    logger.info("Results saved to %s", out_path)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        logger.error("AFC init failed: %s", exc)
        sys.exit(1)

#!/usr/bin/env python3
"""One-time script: create the AFC fungible token on Hedera testnet.

Usage:
    cd agents/
    python -m hedera.create_token

Requires HEDERA_ACCOUNT_ID + HEDERA_PRIVATE_KEY in .env (or env vars).
"""

from __future__ import annotations

import json
import logging
import sys
from pathlib import Path

from dotenv import load_dotenv

# Load .env from agents/ directory
load_dotenv(Path(__file__).resolve().parent.parent / ".env")

from hedera.hts_service import HTSService  # noqa: E402

logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(message)s",
    datefmt="%H:%M:%S",
)
logger = logging.getLogger(__name__)


def main() -> None:
    svc = HTSService()

    logger.info("Creating AgentFi Credits (AFC) token on Hedera testnet …")
    token = svc.create_fungible_token(
        name="AgentFi Credits",
        symbol="AFC",
        decimals=2,
        initial_supply=100_000,  # = 1,000.00 AFC
    )

    logger.info("✔ Token created successfully!")
    logger.info("  Token ID : %s", token.token_id)
    logger.info("  Name     : %s", token.name)
    logger.info("  Symbol   : %s", token.symbol)
    logger.info("  Decimals : %d", token.decimals)
    logger.info("  Supply   : %d (= %.2f %s)", token.initial_supply, token.initial_supply / 10**token.decimals, token.symbol)
    logger.info("")
    logger.info("View on HashScan: https://hashscan.io/testnet/token/%s", token.token_id)

    # Save token ID for later use
    out_path = Path(__file__).resolve().parent.parent / "hedera_token.json"
    payload = {
        "token_id": token.token_id,
        "name": token.name,
        "symbol": token.symbol,
        "decimals": token.decimals,
        "initial_supply": token.initial_supply,
        "explorer": f"https://hashscan.io/testnet/token/{token.token_id}",
    }
    out_path.write_text(json.dumps(payload, indent=2) + "\n")
    logger.info("Saved token info to %s", out_path)


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        logger.error("Token creation failed: %s", exc)
        sys.exit(1)

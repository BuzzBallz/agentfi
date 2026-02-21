"""
AFC Payment Service — handles agent-to-agent payments on Hedera HTS.
Splits payment: 70% owner / 20% agent / 10% platform.
"""

import logging

from hedera.hts_service import HTSService
from x402.config import AFC_SPLIT_AGENT, AFC_SPLIT_OWNER, AFC_SPLIT_PLATFORM, OPERATOR_HEDERA_ACCOUNT

logger = logging.getLogger(__name__)


class AFCPaymentService:
    """Handles AFC token transfers for x402 inter-agent payments."""

    def __init__(self, hts_service: HTSService, afc_token_id: str):
        self.hts = hts_service
        self.afc_token_id = afc_token_id

    async def process_inter_agent_payment(
        self,
        payer_agent_account: str,
        target_agent_account: str,
        target_owner_account: str,
        total_amount_afc: float,
    ) -> dict:
        """
        Process an inter-agent payment with the 70/20/10 split.
        All transfers are non-blocking — if one fails, others still attempt.
        """
        owner_share = round(total_amount_afc * AFC_SPLIT_OWNER, 2)
        agent_share = round(total_amount_afc * AFC_SPLIT_AGENT, 2)
        platform_share = round(total_amount_afc * AFC_SPLIT_PLATFORM, 2)

        remainder = round(total_amount_afc - owner_share - agent_share - platform_share, 2)
        if remainder > 0:
            owner_share = round(owner_share + remainder, 2)

        platform_account = OPERATOR_HEDERA_ACCOUNT

        result = {
            "total_amount": f"{total_amount_afc:.2f} AFC",
            "splits": {},
            "success": False,
        }

        # Transfer 1: Payer Agent → Owner of called agent (70%)
        try:
            tx1 = self.hts.transfer_tokens(
                token_id_str=self.afc_token_id,
                from_account=payer_agent_account,
                to_account=target_owner_account,
                amount=int(owner_share * 100),
            )
            result["splits"]["owner_payment"] = {
                "to": target_owner_account,
                "amount": f"{owner_share:.2f} AFC",
                "tx_id": tx1,
                "hashscan_url": f"https://hashscan.io/testnet/transaction/{tx1}" if tx1 else None,
                "status": "success" if tx1 else "failed",
            }
        except Exception as e:
            logger.error(f"AFC owner payment failed: {e}")
            result["splits"]["owner_payment"] = {"status": "failed", "error": str(e)}

        # Transfer 2: Payer Agent → Called Agent account (20% — reputation)
        try:
            tx2 = self.hts.transfer_tokens(
                token_id_str=self.afc_token_id,
                from_account=payer_agent_account,
                to_account=target_agent_account,
                amount=int(agent_share * 100),
            )
            result["splits"]["agent_credit"] = {
                "to": target_agent_account,
                "amount": f"{agent_share:.2f} AFC",
                "tx_id": tx2,
                "hashscan_url": f"https://hashscan.io/testnet/transaction/{tx2}" if tx2 else None,
                "status": "success" if tx2 else "failed",
            }
        except Exception as e:
            logger.error(f"AFC agent credit failed: {e}")
            result["splits"]["agent_credit"] = {"status": "failed", "error": str(e)}

        # Transfer 3: Payer Agent → Platform (10%)
        try:
            tx3 = self.hts.transfer_tokens(
                token_id_str=self.afc_token_id,
                from_account=payer_agent_account,
                to_account=platform_account,
                amount=int(platform_share * 100),
            )
            result["splits"]["platform_fee"] = {
                "to": platform_account,
                "amount": f"{platform_share:.2f} AFC",
                "tx_id": tx3,
                "hashscan_url": f"https://hashscan.io/testnet/transaction/{tx3}" if tx3 else None,
                "status": "success" if tx3 else "failed",
            }
        except Exception as e:
            logger.error(f"AFC platform fee failed: {e}")
            result["splits"]["platform_fee"] = {"status": "failed", "error": str(e)}

        result["success"] = result["splits"].get("owner_payment", {}).get("status") == "success"

        return result


class MockAFCPaymentService:
    """Mock for local testing without Hedera."""

    def __init__(self):
        self.afc_token_id = "0.0.MOCK"

    async def process_inter_agent_payment(
        self,
        payer_agent_account: str,
        target_agent_account: str,
        target_owner_account: str,
        total_amount_afc: float,
    ) -> dict:
        logger.info(
            f"[MOCK] AFC inter-agent payment: {payer_agent_account} -> "
            f"{target_agent_account} ({total_amount_afc:.2f} AFC)"
        )
        return {
            "total_amount": f"{total_amount_afc:.2f} AFC",
            "splits": {
                "owner_payment": {"to": target_owner_account, "amount": f"{total_amount_afc * 0.70:.2f} AFC", "tx_id": "mock-tx-owner", "status": "success"},
                "agent_credit": {"to": target_agent_account, "amount": f"{total_amount_afc * 0.20:.2f} AFC", "tx_id": "mock-tx-agent", "status": "success"},
                "platform_fee": {"to": "mock-platform", "amount": f"{total_amount_afc * 0.10:.2f} AFC", "tx_id": "mock-tx-platform", "status": "success"},
            },
            "success": True,
            "mock": True,
        }

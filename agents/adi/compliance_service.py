"""
ADI Compliance Service — verifies KYC status and records payments on ADI Chain.
This is the backend bridge between ADI Chain (compliance) and Hedera (execution).

Mode B users (compliant) flow through this service.
Mode A users (permissionless) skip it entirely.
"""

import logging
import os
from typing import Optional

from web3 import Web3

logger = logging.getLogger(__name__)

# ADI Chain config
ADI_RPC = os.getenv("ADI_RPC_URL", "https://rpc.ab.testnet.adifoundation.ai/")
ADI_CHAIN_ID = 99999
ADI_EXPLORER = "https://explorer.ab.testnet.adifoundation.ai"
ADI_PAYMENTS_ADDRESS = os.getenv("ADI_PAYMENTS_ADDRESS", "0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd")
ADI_PAYMASTER_ADDRESS = os.getenv("ADI_PAYMASTER_ADDRESS", "0xBeD159217F43711c32fB6D57e4b203aEbC46B74A")

# Minimal ABI for reads + recordExecutionReceipt
ADI_PAYMENTS_ABI = [
    {
        "inputs": [{"name": "user", "type": "address"}],
        "name": "kycVerified",
        "outputs": [{"name": "", "type": "bool"}],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [{"name": "paymentId", "type": "uint256"}],
        "name": "getPaymentRecord",
        "outputs": [{
            "name": "",
            "type": "tuple",
            "components": [
                {"name": "originator", "type": "address"},
                {"name": "originatorJurisdiction", "type": "string"},
                {"name": "originatorKYCTier", "type": "uint256"},
                {"name": "beneficiary", "type": "address"},
                {"name": "beneficiaryName", "type": "string"},
                {"name": "amount", "type": "uint256"},
                {"name": "timestamp", "type": "uint256"},
                {"name": "agentServiceId", "type": "uint256"},
                {"name": "agentName", "type": "string"},
                {"name": "hederaTopicId", "type": "string"},
                {"name": "executionHash", "type": "string"},
                {"name": "purposeOfPayment", "type": "string"},
                {"name": "status", "type": "uint8"},
            ]
        }],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [],
        "name": "getComplianceStats",
        "outputs": [
            {"name": "_totalKYCUsers", "type": "uint256"},
            {"name": "_totalPayments", "type": "uint256"},
            {"name": "_totalVolumeADI", "type": "uint256"},
            {"name": "_serviceCount", "type": "uint256"},
        ],
        "stateMutability": "view",
        "type": "function",
    },
    {
        "inputs": [
            {"name": "paymentId", "type": "uint256"},
            {"name": "hederaTopicId", "type": "string"},
            {"name": "executionHash", "type": "string"},
        ],
        "name": "recordExecutionReceipt",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function",
    },
]


class ADIComplianceService:
    """
    Bridge between ADI Chain (compliance) and the AgentFi backend.

    Provides:
    1. KYC verification check (is this wallet whitelisted on ADI?)
    2. Payment verification (did this user pay on ADI for this agent?)
    3. Execution receipt recording (write Hedera proof back to ADI)
    4. Compliance statistics for frontend display
    """

    def __init__(self):
        self.enabled = bool(ADI_PAYMENTS_ADDRESS)
        if self.enabled:
            self.w3 = Web3(Web3.HTTPProvider(ADI_RPC))
            self.contract = self.w3.eth.contract(
                address=Web3.to_checksum_address(ADI_PAYMENTS_ADDRESS),
                abi=ADI_PAYMENTS_ABI,
            )
            self.private_key = os.getenv("DEPLOYER_PRIVATE_KEY", "")
            self.account = self.w3.eth.account.from_key(self.private_key) if self.private_key else None
            logger.info(f"[ADI] Compliance service initialized. Contract: {ADI_PAYMENTS_ADDRESS}")
        else:
            logger.info("[ADI] Compliance service disabled (no ADI_PAYMENTS_ADDRESS)")

    def is_kyc_verified(self, wallet_address: str) -> bool:
        """Check if a wallet is KYC-verified on ADI Chain."""
        if not self.enabled:
            return False
        try:
            return self.contract.functions.kycVerified(
                Web3.to_checksum_address(wallet_address)
            ).call()
        except Exception as e:
            logger.error(f"[ADI] KYC check failed: {e}")
            return False

    def verify_adi_payment(self, payment_id: int) -> Optional[dict]:
        """Verify a payment was made on ADI Chain and retrieve its details."""
        if not self.enabled:
            return None
        try:
            record = self.contract.functions.getPaymentRecord(payment_id).call()
            return {
                "originator": record[0],
                "jurisdiction": record[1],
                "kyc_tier": record[2],
                "amount_wei": record[5],
                "amount_adi": str(self.w3.from_wei(record[5], "ether")),
                "timestamp": record[6],
                "agent_service_id": record[7],
                "agent_name": record[8],
                "hedera_topic_id": record[9],
                "execution_hash": record[10],
                "status": ["PENDING", "COMPLETED", "REFUNDED"][record[12]],
            }
        except Exception as e:
            logger.error(f"[ADI] Payment verification failed: {e}")
            return None

    async def record_execution_receipt(
        self,
        payment_id: int,
        hedera_topic_id: str,
        execution_hash: str,
    ) -> Optional[str]:
        """
        Write execution receipt back to ADI Chain after Hedera execution.
        Creates the cross-chain proof link: ADI payment -> Hedera execution.
        """
        if not self.enabled or not self.account:
            logger.warning("[ADI] Cannot record receipt: service disabled or no key")
            return None
        try:
            tx = self.contract.functions.recordExecutionReceipt(
                payment_id,
                hedera_topic_id,
                execution_hash,
            ).build_transaction({
                "from": self.account.address,
                "nonce": self.w3.eth.get_transaction_count(self.account.address),
                "gasPrice": self.w3.eth.gas_price,
                "chainId": ADI_CHAIN_ID,
            })

            signed = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed.raw_transaction)
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash, timeout=60)

            logger.info(f"[ADI] Execution receipt recorded. TX: {tx_hash.hex()}")
            return tx_hash.hex()
        except Exception as e:
            logger.error(f"[ADI] Receipt recording failed: {e}")
            return None

    def get_compliance_stats(self) -> dict:
        """Get compliance statistics for display."""
        if not self.enabled:
            return {"enabled": False}
        try:
            stats = self.contract.functions.getComplianceStats().call()
            return {
                "enabled": True,
                "total_kyc_users": stats[0],
                "total_payments": stats[1],
                "total_volume_adi": str(self.w3.from_wei(stats[2], "ether")),
                "service_count": stats[3],
                "contract": ADI_PAYMENTS_ADDRESS,
                "paymaster": ADI_PAYMASTER_ADDRESS,
                "explorer_url": f"{ADI_EXPLORER}/address/{ADI_PAYMENTS_ADDRESS}",
            }
        except Exception as e:
            logger.error(f"[ADI] Stats fetch failed: {e}")
            return {"enabled": True, "error": str(e)}


class MockADIComplianceService:
    """Mock for local testing / demo without ADI chain access."""

    def __init__(self):
        self.enabled = True
        self._verified_wallets: set = set()

    def is_kyc_verified(self, wallet_address: str) -> bool:
        return wallet_address.lower() in self._verified_wallets

    def mock_verify_kyc(self, wallet_address: str) -> bool:
        """Add a wallet to the in-memory KYC verified set."""
        self._verified_wallets.add(wallet_address.lower())
        logger.info(f"[ADI-Mock] KYC verified: {wallet_address}")
        return True

    def verify_adi_payment(self, payment_id: int) -> Optional[dict]:
        return None

    async def record_execution_receipt(self, *args) -> Optional[str]:
        return None

    def get_compliance_stats(self) -> dict:
        return {
            "enabled": True,
            "mock": True,
            "total_kyc_users": len(self._verified_wallets),
            "total_payments": 12,
            "total_volume_adi": "0.142",
            "service_count": 3,
            "explorer_url": f"{ADI_EXPLORER}",
        }

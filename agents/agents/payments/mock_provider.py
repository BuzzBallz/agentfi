from __future__ import annotations

import logging

from agents.payments.base_payment import BasePaymentProvider, PaymentResult

logger = logging.getLogger(__name__)


class MockPaymentProvider(BasePaymentProvider):
    """
    Mock payment provider for development and hackathon demo.
    Logs payments without executing them on-chain.
    Replace with X402PaymentProvider for real x402/Kite AI integration.
    """

    name = "mock"
    currency = "MOCK"

    async def charge(
        self,
        from_address: str,
        to_address: str,
        amount: float,
        metadata: dict[str, object],
    ) -> PaymentResult:
        logger.info(
            "[mock_payment] %s -> %s | %s %s | metadata=%s",
            from_address,
            to_address,
            amount,
            self.currency,
            metadata,
        )
        return PaymentResult(
            success=True,
            transaction_id=f"mock-{id(metadata)}",
            amount=amount,
            currency=self.currency,
            error=None,
        )

    async def is_available(self) -> bool:
        return True

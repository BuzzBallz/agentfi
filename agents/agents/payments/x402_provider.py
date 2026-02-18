from __future__ import annotations

from agents.payments.base_payment import BasePaymentProvider, PaymentResult


class X402PaymentProvider(BasePaymentProvider):
    """
    Kite AI x402 payment provider.

    TODO — implement when ready:
    - Install: pip install kite-sdk (or x402 equivalent)
    - Requires env vars: KITE_API_KEY, KITE_AGENT_PASSPORT_ID
    - Docs: https://docs.kite.ai / https://x402.org

    This provider enables agent-to-agent micropayments in pieUSD
    on every orchestrator step execution.
    """

    name = "x402"
    currency = "pieUSD"

    async def charge(
        self,
        from_address: str,
        to_address: str,
        amount: float,
        metadata: dict[str, object],
    ) -> PaymentResult:
        raise NotImplementedError(
            "X402PaymentProvider not implemented yet. "
            "Use MockPaymentProvider in development."
        )

    async def is_available(self) -> bool:
        return False  # flip to True once implemented

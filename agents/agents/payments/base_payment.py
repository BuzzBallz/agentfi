from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass


@dataclass
class PaymentResult:
    success: bool
    transaction_id: str | None
    amount: float
    currency: str
    error: str | None


class BasePaymentProvider(ABC):
    """
    Abstract payment provider.
    Implement this interface to add any payment rail (x402, Stripe, etc.)
    """

    name: str
    currency: str

    @abstractmethod
    async def charge(
        self,
        from_address: str,
        to_address: str,
        amount: float,
        metadata: dict[str, object],
    ) -> PaymentResult:
        """Charge from_address -> to_address for amount in self.currency."""
        ...

    @abstractmethod
    async def is_available(self) -> bool:
        """Return True if the payment provider is configured and reachable."""
        ...

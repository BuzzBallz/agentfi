from abc import ABC, abstractmethod


class BaseAgent(ABC):
    name: str
    description: str
    price_per_call: float  # in HBAR

    @abstractmethod
    async def execute(self, query: str) -> str:
        """Run the agent logic and return a string result."""
        ...

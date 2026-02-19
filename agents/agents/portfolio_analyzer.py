from anthropic import AsyncAnthropic
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = (
    "You are a DeFi portfolio analyzer. Given a wallet address or portfolio "
    "description, analyze the composition and provide a concise breakdown."
)


class PortfolioAnalyzerAgent(BaseAgent):
    name: str = "portfolio_analyzer"
    description: str = "Analyzes DeFi portfolio composition and allocation"
    price_per_call: float = 0.5

    async def execute(self, query: str) -> str:
        try:
            client = AsyncAnthropic()
            response = await client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=500,
                system=SYSTEM_PROMPT,
                messages=[
                    {"role": "user", "content": query},
                ],
            )
            return response.content[0].text or ""
        except Exception as e:
            return f"Agent error: {str(e)}"

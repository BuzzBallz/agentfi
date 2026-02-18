from openai import AsyncOpenAI
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
            client = AsyncOpenAI()
            response = await client.chat.completions.create(
                model="gpt-4o-mini",
                max_tokens=500,
                messages=[
                    {"role": "system", "content": SYSTEM_PROMPT},
                    {"role": "user", "content": query},
                ],
            )
            return response.choices[0].message.content or ""
        except Exception as e:
            return f"Agent error: {str(e)}"

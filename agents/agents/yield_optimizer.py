from openai import AsyncOpenAI
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = (
    "You are a DeFi yield optimizer. Given a portfolio or risk profile, "
    "recommend optimal yield strategies with specific APY ranges. "
    "Focus on practical, actionable recommendations."
)


class YieldOptimizerAgent(BaseAgent):
    name: str = "yield_optimizer"
    description: str = "Recommends optimal yield strategies based on risk profile"
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

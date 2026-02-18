from openai import AsyncOpenAI
from agents.base_agent import BaseAgent

SYSTEM_PROMPT = (
    "You are a DeFi risk scorer. Given a portfolio description or token, "
    "score the risk on a scale of 1-10 (1 = very safe, 10 = extremely risky). "
    "Return a structured response with the score and a brief explanation."
)


class RiskScorerAgent(BaseAgent):
    name: str = "risk_scorer"
    description: str = "Scores portfolio or token risk on a scale of 1-10"
    price_per_call: float = 0.3

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

from anthropic import AsyncAnthropic
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

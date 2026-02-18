import json
import logging
from typing import Any

from openai import AsyncOpenAI

from agents.base_agent import BaseAgent
from agents.portfolio_analyzer import PortfolioAnalyzerAgent
from agents.yield_optimizer import YieldOptimizerAgent
from agents.risk_scorer import RiskScorerAgent

logger = logging.getLogger(__name__)

# Registry — add new agents here, nowhere else
AGENT_REGISTRY: dict[str, BaseAgent] = {
    "portfolio_analyzer": PortfolioAnalyzerAgent(),
    "yield_optimizer": YieldOptimizerAgent(),
    "risk_scorer": RiskScorerAgent(),
}

ROUTER_PROMPT = """
You are an agent orchestrator. Given a user query, return a JSON execution plan.
Available agents: portfolio_analyzer, yield_optimizer, risk_scorer.

Rules:
- Use only agents that are truly needed for this query
- Use {step_N} to pass the output of step N as input to a later step
- Maximum 4 steps

Return ONLY valid JSON, no markdown, no explanation:
{
  "steps": [
    { "agent": "portfolio_analyzer", "input": "analyze the user portfolio" },
    { "agent": "risk_scorer", "input": "score this portfolio: {step_0}" }
  ]
}
"""


class AgentOrchestrator:
    def __init__(self) -> None:
        self.client = AsyncOpenAI()

    async def _plan(self, query: str) -> list[dict[str, Any]]:
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=300,
            messages=[
                {"role": "system", "content": ROUTER_PROMPT},
                {"role": "user", "content": query},
            ],
        )
        content = response.choices[0].message.content or "{}"
        return json.loads(content)["steps"]

    async def execute(self, query: str) -> str:
        steps = await self._plan(query)
        outputs: list[str] = []

        for i, step in enumerate(steps):
            agent_name: str = step["agent"]
            agent_input: str = step["input"]

            # Inject previous outputs using {step_N} placeholders
            for j, prev in enumerate(outputs):
                agent_input = agent_input.replace(f"{{step_{j}}}", prev)

            agent = AGENT_REGISTRY.get(agent_name)
            if not agent:
                outputs.append(f"[unknown agent: {agent_name}]")
                continue

            logger.info("[orchestrator] step %d: %s", i, agent_name)
            result = await agent.execute(agent_input)
            outputs.append(result)

        return outputs[-1] if outputs else "No result produced."

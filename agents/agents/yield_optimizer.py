"""Yield Optimizer Agent — uses real APY data from DeFi Llama + Bonzo Finance."""
from anthropic import AsyncAnthropic
from agents.base_agent import BaseAgent
from agents.defi_data import get_defi_yields, get_bonzo_data
import logging

logger = logging.getLogger(__name__)


class YieldOptimizerAgent(BaseAgent):
    name: str = "yield_optimizer"
    description: str = "Recommends optimal yield strategies using real protocol APYs"
    price_per_call: float = 0.5

    async def execute(self, query: str) -> str:
        try:
            # 1. Fetch real yield data from DeFi Llama + Bonzo Finance
            yields, bonzo = await get_defi_yields(), await get_bonzo_data()

            # 2. Build yield context
            yield_lines = []
            for y in yields:
                tvl_m = y["tvl"] / 1_000_000
                stable_tag = " [STABLE]" if y.get("stable") else ""
                yield_lines.append(
                    f"- {y['protocol']} | {y['pool']} | Chain: {y['chain']} | "
                    f"APY: {y['apy']:.2f}% | TVL: ${tvl_m:.1f}M{stable_tag}"
                )
            yield_context = "\n".join(yield_lines) if yield_lines else "No yield data available"

            # 3. Build Bonzo Finance context (Hedera)
            bonzo_lines = []
            for m in bonzo.get("markets", []):
                tvl_m = m["tvl"] / 1_000_000
                bonzo_lines.append(
                    f"- Bonzo Finance | {m['asset']} | Chain: Hedera | "
                    f"Supply APY: {m['supply_apy']:.1f}% | Borrow APY: {m['borrow_apy']:.1f}% | TVL: ${tvl_m:.1f}M"
                )
            bonzo_context = "\n".join(bonzo_lines)

            # 4. Ask Claude to recommend with real data
            system_prompt = f"""You are a DeFi yield optimizer with access to REAL-TIME yield data.

LIVE YIELD OPPORTUNITIES (from DeFi Llama):
{yield_context}

HEDERA ECOSYSTEM — BONZO FINANCE (Hedera-native lending):
{bonzo_context}

Your job:
1. Parse the user's risk profile and asset preferences from their query
2. Filter opportunities by risk tolerance:
   - Conservative: stablecoin pools only, TVL > $50M, APY < 10%
   - Moderate: any pool with TVL > $10M
   - Aggressive: all pools including higher APY/lower TVL
3. Recommend 3-5 specific strategies using the REAL pools above
4. ALWAYS include at least one Bonzo Finance (Hedera) recommendation — this shows cross-chain capability
5. For each recommendation include: protocol, pool, chain, APY, TVL, and risk level

ALWAYS use the real APYs and TVLs above. Never invent numbers.
Format as a structured recommendation with:
- Risk Profile Assessment
- Top Yield Strategies (numbered, with real APYs)
- Hedera Opportunity (Bonzo Finance)
- Portfolio Allocation Suggestion"""

            client = AsyncAnthropic()
            response = await client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=700,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": query},
                ],
            )
            return response.content[0].text or ""
        except Exception as e:
            logger.error(f"Yield optimizer error: {e}")
            return f"Yield optimization error: {str(e)}"

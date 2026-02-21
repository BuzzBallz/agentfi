"""Yield Optimizer Agent — uses real APY data from DeFi Llama + Bonzo Finance."""
import json

from anthropic import AsyncAnthropic
from agents.base_agent import BaseAgent
from agents.defi_data import get_defi_yields, get_bonzo_data, get_wallet_balances
import logging

logger = logging.getLogger(__name__)


class YieldOptimizerAgent(BaseAgent):
    name: str = "yield_optimizer"
    description: str = "Recommends optimal yield strategies using real protocol APYs"
    price_per_call: float = 0.5

    async def execute(self, query: str, wallet_address: str | None = None) -> str:
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

            # 4. Fetch wallet balances if address provided
            wallet_banner = ""
            holdings_line = ""
            if wallet_address:
                balances = await get_wallet_balances(wallet_address)
                native = balances.get("native_balance", {})
                bal_amount = native.get("balance", 0)
                bal_symbol = native.get("symbol", "OG")
                chain_name = balances.get("chain", "0G-Galileo-Testnet")
                wallet_banner = (
                    f"## Connected Wallet\n"
                    f"- **Address:** `{wallet_address}`\n"
                    f"- **Balance:** {bal_amount} {bal_symbol} on {chain_name}\n\n"
                    f"---\n\n"
                )
                holdings_line = (
                    f"I hold {bal_amount} {bal_symbol} (0G Chain native gas token) on {chain_name}. "
                    f"That is 100% of my on-chain portfolio. "
                )

            # 5. Ask Claude to recommend with real data
            system_prompt = f"""You are a DeFi yield optimizer with access to REAL-TIME yield data.

LIVE YIELD OPPORTUNITIES (from DeFi Llama):
{yield_context}

HEDERA ECOSYSTEM — BONZO FINANCE (Hedera-native lending):
{bonzo_context}

IMPORTANT RULES:
- NEVER ask the user for more information. Always recommend with whatever data is provided.
- OG is the native gas token of 0G Chain (a testnet token).

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

            user_message = holdings_line + query

            client = AsyncAnthropic()
            response = await client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=700,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": user_message},
                ],
            )
            llm_result = response.content[0].text or ""
            return wallet_banner + llm_result
        except Exception as e:
            logger.error(f"Yield optimizer error: {e}")
            return f"Yield optimization error: {str(e)}"

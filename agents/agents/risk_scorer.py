"""Risk Scorer Agent — deterministic scoring from real market data."""
from anthropic import AsyncAnthropic
from agents.base_agent import BaseAgent
from agents.defi_data import get_token_prices, get_token_history
import logging
import re
import statistics

logger = logging.getLogger(__name__)

# Map common token names to CoinGecko IDs
TOKEN_MAP = {
    "ETH": "ethereum", "BTC": "bitcoin", "USDC": "usd-coin",
    "USDT": "tether", "HBAR": "hedera-hashgraph", "WBTC": "wrapped-bitcoin",
    "LINK": "chainlink", "AAVE": "aave", "UNI": "uniswap", "SUSHI": "sushiswap",
    "DAI": "dai", "SOL": "solana", "MATIC": "matic-network", "AVAX": "avalanche-2",
}

STABLECOINS = {"USDC", "USDT", "DAI"}


def parse_portfolio(query: str) -> dict[str, float]:
    """Extract token allocations from a natural language query.

    Supports patterns like '60% ETH', '30% BTC', 'ETH 40%', etc.
    """
    portfolio: dict[str, float] = {}
    # Match patterns: "60% ETH", "ETH 60%", "60 % ETH"
    token_names = "|".join(TOKEN_MAP.keys())
    patterns = [
        r"(\d+(?:\.\d+)?)\s*%%?\s+(%s)" % token_names,
        r"(%s)\s+(\d+(?:\.\d+)?)\s*%%?" % token_names,
    ]

    for pattern in patterns:
        for match in re.finditer(pattern, query.upper()):
            groups = match.groups()
            if groups[0] in TOKEN_MAP:
                token, pct = groups[0], float(groups[1])
            else:
                pct, token = float(groups[0]), groups[1]
            if token in TOKEN_MAP:
                portfolio[token] = pct

    # If nothing parsed, try a simple fallback
    if not portfolio:
        for token in TOKEN_MAP:
            if token in query.upper():
                portfolio[token] = 100.0 / max(1, query.upper().count(token))

    return portfolio


def compute_volatility(prices: list[float]) -> float:
    """Compute annualized volatility from a price series."""
    if len(prices) < 2:
        return 0.0
    returns = [(prices[i] - prices[i - 1]) / prices[i - 1] for i in range(1, len(prices))]
    if not returns:
        return 0.0
    daily_std = statistics.stdev(returns) if len(returns) > 1 else 0.0
    # Annualize (sqrt of 365)
    return daily_std * (365 ** 0.5) * 100  # as percentage


def compute_risk_score(
    portfolio: dict[str, float],
    prices: dict,
    volatilities: dict[str, float],
) -> tuple[float, dict]:
    """Compute a deterministic risk score 0-10 from real data.

    Sub-scores:
    - Volatility (0-3): weighted avg volatility of portfolio
    - Concentration (0-3): how concentrated in a single asset
    - Stablecoin ratio (0-2): more stables = lower risk
    - 24h drawdown (0-2): based on actual 24h changes
    """
    total_pct = sum(portfolio.values()) or 1.0

    # --- Volatility score (0-3) ---
    weighted_vol = 0.0
    for token, pct in portfolio.items():
        vol = volatilities.get(token, 50.0)  # default high if unknown
        weighted_vol += (pct / total_pct) * vol
    # Map: 0-20% vol → 0, 20-60% → 1-2, 60%+ → 3
    if weighted_vol < 20:
        vol_score = weighted_vol / 20.0
    elif weighted_vol < 60:
        vol_score = 1.0 + (weighted_vol - 20) / 40.0 * 2.0
    else:
        vol_score = 3.0

    # --- Concentration score (0-3) ---
    weights = [pct / total_pct for pct in portfolio.values()]
    max_weight = max(weights) if weights else 0
    if max_weight > 0.7:
        conc_score = 3.0
    elif max_weight > 0.5:
        conc_score = 2.0
    elif max_weight > 0.3:
        conc_score = 1.0
    else:
        conc_score = 0.5

    # --- Stablecoin ratio score (0-2) — more stables = LOWER risk ---
    stable_pct = sum(pct for token, pct in portfolio.items() if token in STABLECOINS) / total_pct
    stable_score = 2.0 * (1.0 - stable_pct)  # 100% stable → 0, 0% stable → 2

    # --- 24h drawdown score (0-2) ---
    weighted_24h = 0.0
    for token, pct in portfolio.items():
        cg_id = TOKEN_MAP.get(token, "")
        change = prices.get(cg_id, {}).get("usd_24h_change", 0) or 0
        weighted_24h += (pct / total_pct) * change
    # Map: positive → 0, -2% → 1, -5%+ → 2
    if weighted_24h >= 0:
        drawdown_score = 0.0
    elif weighted_24h > -2:
        drawdown_score = abs(weighted_24h) / 2.0
    elif weighted_24h > -5:
        drawdown_score = 1.0 + (abs(weighted_24h) - 2) / 3.0
    else:
        drawdown_score = 2.0

    total = round(vol_score + conc_score + stable_score + drawdown_score, 1)
    total = min(10.0, max(0.0, total))

    breakdown = {
        "volatility": round(vol_score, 2),
        "concentration": round(conc_score, 2),
        "stablecoin_exposure": round(stable_score, 2),
        "drawdown_24h": round(drawdown_score, 2),
        "weighted_volatility_pct": round(weighted_vol, 1),
        "weighted_24h_change_pct": round(weighted_24h, 2),
        "max_single_asset_weight": round(max_weight * 100, 1),
        "stablecoin_pct": round(stable_pct * 100, 1),
    }

    return total, breakdown


class RiskScorerAgent(BaseAgent):
    name: str = "risk_scorer"
    description: str = "Scores portfolio risk using real volatility and market data"
    price_per_call: float = 0.3

    async def execute(self, query: str) -> str:
        try:
            # 1. Parse portfolio from query
            portfolio = parse_portfolio(query)
            if not portfolio:
                return "Could not parse portfolio allocations. Please specify like: '60% ETH, 30% BTC, 10% USDC'"

            # 2. Determine which tokens to fetch
            cg_ids = [TOKEN_MAP[t] for t in portfolio if t in TOKEN_MAP]

            # 3. Fetch real prices
            prices = await get_token_prices(cg_ids) if cg_ids else {}

            # 4. Fetch real price history and compute volatility
            volatilities: dict[str, float] = {}
            for token in portfolio:
                cg_id = TOKEN_MAP.get(token)
                if cg_id:
                    history = await get_token_history(cg_id, days=30)
                    volatilities[token] = compute_volatility(history)

            # 5. Compute deterministic risk score
            total_score, breakdown = compute_risk_score(portfolio, prices, volatilities)

            # 6. Build context for LLM explanation
            price_lines = []
            for token in portfolio:
                cg_id = TOKEN_MAP.get(token, "")
                p = prices.get(cg_id, {})
                price_lines.append(
                    f"- {token}: ${p.get('usd', 'N/A')} (24h: {p.get('usd_24h_change', 0):.2f}%)"
                )

            vol_lines = [
                f"- {token}: {volatilities.get(token, 0):.1f}% annualized"
                for token in portfolio
            ]

            portfolio_lines = [f"- {token}: {pct}%" for token, pct in portfolio.items()]

            system_prompt = f"""You are a DeFi risk analyst. A risk score has ALREADY been computed from real data.
Your job is to EXPLAIN the score — do NOT change it.

PORTFOLIO:
{chr(10).join(portfolio_lines)}

REAL-TIME PRICES (CoinGecko):
{chr(10).join(price_lines)}

30-DAY VOLATILITY (calculated from real price history):
{chr(10).join(vol_lines)}

COMPUTED RISK SCORE: {total_score}/10

SCORE BREAKDOWN:
- Volatility sub-score: {breakdown['volatility']}/3 (weighted portfolio volatility: {breakdown['weighted_volatility_pct']}%)
- Concentration sub-score: {breakdown['concentration']}/3 (max single asset: {breakdown['max_single_asset_weight']}%)
- Stablecoin exposure sub-score: {breakdown['stablecoin_exposure']}/2 (stablecoin allocation: {breakdown['stablecoin_pct']}%)
- 24h Drawdown sub-score: {breakdown['drawdown_24h']}/2 (weighted 24h change: {breakdown['weighted_24h_change_pct']}%)

RULES:
1. Report the score as {total_score}/10 — do not change it
2. Explain each sub-score using the real numbers above
3. Classify: 0-3 = Low Risk, 3-5 = Moderate, 5-7 = Elevated, 7-10 = High Risk
4. Provide 2-3 actionable suggestions to reduce risk
5. Keep the response structured and concise"""

            client = AsyncAnthropic()
            response = await client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=600,
                system=system_prompt,
                messages=[
                    {"role": "user", "content": query},
                ],
            )
            return response.content[0].text or ""
        except Exception as e:
            logger.error(f"Risk scorer error: {e}")
            return f"Risk scoring error: {str(e)}"

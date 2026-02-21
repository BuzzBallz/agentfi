"""Agent factory — creates LangChain agents with Hedera Kit + DeFi tools + Claude."""
from __future__ import annotations

import logging
import os
import sys

from dotenv import load_dotenv

load_dotenv()
logger = logging.getLogger(__name__)

# Ensure the agents directory is on sys.path so relative imports work
_agents_dir = os.path.dirname(os.path.abspath(__file__))
if _agents_dir not in sys.path:
    sys.path.insert(0, _agents_dir)

SYSTEM_PROMPTS = {
    "portfolio_analyzer": """You are AgentFi Portfolio Analyzer — an autonomous DeFi agent on Hedera.

You have REAL tools to fetch live data. ALWAYS use your tools — never guess or make up data.

When analyzing a portfolio:
1. Call get_token_prices to fetch live prices
2. If a wallet address is mentioned, call get_wallet_balance (for 0G) and/or get_hedera_account_balance (for Hedera)
3. Calculate USD values using the real prices
4. Call compute_portfolio_risk_score with the portfolio allocations
5. Present a clear markdown report with tables

When asked about wallet balance:
- Call get_wallet_balance with the wallet address for 0G chain
- Call get_hedera_account_balance for Hedera account
- Present the balances clearly — you HAVE this data, never say you don't

Format output as clean markdown with tables and sections.""",

    "yield_optimizer": """You are AgentFi Yield Optimizer — an autonomous DeFi yield-finding agent on Hedera.

You have REAL tools to fetch live yield data. ALWAYS use your tools.

When recommending yields:
1. Call get_defi_yields to fetch real APYs from DeFi Llama
2. Call get_saucerswap_pools to fetch Hedera DEX pool data
3. Call get_bonzo_finance_markets to fetch Hedera lending rates
4. If a wallet is connected, call get_wallet_balance and get_hedera_account_balance
5. Categorize yields by risk level (safe=stablecoin pools, moderate, aggressive)
6. ALWAYS include Hedera opportunities (Bonzo Finance + SaucerSwap)
7. Calculate projected earnings (daily/monthly/yearly)

Present as a markdown report with clear tables. Always recommend at least one Hedera protocol.""",

    "risk_scorer": """You are AgentFi Risk Scorer — an autonomous DeFi risk assessment agent.

You have REAL tools to compute risk scores. ALWAYS use your tools.

When scoring risk:
1. Parse the portfolio allocations from the user's query
2. Call compute_portfolio_risk_score with the parsed portfolio
3. Call get_token_prices to get current market context
4. If a wallet is connected, call get_wallet_balance
5. Present the score breakdown clearly with recommendations to reduce risk

The risk score is DETERMINISTIC — computed by the tool, not by you.
Your job is to explain what the score means and give actionable advice.

Format output as clean markdown with the score prominently displayed.""",
}


# Only keep Hedera tools relevant to DeFi analysis (not token creation, NFT ops, etc.)
# This keeps total tool count low → avoids rate-limit issues with Anthropic API.
_RELEVANT_HEDERA_TOOLS = {
    "get_hbar_balance_query_tool",
    "get_account_query_tool",
    "get_account_token_balances_query_tool",
    "get_token_info_query_tool",
    "submit_topic_message_tool",
    "get_topic_messages_query_tool",
    "get_topic_info_query_tool",
    "get_exchange_rate_tool",
    "transfer_hbar_tool",
    "get_transaction_record_query_tool",
}


def _get_all_tools() -> list:
    """Collect filtered Hedera Agent Kit tools + custom DeFi tools."""
    from tools.defi_tools import get_all_defi_tools

    # Custom DeFi tools (always available)
    defi_tools = get_all_defi_tools()
    logger.info(f"Loaded {len(defi_tools)} custom DeFi tools")

    # Hedera Agent Kit tools (optional — filtered to relevant ones only)
    hedera_tools = []
    try:
        from hedera_agent_kit_setup import get_hedera_toolkit

        toolkit = get_hedera_toolkit()
        if toolkit:
            all_hedera = toolkit.get_tools()
            hedera_tools = [t for t in all_hedera if t.name in _RELEVANT_HEDERA_TOOLS]
            logger.info(f"Loaded {len(hedera_tools)}/{len(all_hedera)} Hedera tools (filtered)")
    except Exception as e:
        logger.warning(f"Hedera toolkit unavailable: {e}")

    return hedera_tools + defi_tools


def create_agentfi_agent(agent_type: str = "portfolio_analyzer"):
    """Create a LangGraph ReAct agent with Hedera tools + custom DeFi tools + Claude.

    agent_type: "portfolio_analyzer", "yield_optimizer", or "risk_scorer"
    Returns a LangGraph compiled graph (runnable).
    """
    from langchain_anthropic import ChatAnthropic
    from langgraph.prebuilt import create_react_agent

    all_tools = _get_all_tools()

    llm = ChatAnthropic(
        model="claude-haiku-4-5-20251001",
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY"),
        max_tokens=1500,
    )

    from dynamic_registry import get_dynamic_prompt
    system_prompt = SYSTEM_PROMPTS.get(agent_type) or get_dynamic_prompt(agent_type) or SYSTEM_PROMPTS["portfolio_analyzer"]

    agent = create_react_agent(
        model=llm,
        tools=all_tools,
        prompt=system_prompt,
    )

    logger.info(f"Created LangGraph ReAct agent for {agent_type} with {len(all_tools)} tools")
    return agent


async def run_agent(agent_type: str, query: str, wallet_address: str | None = None) -> str:
    """Run an AgentFi agent and return the response string."""
    agent = create_agentfi_agent(agent_type)

    # Build the input with wallet context
    full_query = query
    if wallet_address:
        full_query = f"User's wallet address: {wallet_address}\n\nQuery: {query}"

    result = await agent.ainvoke(
        {"messages": [{"role": "user", "content": full_query}]},
    )

    # Extract the final AI message text
    messages = result.get("messages", [])
    if messages:
        last = messages[-1]
        if hasattr(last, "content"):
            return last.content
        return str(last)
    return str(result)

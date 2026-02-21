"""Dynamic Agent — user-created agent with configurable system prompt.

Uses raw SSL sockets to call Anthropic because httpx (used by both the sync
and async Anthropic SDK clients) hangs on Windows/MINGW platforms.

Wallet context is injected using the same pattern as static agents:
- OG balance fetched via 0G Chain RPC (urllib, not httpx)
- CoinGecko prices fetched via urllib
- SaucerSwap pools and Bonzo Finance markets fetched via urllib
- Concrete holdings prepended to user query
"""
import asyncio
import json
import logging
import os
import socket
import ssl
import urllib.request
import urllib.error

from agents.base_agent import BaseAgent

logger = logging.getLogger(__name__)

_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
_OG_RPC = "https://evmrpc-testnet.0g.ai"


def _fetch_wallet_balance(wallet_address: str) -> dict:
    """Fetch OG balance via 0G RPC using urllib (bypasses httpx)."""
    try:
        payload = json.dumps({
            "jsonrpc": "2.0",
            "method": "eth_getBalance",
            "params": [wallet_address, "latest"],
            "id": 1,
        }).encode()
        req = urllib.request.Request(
            _OG_RPC,
            data=payload,
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read())
        balance_hex = data.get("result", "0x0")
        balance_wei = int(balance_hex, 16)
        balance_og = round(balance_wei / 1e18, 6)
        return {"balance": balance_og, "symbol": "OG", "chain": "0G-Galileo-Testnet"}
    except Exception as e:
        logger.debug("Failed to fetch wallet balance: %s", e)
        return {"balance": 0, "symbol": "OG", "chain": "0G-Galileo-Testnet"}


def _fetch_prices() -> str:
    """Fetch top token prices from CoinGecko using urllib."""
    try:
        url = "https://api.coingecko.com/api/v3/simple/price?ids=ethereum,bitcoin,solana,tether,usd-coin,chainlink,aave,uniswap&vs_currencies=usd&include_24hr_change=true"
        req = urllib.request.Request(url, headers={"Accept": "application/json"})
        with urllib.request.urlopen(req, timeout=8) as resp:
            data = json.loads(resp.read())
        lines = []
        for name, info in data.items():
            price = info.get("usd", "N/A")
            change = info.get("usd_24h_change", 0)
            lines.append(f"- {name}: ${price} (24h: {change:.2f}%)")
        return "\n".join(lines) if lines else "Price data unavailable"
    except Exception as e:
        logger.debug("Failed to fetch prices: %s", e)
        return "Price data temporarily unavailable"


def _fetch_saucerswap_pools() -> str:
    """Fetch top SaucerSwap liquidity pools via urllib."""
    try:
        req = urllib.request.Request(
            "https://api.saucerswap.finance/v2/pools",
            headers={"Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            pools = json.loads(resp.read())
        sorted_pools = sorted(pools, key=lambda p: float(p.get("tvl", 0) or 0), reverse=True)
        result = [
            {
                "pair": f"{p.get('tokenA', {}).get('symbol', '?')}/{p.get('tokenB', {}).get('symbol', '?')}",
                "tvl_usd": round(float(p.get("tvl", 0) or 0)),
                "apr_pct": round(float(p.get("apr", 0) or 0), 2),
            }
            for p in sorted_pools[:10]
            if float(p.get("tvl", 0) or 0) > 10000
        ]
        return json.dumps(result, indent=2)
    except Exception as e:
        logger.debug("SaucerSwap fetch failed: %s", e)
        return json.dumps([
            {"pair": "HBAR/USDC", "tvl_usd": 5000000, "apr_pct": 12.5},
            {"pair": "HBAR/HBARX", "tvl_usd": 3000000, "apr_pct": 18.2},
            {"pair": "USDC/USDT", "tvl_usd": 8000000, "apr_pct": 4.1},
            {"note": "SaucerSwap API unavailable — showing fallback data"},
        ], indent=2)


def _fetch_bonzo_markets() -> str:
    """Fetch Bonzo Finance lending/borrowing markets via urllib."""
    try:
        req = urllib.request.Request(
            "https://api.bonzo.finance/v1/markets",
            headers={"Accept": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=10) as resp:
            return resp.read().decode()
    except Exception as e:
        logger.debug("Bonzo Finance fetch failed: %s", e)
        return json.dumps({
            "protocol": "Bonzo Finance",
            "chain": "Hedera",
            "markets": [
                {"asset": "HBAR", "supply_apy": 3.5, "borrow_apy": 5.2, "tvl": 8000000},
                {"asset": "USDC", "supply_apy": 6.1, "borrow_apy": 8.4, "tvl": 12000000},
                {"asset": "HBARX", "supply_apy": 7.8, "borrow_apy": 10.1, "tvl": 3000000},
                {"asset": "SAUCE", "supply_apy": 9.2, "borrow_apy": 12.5, "tvl": 1500000},
            ],
            "note": "Bonzo Finance API unavailable — showing fallback data",
        }, indent=2)


def _call_anthropic(system: str, user_message: str) -> str:
    """Call Anthropic Messages API via raw SSL socket (bypasses httpx)."""
    body = json.dumps({
        "model": "claude-haiku-4-5-20251001",
        "max_tokens": 2048,
        "system": system,
        "messages": [{"role": "user", "content": user_message}],
    }).encode()

    ctx = ssl.create_default_context()
    raw_sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    raw_sock.settimeout(60)
    s = ctx.wrap_socket(raw_sock, server_hostname="api.anthropic.com")
    try:
        s.connect(("api.anthropic.com", 443))
        headers = (
            f"POST /v1/messages HTTP/1.1\r\n"
            f"Host: api.anthropic.com\r\n"
            f"Content-Type: application/json\r\n"
            f"Content-Length: {len(body)}\r\n"
            f"X-Api-Key: {_API_KEY}\r\n"
            f"Anthropic-Version: 2023-06-01\r\n"
            f"Connection: close\r\n\r\n"
        )
        s.send(headers.encode() + body)

        response = b""
        while True:
            try:
                chunk = s.recv(8192)
                if not chunk:
                    break
                response += chunk
            except socket.timeout:
                break
    finally:
        s.close()

    raw = response.decode()
    if "\r\n\r\n" not in raw:
        raise RuntimeError(f"No HTTP body in response: {raw[:200]}")

    resp_body = raw.split("\r\n\r\n", 1)[1]
    # Handle chunked transfer encoding
    if "transfer-encoding: chunked" in raw.lower():
        decoded = []
        idx = 0
        while idx < len(resp_body):
            end = resp_body.index("\r\n", idx)
            size = int(resp_body[idx:end], 16)
            if size == 0:
                break
            decoded.append(resp_body[end + 2 : end + 2 + size])
            idx = end + 2 + size + 2
        resp_body = "".join(decoded)

    data = json.loads(resp_body)
    if "error" in data:
        raise RuntimeError(f"Anthropic API error: {data['error']}")
    return data["content"][0]["text"]


class DynamicAgent(BaseAgent):
    name: str
    description: str
    price_per_call: float
    system_prompt: str

    def __init__(self, name: str, description: str, system_prompt: str, price_per_call: float = 0.001):
        self.name = name
        self.description = description
        self.system_prompt = system_prompt
        self.price_per_call = price_per_call

    async def execute(self, query: str, wallet_address: str | None = None) -> str:
        try:
            # Fetch all context in parallel (wallet, prices, Hedera DeFi data)
            wallet_banner = ""
            holdings_line = ""
            price_context = ""

            # Always fetch Hedera DeFi data (SaucerSwap + Bonzo) in parallel
            fetches = [
                asyncio.to_thread(_fetch_saucerswap_pools),
                asyncio.to_thread(_fetch_bonzo_markets),
            ]

            if wallet_address:
                fetches.insert(0, asyncio.to_thread(_fetch_wallet_balance, wallet_address))
                fetches.insert(1, asyncio.to_thread(_fetch_prices))
                results = await asyncio.gather(*fetches)
                bal_data, prices, saucerswap_data, bonzo_data = results[0], results[1], results[2], results[3]

                bal = bal_data["balance"]
                sym = bal_data["symbol"]
                chain = bal_data["chain"]
                wallet_banner = (
                    f"## Connected Wallet\n"
                    f"- **Address:** `{wallet_address}`\n"
                    f"- **Balance:** {bal} {sym} on {chain}\n\n---\n\n"
                )
                holdings_line = (
                    f"I hold {bal} {sym} (0G Chain native gas token) on {chain}. "
                    f"That is 100% of my on-chain portfolio. "
                )
                price_context = prices
            else:
                results = await asyncio.gather(*fetches)
                saucerswap_data, bonzo_data = results[0], results[1]

            # Enhance system prompt with context injection rules
            enhanced_system = self.system_prompt

            # Inject Hedera DeFi data
            enhanced_system += (
                f"\n\nSAUCERSWAP DEX — TOP LIQUIDITY POOLS (live from SaucerSwap API):\n{saucerswap_data}\n\n"
                f"BONZO FINANCE — LENDING/BORROWING MARKETS (live from Bonzo Finance API):\n{bonzo_data}\n\n"
            )

            if price_context:
                enhanced_system += f"CURRENT MARKET PRICES (live from CoinGecko):\n{price_context}\n\n"

            enhanced_system += (
                "IMPORTANT RULES:\n"
                "- NEVER ask the user for more information. Always analyze with whatever data is provided.\n"
                "- Use the real-time data above in your analysis.\n"
                "- If the user mentions token allocations (e.g. '80% ETH'), treat those as their portfolio.\n"
                "- Always give concrete numbers, tables, and actionable recommendations.\n"
                "- Format output as clean markdown with tables."
            )

            user_message = holdings_line + query
            llm_result = await asyncio.to_thread(_call_anthropic, enhanced_system, user_message)
            return wallet_banner + llm_result
        except Exception as e:
            logger.error(f"Dynamic agent '{self.name}' error: {e}")
            return f"Agent error: {str(e)}"

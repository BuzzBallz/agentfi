"""
x402 configuration — reads agent pricing and Hedera accounts from AgentRegistry contract
and provides local config for the payment system.
"""

import os

from web3 import Web3

# ─── Chain configs ───────────────────────────────────────
KITEAI_RPC = "https://rpc-testnet.gokite.ai/"
KITEAI_CHAIN_ID = 2368
KITEAI_USDT_ADDRESS = "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63"
KITEAI_EXPLORER = "https://testnet.kitescan.ai"

OG_RPC = os.getenv("OG_RPC_URL", "https://evmrpc-testnet.0g.ai")

# ─── Contract addresses (from deployments.json) ─────────
AGENT_REGISTRY_ADDRESS = os.getenv("AGENT_REGISTRY_ADDRESS", "")
AGENT_NFT_V2_ADDRESS = os.getenv("AGENT_NFT_V2_ADDRESS", "")

# ─── Agent name → tokenId mapping ───────────────────────
AGENT_NAME_TO_TOKEN_ID = {
    "portfolio_analyzer": 0,
    "yield_optimizer": 1,
    "risk_scorer": 2,
}

TOKEN_ID_TO_AGENT_NAME = {v: k for k, v in AGENT_NAME_TO_TOKEN_ID.items()}

# ─── Hedera accounts (fallback if registry read fails) ──
AGENT_HEDERA_ACCOUNTS = {
    0: os.getenv("AGENT_0_HEDERA_ACCOUNT", "0.0.7997780"),
    1: os.getenv("AGENT_1_HEDERA_ACCOUNT", "0.0.7997785"),
    2: os.getenv("AGENT_2_HEDERA_ACCOUNT", "0.0.7997786"),
}

OPERATOR_HEDERA_ACCOUNT = os.getenv("HEDERA_OPERATOR_ID", os.getenv("HEDERA_ACCOUNT_ID", ""))

# ─── AFC Payment Split ──────────────────────────────────
AFC_SPLIT_OWNER = 0.70
AFC_SPLIT_AGENT = 0.20
AFC_SPLIT_PLATFORM = 0.10

# ─── Cross-Agent Collaboration Mapping ───────────────────
CROSS_AGENT_RECOMMENDATIONS = {
    "portfolio_analyzer": ["risk_scorer", "yield_optimizer"],
    "yield_optimizer": ["risk_scorer"],
    "risk_scorer": [],
}


def is_authorized_on_chain(token_id: int, wallet_address: str) -> bool:
    """Check AgentNFTv2.isAuthorized(tokenId, executor) on 0G Chain."""
    try:
        if not AGENT_NFT_V2_ADDRESS:
            return False

        w3 = Web3(Web3.HTTPProvider(OG_RPC))

        abi = [
            {
                "inputs": [
                    {"name": "tokenId", "type": "uint256"},
                    {"name": "executor", "type": "address"},
                ],
                "name": "isAuthorized",
                "outputs": [{"name": "", "type": "bool"}],
                "stateMutability": "view",
                "type": "function",
            }
        ]

        contract = w3.eth.contract(
            address=Web3.to_checksum_address(AGENT_NFT_V2_ADDRESS),
            abi=abi,
        )

        return contract.functions.isAuthorized(
            token_id, Web3.to_checksum_address(wallet_address)
        ).call()
    except Exception as e:
        print(f"[x402] Warning: isAuthorized check failed for token {token_id}: {e}")
        return False


def get_registry_config(token_id: int) -> dict:
    """Read agent config from the on-chain AgentRegistry contract.

    Dynamic agents (token_id > 2) are not registered on-chain, so we check
    the local dynamic registry first to avoid the contract returning default
    (all-false) values for unknown token IDs.
    """
    # Dynamic agents: check local registry first (contract returns zeros for unknown IDs)
    if token_id > 2:
        from dynamic_registry import get_token_map, get_x402_config
        tmap = get_token_map()
        agent_id = tmap.get(token_id)
        if agent_id:
            x402_cfg = get_x402_config(agent_id)
            if x402_cfg:
                hedera_accounts = get_full_hedera_accounts()
                return {
                    "agent_hedera_account": hedera_accounts.get(token_id, ""),
                    "owner_hedera_account": OPERATOR_HEDERA_ACCOUNT,
                    "x402_enabled": x402_cfg.get("x402_enabled", False),
                    "price_afc": x402_cfg.get("price_afc", 1.0),
                    "price_usdt": 0.01,
                    "max_budget_afc": x402_cfg.get("max_budget_afc", 5.0),
                    "allow_cross_agent": x402_cfg.get("allow_cross_agent", False),
                }

    try:
        if not AGENT_REGISTRY_ADDRESS:
            raise ValueError("AGENT_REGISTRY_ADDRESS not set")

        w3 = Web3(Web3.HTTPProvider(OG_RPC))

        abi = [
            {
                "inputs": [{"name": "tokenId", "type": "uint256"}],
                "name": "getAgentFullConfig",
                "outputs": [
                    {"name": "agentHedera", "type": "string"},
                    {"name": "ownerHedera", "type": "string"},
                    {
                        "name": "config",
                        "type": "tuple",
                        "components": [
                            {"name": "enabled", "type": "bool"},
                            {"name": "priceAFC", "type": "uint256"},
                            {"name": "priceUSDT", "type": "uint256"},
                            {"name": "maxBudgetAFC", "type": "uint256"},
                            {"name": "allowCrossAgent", "type": "bool"},
                        ],
                    },
                ],
                "stateMutability": "view",
                "type": "function",
            }
        ]

        contract = w3.eth.contract(
            address=Web3.to_checksum_address(AGENT_REGISTRY_ADDRESS),
            abi=abi,
        )

        result = contract.functions.getAgentFullConfig(token_id).call()

        return {
            "agent_hedera_account": result[0],
            "owner_hedera_account": result[1],
            "x402_enabled": result[2][0],
            "price_afc": result[2][1] / 100,
            "price_usdt": result[2][2] / 1_000_000,
            "max_budget_afc": result[2][3] / 100,
            "allow_cross_agent": result[2][4],
        }
    except Exception as e:
        print(f"[x402] Warning: Could not read registry for token {token_id}: {e}")
        return _local_fallback_config(token_id)


def _local_fallback_config(token_id: int) -> dict:
    """Local fallback if on-chain read fails."""
    defaults = {
        0: {"price_afc": 1.00, "price_usdt": 0.01, "max_budget_afc": 5.00, "allow_cross_agent": True},
        1: {"price_afc": 1.50, "price_usdt": 0.015, "max_budget_afc": 3.00, "allow_cross_agent": True},
        2: {"price_afc": 0.50, "price_usdt": 0.005, "max_budget_afc": 2.00, "allow_cross_agent": False},
    }
    if token_id in defaults:
        d = defaults[token_id]
    else:
        # Check dynamic registry for non-static agents
        from dynamic_registry import get_token_map, get_x402_config
        tmap = get_token_map()
        agent_id = tmap.get(token_id)
        if agent_id:
            x402_cfg = get_x402_config(agent_id)
            if x402_cfg:
                hedera_accounts = get_full_hedera_accounts()
                return {
                    "agent_hedera_account": hedera_accounts.get(token_id, ""),
                    "owner_hedera_account": OPERATOR_HEDERA_ACCOUNT,
                    "x402_enabled": x402_cfg.get("x402_enabled", False),
                    "price_afc": x402_cfg.get("price_afc", 1.0),
                    "price_usdt": 0.01,
                    "max_budget_afc": x402_cfg.get("max_budget_afc", 5.0),
                    "allow_cross_agent": x402_cfg.get("allow_cross_agent", False),
                }
        d = {"price_afc": 1.00, "price_usdt": 0.01, "max_budget_afc": 5.00, "allow_cross_agent": False}
    return {
        "agent_hedera_account": AGENT_HEDERA_ACCOUNTS.get(token_id, get_full_hedera_accounts().get(token_id, "")),
        "owner_hedera_account": OPERATOR_HEDERA_ACCOUNT,
        "x402_enabled": True,
        **d,
    }


# ─── Dynamic-aware lookup functions ───────────────────────────


def get_full_agent_name_to_token_id() -> dict[str, int]:
    """Merge static AGENT_NAME_TO_TOKEN_ID with dynamic agents."""
    from dynamic_registry import get_token_map
    merged = dict(AGENT_NAME_TO_TOKEN_ID)
    tmap = get_token_map()
    for token_id, agent_id in tmap.items():
        if agent_id not in merged:
            merged[agent_id] = token_id
    return merged


def get_full_hedera_accounts() -> dict[int, str]:
    """Merge static AGENT_HEDERA_ACCOUNTS with dynamic agents."""
    from dynamic_registry import get_all_hedera_accounts
    return get_all_hedera_accounts()


def get_full_cross_agent_recommendations(caller_name: str) -> list[str]:
    """Static recommendations + all dynamic agents with x402 enabled."""
    from dynamic_registry import get_x402_enabled_agents
    static = list(CROSS_AGENT_RECOMMENDATIONS.get(caller_name, []))
    for agent_id in get_x402_enabled_agents():
        if agent_id != caller_name and agent_id not in static:
            static.append(agent_id)
    return static

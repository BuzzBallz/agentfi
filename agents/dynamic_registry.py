"""Dynamic agent registry — JSON persistence + runtime registration."""
from __future__ import annotations

import json
import logging
from pathlib import Path
from threading import Lock

from agents.dynamic_agent import DynamicAgent

logger = logging.getLogger(__name__)

_REGISTRY_PATH = Path(__file__).resolve().parent / "dynamic_agents.json"
_lock = Lock()

# In-memory cache
_dynamic_agents: dict[str, DynamicAgent] = {}
_token_map: dict[int, str] = {}
_hedera_info: dict[str, dict[str, str]] = {}  # agent_id -> {account, inbound, outbound}
_afc_earned: dict[str, float] = {}  # agent_id -> cumulative AFC earned
_x402_configs: dict[str, dict] = {}  # agent_id -> {x402_enabled, price_afc, allow_cross_agent, max_budget_afc}


def _read_store() -> list[dict]:
    if not _REGISTRY_PATH.exists():
        return []
    try:
        return json.loads(_REGISTRY_PATH.read_text())
    except (json.JSONDecodeError, OSError):
        logger.warning("Corrupt dynamic_agents.json — starting fresh")
        return []


def _write_store(entries: list[dict]) -> None:
    _REGISTRY_PATH.write_text(json.dumps(entries, indent=2))


def load_dynamic_agents() -> dict[str, DynamicAgent]:
    """Load all dynamic agents from disk. Called at startup."""
    global _dynamic_agents, _token_map, _hedera_info, _afc_earned, _x402_configs
    entries = _read_store()
    agents: dict[str, DynamicAgent] = {}
    tmap: dict[int, str] = {}
    hinfo: dict[str, dict[str, str]] = {}
    afc: dict[str, float] = {}
    x402: dict[str, dict] = {}

    for entry in entries:
        agent_id = entry["agent_id"]
        agent = DynamicAgent(
            name=entry["name"],
            description=entry["description"],
            system_prompt=entry["system_prompt"],
            price_per_call=entry.get("price_per_call", 0.001),
        )
        agents[agent_id] = agent
        if "token_id" in entry:
            tmap[entry["token_id"]] = agent_id
        if "hedera" in entry:
            hinfo[agent_id] = entry["hedera"]
        if "afc_earned" in entry:
            afc[agent_id] = entry["afc_earned"]
        if entry.get("x402_enabled"):
            x402[agent_id] = {
                "x402_enabled": entry.get("x402_enabled", False),
                "price_afc": entry.get("price_afc", 1.0),
                "allow_cross_agent": entry.get("allow_cross_agent", False),
                "max_budget_afc": entry.get("max_budget_afc", 5.0),
            }

    with _lock:
        _dynamic_agents = agents
        _token_map = tmap
        _hedera_info = hinfo
        _afc_earned = afc
        _x402_configs = x402

    logger.info(f"Loaded {len(agents)} dynamic agents from disk")
    return agents


def register_agent(
    agent_id: str,
    name: str,
    description: str,
    system_prompt: str,
    token_id: int,
    price_per_call: float = 0.001,
    x402_enabled: bool = False,
    allow_cross_agent: bool = False,
    price_afc: float = 1.0,
    max_budget_afc: float = 5.0,
) -> DynamicAgent:
    """Create, persist, and register a new dynamic agent."""
    with _lock:
        if agent_id in _dynamic_agents:
            raise ValueError(f"Agent '{agent_id}' already exists")

        agent = DynamicAgent(
            name=name,
            description=description,
            system_prompt=system_prompt,
            price_per_call=price_per_call,
        )
        _dynamic_agents[agent_id] = agent
        _token_map[token_id] = agent_id

        if x402_enabled:
            _x402_configs[agent_id] = {
                "x402_enabled": True,
                "price_afc": price_afc,
                "allow_cross_agent": allow_cross_agent,
                "max_budget_afc": max_budget_afc,
            }

        # Persist
        entries = _read_store()
        entry: dict = {
            "agent_id": agent_id,
            "name": name,
            "description": description,
            "system_prompt": system_prompt,
            "token_id": token_id,
            "price_per_call": price_per_call,
        }
        if x402_enabled:
            entry["x402_enabled"] = True
            entry["price_afc"] = price_afc
            entry["allow_cross_agent"] = allow_cross_agent
            entry["max_budget_afc"] = max_budget_afc
        entries.append(entry)
        _write_store(entries)

    logger.info(f"Registered dynamic agent: {agent_id} (tokenId={token_id}, x402={x402_enabled})")
    return agent


def get_token_map() -> dict[int, str]:
    """Full tokenId -> agent_id map (static + dynamic)."""
    static = {
        0: "portfolio_analyzer",
        1: "yield_optimizer",
        2: "risk_scorer",
    }
    with _lock:
        return {**static, **_token_map}


def get_dynamic_prompt(agent_id: str) -> str | None:
    """Lookup system prompt for a dynamic agent."""
    with _lock:
        agent = _dynamic_agents.get(agent_id)
        return agent.system_prompt if agent else None


def get_dynamic_agents() -> dict[str, DynamicAgent]:
    """Return the in-memory dynamic agents dict."""
    with _lock:
        return dict(_dynamic_agents)


def set_hedera_info(agent_id: str, hedera: dict[str, str]) -> None:
    """Store Hedera topics/account for a dynamic agent and persist to disk."""
    with _lock:
        _hedera_info[agent_id] = hedera

        # Update the persisted JSON
        entries = _read_store()
        for entry in entries:
            if entry["agent_id"] == agent_id:
                entry["hedera"] = hedera
                break
        _write_store(entries)

    logger.info(f"Stored Hedera info for {agent_id}: {hedera}")


def get_hedera_info(agent_id: str) -> dict[str, str] | None:
    """Get Hedera topics/account for a dynamic agent."""
    with _lock:
        return _hedera_info.get(agent_id)


def get_all_hedera_accounts() -> dict[int, str]:
    """Return tokenId -> Hedera account mapping for all agents (static + dynamic)."""
    static = {
        0: "0.0.7997780",  # Portfolio Analyzer
        1: "0.0.7997785",  # Yield Optimizer
        2: "0.0.7997786",  # Risk Scorer
    }
    with _lock:
        for token_id, agent_id in _token_map.items():
            info = _hedera_info.get(agent_id)
            if info and info.get("account"):
                static[token_id] = info["account"]
    return static


def increment_afc(agent_id: str, amount: float) -> float:
    """Increment the tracked AFC earned for an agent. Returns new total."""
    with _lock:
        current = _afc_earned.get(agent_id, 0.0)
        new_total = current + amount
        _afc_earned[agent_id] = new_total

        # Persist to disk
        entries = _read_store()
        for entry in entries:
            if entry["agent_id"] == agent_id:
                entry["afc_earned"] = new_total
                break
        _write_store(entries)

    logger.info("AFC earned for %s: %.2f (total: %.2f)", agent_id, amount, new_total)
    return new_total


def get_afc_balances() -> dict[int, float]:
    """Return tokenId -> AFC balance for all agents.

    Static agents: 0 (their balance comes from Mirror Node in the frontend).
    Dynamic agents: tracked cumulative AFC earned from backend.
    """
    result: dict[int, float] = {}
    with _lock:
        for token_id, agent_id in _token_map.items():
            result[token_id] = _afc_earned.get(agent_id, 0.0)
    return result


def get_x402_config(agent_id: str) -> dict | None:
    """Get x402 config for a dynamic agent, or None if not x402-enabled."""
    with _lock:
        return _x402_configs.get(agent_id)


def get_x402_enabled_agents() -> list[str]:
    """Return agent_ids of all dynamic agents with x402 enabled."""
    with _lock:
        return [aid for aid, cfg in _x402_configs.items() if cfg.get("x402_enabled")]

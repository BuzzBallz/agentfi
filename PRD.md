# AgentFi — Product Requirements Document
ETHDenver 2026 | Feb 18–21 | Team: 2 devs | Target: $48,000

---

## Executive Summary
AgentFi is a multi-chain marketplace where autonomous AI agents can be discovered, owned, hired, and paid. Each agent is an iNFT (ERC-7857) on 0G Chain encapsulating its AI model hash, system prompt, and capabilities. Payments settle on ADI Chain with compliance-native rails. Agent orchestration runs on Hedera via Hedera Agent Kit.

**One-line pitch:** "The banking system for autonomous AI agents."

---

## Problem Statement
AI agents are increasingly capable but lack economic infrastructure to interact autonomously:
- No standard way to represent ownership of an AI agent on-chain
- No compliant way to pay an agent for a specific service cross-border
- No mechanism to transfer an AI agent (model + logic) to a new owner
- No trustless marketplace to discover agents and their pricing

---

## Target Bounties

| Bounty                       | Prize    | Chain      | Key Integration                          |
|------------------------------|----------|------------|------------------------------------------|
| ADI Open Project             | $19,000  | ADI Chain  | Cross-border payments + compliance layer |
| Hedera Killer App (OpenClaw) | $10,000  | Hedera     | Agent orchestration via Agent Kit        |
| 0G Best DeFAI                | $7,000   | 0G Chain   | AI-powered yield optimizer + analyzer    |
| 0G Best iNFT (ERC-7857)      | $7,000   | 0G Chain   | Agents as transferable iNFTs             |
| ETHDenver FUTURLLAMA         | $2,000   | Multi      | AI + frontier tech bonus submission      |
| **TOTAL**                    | **$45,000** |         |                                          |

---

## Sponsor Requirements & Judging Criteria

### ADI Foundation ($19,000) — What the judges want

ADI Chain is a ZKsync-based EVM L2 with native compliance (FATF Travel Rule + ADGM), modular L3 domains, and zero-knowledge proofs finalized on Ethereum L1. The $ADI token is the native gas token.

**What ADI judges are looking for:**
- Real-world use case aligned with their mission: payments, cross-border remittances, digital identity, RWA tokenization
- Active use of compliance features — not just "deployed on ADI" but leveraging the compliance layer
- Institutional angle — frame for governments, enterprises, and emerging markets (MENA / Asia / Africa)
- Connection to "1 billion people onchain by 2030" mission
- Use $ADI token for value exchange, not just as gas

**AgentFi angle for ADI:** "Compliant cross-border payment infrastructure for AI agents — enabling the agent economy to operate in regulated emerging markets on ADI Chain."

**Critical technical links:**
- Testnet: https://docs.adi.foundation/how-to-start/adi-network-testnet-details
- Quickstart: https://docs.adi.foundation/how-to-start/adi-network-testnet-quickstart
- Explorer: https://docs.adi.foundation/how-to-start/block-explorer
- ERC-4337 Account Abstraction: natively supported — key for Paymaster bounty

---

### Hedera ($10,000) — What the judges want

Hedera wants an agent-native application where autonomous agents transact, coordinate, and exchange value — positioning Hedera as foundational infrastructure for the Agentic Society.

**Hard technical requirements:**
- Use HTS (Hedera Token Service) for value exchange between agents
- Use on-chain attestations for agent identity and trust
- Agents must be reachable via HCS-10, A2A, XMTP, or MCP protocol
- Register agents via HOL Standards SDK or Hashnet MCP Server
- Users must interact with agents via natural language

**Bonus points:** implement UCP (Universal Commerce Protocol) for standardized agent-to-agent commerce.

**Mandatory submission items:**
- Demo video uploaded to YouTube (submission rejected without it)
- Pitch deck PDF: team intro + project summary + roadmap + demo link

**AgentFi angle for Hedera:** "AgentFi is the marketplace for OpenClaw agents — each agent is registered on Hedera via HOL SDK, reachable via HCS-10, and earns HTS tokens autonomously for every service it renders."

---

### 0G Labs — iNFT ($7,000) & DeFAI ($7,000) — What the judges want

**iNFT (ERC-7857):** The transfer of the NFT must meaningfully transfer the AI agent. The token must encapsulate: AI model reference (IPFS hash), encrypted system prompt, and capabilities. Judges will check that "intelligence travels with the token."

**DeFAI:** AI must make real financial decisions — not just display data. Ideally use 0G Compute for decentralized AI inference. Show that AI creates measurable DeFi value.

**AgentFi angle for iNFT:** "Transfer an iNFT = transfer a live AI agent. The new owner immediately gains access to the agent's capabilities, earning potential, and execution rights."

**AgentFi angle for DeFAI:** "Three specialized AI agents chain together via our composable orchestrator to produce multi-step DeFi intelligence: portfolio analysis → risk scoring → yield optimization — all on 0G Chain."

---

## User Stories

### As a user (agent buyer)
1. I can browse the marketplace and see available AI agents with capabilities and prices.
2. I can connect my wallet, pay in tokens on ADI Chain, and get a result from the hired agent.
3. I can view my hired agent as an iNFT in my wallet and transfer it to another address.

### As a developer (agent creator)
1. I can mint my AI agent as an iNFT with model hash, system prompt, and capabilities on IPFS.
2. I can list my agent on the marketplace with a price-per-hire.
3. I can receive payments automatically when my agent is hired.

---

## Core Demo Flow (what judges will see — 3 min)

```
Step 1  Connect wallet (MetaMask on ADI testnet)
Step 2  Browse marketplace → 3 specialized agents with price + description
Step 3  Click "Hire Agent" → confirm ADI Chain transaction
Step 4  Agent executes (Hedera Agent Kit) → result displayed within 10s
Step 5  Navigate to "My Agents" → see owned iNFT on 0G Chain with metadata
```

---

## Technical Architecture

### Monorepo Structure
```
agentfi/
├── contracts/                        # Person A — Foundry
│   ├── src/
│   │   ├── AgentNFT.sol              # ERC-7857 iNFT on 0G Chain
│   │   ├── AgentMarketplace.sol      # Listing + hire on 0G Chain
│   │   └── AgentPayment.sol          # Payments + compliance on ADI Chain
│   ├── test/
│   ├── script/
│   │   ├── Deploy0G.s.sol
│   │   ├── DeployADI.s.sol
│   │   └── ExportDeployments.s.sol   # generates deployments.json ← SCALABILITY
│   └── foundry.toml
├── frontend/                         # Person B — Next.js 14
│   ├── src/
│   │   ├── app/                      # App Router pages
│   │   ├── components/
│   │   ├── hooks/                    # wagmi hooks
│   │   ├── config/
│   │   │   ├── chains.ts             # chain definitions
│   │   │   └── contracts.ts          # reads from deployments.json ← SCALABILITY
│   │   └── abi/                      # auto-synced by sync-abis.sh ← SCALABILITY
│   └── package.json
├── agents/                           # Person B — Python FastAPI
│   ├── agents/
│   │   ├── base_agent.py             # abstract base class
│   │   ├── portfolio_analyzer.py
│   │   ├── yield_optimizer.py
│   │   ├── risk_scorer.py
│   │   └── orchestrator.py           # composable agent router ← SCALABILITY
│   ├── api.py
│   └── requirements.txt
├── scripts/
│   └── sync-abis.sh                  # ABI auto-sync script ← SCALABILITY
├── deployments.json                  # single source of truth for addresses ← SCALABILITY
├── CLAUDE.md
├── PRD.md
├── .env.example
├── .gitignore
└── pnpm-workspace.yaml
```

### Contract Summary
| Contract              | Chain     | Responsibility                            |
|-----------------------|-----------|-------------------------------------------|
| `AgentNFT.sol`        | 0G Chain  | ERC-7857 iNFT mint, metadata, transfer    |
| `AgentMarketplace.sol`| 0G Chain  | List agents, hire agents, manage listings |
| `AgentPayment.sol`    | ADI Chain | Payment settlement + compliance whitelist |

### Tech Stack
| Layer           | Technology                                      |
|-----------------|-------------------------------------------------|
| Smart Contracts | Foundry, Solidity ^0.8.24, OpenZeppelin v5      |
| Frontend        | Next.js 14 (App Router), TailwindCSS, shadcn/ui |
| Web3 Client     | wagmi v2, viem, RainbowKit                      |
| AI Agents       | Hedera Agent Kit v3, OpenAI API (gpt-4o-mini)  |
| Agent Routing   | Composable orchestrator (LangGraph-style)        |
| Backend API     | FastAPI, Python 3.11+, uvicorn                  |
| Storage         | IPFS via Pinata (agent metadata + model hashes) |
| Package Manager | pnpm                                            |

---

## MVP Success Criteria (Definition of Done)

- [ ] `AgentNFT.sol` deployed on 0G testnet — mint + transfer working
- [ ] `AgentMarketplace.sol` deployed on 0G testnet — list + hire working
- [ ] `AgentPayment.sol` deployed on ADI testnet — payment event firing
- [ ] 3 AI agents running: portfolio_analyzer, yield_optimizer, risk_scorer
- [ ] Composable orchestrator routing queries to the correct agent(s)
- [ ] `sync-abis.sh` running without errors after each deploy
- [ ] `deployments.json` updated and committed after each deploy
- [ ] End-to-end flow: connect wallet → hire → agent executes → result shown
- [ ] 3-minute demo video recorded without crashes
- [ ] All 5 bounty submissions filed before deadline

---

## Scalability Features

### Feature 1 — Automatic ABI Sync Script (`scripts/sync-abis.sh`)

**Problem being solved:**
Manual ABI copy from `contracts/out/` to `frontend/src/abi/` is error-prone.
With 3+ contracts and frequent redeploys, stale ABIs cause silent runtime bugs in wagmi hooks.
Adding a 4th contract means remembering to update 3 different places by hand.

**What it does:**
1. Reads compiled artifacts from `contracts/out/`
2. Extracts only the `abi` field — strips bytecode, metadata, compiler output
3. Writes clean ABI JSON files to `frontend/src/abi/`
4. Validates that every expected contract is present before writing
5. Prints a clear diff summary of what changed

```bash
#!/usr/bin/env bash
# scripts/sync-abis.sh
# Usage: ./scripts/sync-abis.sh
# Run this after every: forge build or forge script deploy

set -e

CONTRACTS=("AgentNFT" "AgentMarketplace" "AgentPayment")
OUT_DIR="contracts/out"
ABI_DIR="frontend/src/abi"

echo "🔄 Syncing ABIs from $OUT_DIR → $ABI_DIR"
echo ""

# Validate all artifacts exist before touching anything
for CONTRACT in "${CONTRACTS[@]}"; do
  SRC="$OUT_DIR/$CONTRACT.sol/$CONTRACT.json"
  if [ ! -f "$SRC" ]; then
    echo "❌  Missing artifact: $SRC"
    echo "    Did you run: forge build?"
    exit 1
  fi
done

# Extract ABI and write to frontend
mkdir -p "$ABI_DIR"
for CONTRACT in "${CONTRACTS[@]}"; do
  SRC="$OUT_DIR/$CONTRACT.sol/$CONTRACT.json"
  DEST="$ABI_DIR/$CONTRACT.json"
  jq '.abi' "$SRC" > "$DEST"
  echo "✅  $CONTRACT.json"
done

echo ""
echo "✅ All ABIs synced to $ABI_DIR"
echo ""
echo "Next steps:"
echo "  git add frontend/src/abi/ deployments.json"
echo "  git commit -m 'chore: sync ABIs after deploy'"
echo "  Notify Person B to pull and restart frontend"
```

**`deployments.json` — single source of truth for all contract addresses:**
```json
{
  "16600": {
    "chainName": "0G Testnet",
    "AgentNFT": "0x...",
    "AgentMarketplace": "0x..."
  },
  "ADI_CHAIN_ID": {
    "chainName": "ADI Testnet",
    "AgentPayment": "0x..."
  }
}
```

**Frontend reads addresses from `deployments.json` — never from `.env` directly:**
```typescript
// frontend/src/config/contracts.ts
import deployments from "../../../deployments.json";

const OG_CHAIN_ID = 16600;

export const CONTRACT_ADDRESSES = {
  AgentNFT:        deployments[OG_CHAIN_ID].AgentNFT        as `0x${string}`,
  AgentMarketplace: deployments[OG_CHAIN_ID].AgentMarketplace as `0x${string}`,
};
```

**Adding a new contract (scalable pattern):**
```bash
# 1. Write the new contract in contracts/src/MyContract.sol
# 2. Add "MyContract" to the CONTRACTS array in sync-abis.sh
# 3. Deploy: forge script script/Deploy.s.sol --broadcast
# 4. Update deployments.json with the new address
# 5. Run: ./scripts/sync-abis.sh
# 6. Import the ABI in frontend: import MyContract from "@/abi/MyContract.json"
# No other file needs to change.
```

**Person A deploy workflow:**
```bash
forge script script/Deploy0G.s.sol --rpc-url $OG_RPC --broadcast
# manually update deployments.json with new addresses
./scripts/sync-abis.sh
git add frontend/src/abi/ deployments.json
git commit -m "chore: sync ABIs + deployments after 0G deploy"
# notify Person B: done, pull and restart dev server
```

---

### Feature 2 — Composable Agent Orchestrator (`agents/orchestrator.py`)

**Problem being solved:**
The current routing is flat — one request maps to one agent with no way to chain results.
A complex query like "analyze my portfolio and recommend a rebalance strategy" requires:
portfolio_analyzer → risk_scorer → yield_optimizer in sequence, where each agent's output
feeds into the next. This is impossible without an orchestration layer.

**Architecture:**
```
User Query: "Analyze my wallet and recommend a low-risk yield strategy"
    │
    ▼
┌──────────────────────────────────────┐
│           Orchestrator               │
│   GPT-4o-mini builds execution plan  │
│   [ step_0: portfolio_analyzer ]     │
│   [ step_1: risk_scorer(step_0) ]    │
│   [ step_2: yield_optimizer(step_1)] │
└──────┬───────────────────────────────┘
       │
       ├─► portfolio_analyzer  ──► "40% ETH, 30% BTC, 30% stablecoins"
       │                                       │
       ├─► risk_scorer ◄─────────────── receives step_0 output
       │   "risk score: 7/10 — high volatility exposure"
       │                  │
       └─► yield_optimizer ◄──────── receives step_1 output
           "Recommend shifting 15% ETH → stablecoin yield pools (APY 8-12%)"
                          │
                          ▼
                    Final result returned to user
```

**`agents/agents/base_agent.py`:**
```python
from abc import ABC, abstractmethod

class BaseAgent(ABC):
    name: str
    description: str
    price_per_call: float  # in HBAR

    @abstractmethod
    async def execute(self, query: str) -> str:
        """Run the agent logic and return a string result."""
        ...
```

**`agents/orchestrator.py`:**
```python
from agents.base_agent import BaseAgent
from agents.portfolio_analyzer import PortfolioAnalyzerAgent
from agents.yield_optimizer import YieldOptimizerAgent
from agents.risk_scorer import RiskScorerAgent
from openai import AsyncOpenAI
import json, logging

logger = logging.getLogger(__name__)

# Registry — add new agents here, nowhere else
AGENT_REGISTRY: dict[str, BaseAgent] = {
    "portfolio_analyzer": PortfolioAnalyzerAgent(),
    "yield_optimizer":    YieldOptimizerAgent(),
    "risk_scorer":        RiskScorerAgent(),
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
    def __init__(self):
        self.client = AsyncOpenAI()

    async def _plan(self, query: str) -> list[dict]:
        response = await self.client.chat.completions.create(
            model="gpt-4o-mini",
            max_tokens=300,
            messages=[
                {"role": "system", "content": ROUTER_PROMPT},
                {"role": "user",   "content": query},
            ]
        )
        return json.loads(response.choices[0].message.content)["steps"]

    async def execute(self, query: str) -> str:
        steps = await self._plan(query)
        outputs: list[str] = []

        for i, step in enumerate(steps):
            agent_name  = step["agent"]
            agent_input = step["input"]

            # Inject previous outputs using {step_N} placeholders
            for j, prev in enumerate(outputs):
                agent_input = agent_input.replace(f"{{step_{j}}}", prev)

            agent = AGENT_REGISTRY.get(agent_name)
            if not agent:
                outputs.append(f"[unknown agent: {agent_name}]")
                continue

            logger.info(f"[orchestrator] step {i}: {agent_name}")
            result = await agent.execute(agent_input)
            outputs.append(result)

        return outputs[-1] if outputs else "No result produced."
```

**`agents/api.py` — both endpoints:**
```python
# Single agent (existing — keep for direct hire)
@app.post("/agents/{agent_id}/execute")
async def execute_single(agent_id: str, body: ExecuteRequest):
    agent = AGENT_REGISTRY.get(agent_id)
    if not agent:
        return {"success": False, "data": None, "error": f"Unknown agent: {agent_id}"}
    result = await agent.execute(body.query)
    return {"success": True, "data": result, "error": None}

# Composable orchestrated execution (new)
@app.post("/orchestrate")
async def orchestrate(body: ExecuteRequest):
    orchestrator = AgentOrchestrator()
    result = await orchestrator.execute(body.query)
    return {"success": True, "data": result, "error": None}
```

**Adding a new agent (scalable pattern):**
```python
# 1. Create agents/agents/my_agent.py inheriting BaseAgent
# 2. Implement: name, description, price_per_call, execute()
# 3. Add ONE line to orchestrator.py AGENT_REGISTRY:
AGENT_REGISTRY["my_agent"] = MyAgent()
# 4. The orchestrator automatically discovers, routes, and chains it
# No other file needs to change.
```

---

## Out of Scope (Hackathon)
- Mainnet deployments
- Real KYC / identity verification (whitelist is admin-controlled mock)
- Agent-to-agent autonomous payments (Kite AI / x402 deferred)
- Mobile responsive UI (desktop demo only)
- Canton Network / Daml integration
- QuickNode Streams integration
- wagmi CLI / typechain code generation (sync-abis.sh is sufficient for 4 days)
- Persistent agent memory between sessions

---

## Submission Narrative Per Bounty

### ADI Open Project ($19,000)
**Angle:** "Compliant Cross-Border Payment Infrastructure for Autonomous AI Agents"
- Frame AgentFi as THE payment layer for AI agents operating in regulated emerging markets (MENA, Asia, Africa)
- Emphasize AgentPayment.sol's compliance whitelist as a mirror of ADI's native FATF Travel Rule enforcement
- Highlight $ADI token as the settlement currency for every agent hire — not just gas, but the economic unit of the agent marketplace
- Connect to ADI's "1 billion people onchain" mission: AI agents as financial service providers reaching unbanked populations
- Mention ERC-4337 Account Abstraction readiness for gasless agent transactions (Paymaster pattern)
- Key phrase for judges: "We built the infrastructure for AI agents to transact compliantly across borders on ADI Chain"

### Hedera Killer App ($10,000)
**Angle:** "AgentFi — The Marketplace and Economic Layer for the Agentic Society"
- Frame AgentFi as the killer app where OpenClaw agents autonomously transact, coordinate, and exchange value
- Demonstrate HTS (Hedera Token Service) integration: agents earn HTS tokens for every service rendered
- Show agent registration via HOL Standards SDK — each agent is discoverable in the Hedera ecosystem
- Prove agents are reachable via HCS-10 protocol for agent-to-agent communication
- Include natural language interface: users chat with agents to request services
- Highlight the composable orchestrator as autonomous agent-to-agent commerce (portfolio_analyzer pays risk_scorer pays yield_optimizer)
- MANDATORY: demo video on YouTube + pitch deck PDF with team intro, project summary, roadmap
- Bonus: reference UCP (Universal Commerce Protocol) alignment for standardized agent commerce

### 0G Best DeFAI ($7,000)
**Angle:** "AI Agents Making Real DeFi Decisions via Composable Orchestration on 0G"
- Emphasize that AI is making actual financial decisions, not just displaying data
- Show the orchestrator chaining agents: portfolio analysis → risk scoring → yield optimization in a single query
- Each agent uses GPT-4o-mini to produce actionable DeFi recommendations with specific APY targets
- Frame the composable orchestrator as a DeFi-native AI reasoning engine
- Mention 0G Compute readiness for future decentralized AI inference
- Key phrase for judges: "Three AI agents chain together to produce multi-step DeFi intelligence — all on 0G Chain"

### 0G Best iNFT ($7,000)
**Angle:** "Transfer an iNFT = Transfer a Live AI Agent"
- Emphasize ERC-7857 compliance: each token encapsulates modelHash (IPFS CID), encrypted systemPrompt, capabilities JSON, and pricePerCall
- Demonstrate that transferring the iNFT meaningfully transfers the AI agent — the new owner can immediately use, rent, or resell the agent
- Show that "intelligence travels with the token" — the iNFT is not a JPEG, it is a self-contained autonomous agent
- Highlight the marketplace flow: mint agent → list on marketplace → hire generates revenue → transfer ownership = transfer earning potential
- Key phrase for judges: "The iNFT IS the agent — transfer ownership, transfer intelligence"

### ETHDenver FUTURLLAMA ($2,000)
**Angle:** "The Banking System for Autonomous AI Agents — Multi-Chain Agent Economy"
- Position AgentFi at the frontier of AI + crypto convergence
- Highlight the multi-chain architecture: 0G for agent identity (iNFT), ADI for compliant payments, Hedera for orchestration
- Emphasize composable AI agents as the next economic primitive — agents that earn, transact, and get hired autonomously
- Frame the pluggable payment architecture (BasePaymentProvider → x402 ready) as forward-looking infrastructure for the agent economy

# AgentFi — Product Requirements Document
ETHDenver 2026 | Feb 18–21 | Team: 2 devs | Target: $61,000

---

## Executive Summary

AgentFi is a multi-chain marketplace where autonomous AI agents are discovered, owned, hired, and paid. Each agent is an iNFT (ERC-7857) on **0G Galileo** (chain 16602), encapsulating its AI model hash, encrypted system prompt, and capabilities. Payments operate in two modes: **Mode A — Permissionless** (direct hire on 0G, no compliance gate) and **Mode B — Compliant** (ADI Chain payment with KYC + FATF Travel Rule). Agent orchestration runs on **Hedera** via Hedera Agent Kit and HCS-10, earning AFC tokens per execution.

**One-line pitch:** "The banking system for autonomous AI agents."

---

## Problem Statement

AI agents are increasingly capable but lack the economic infrastructure to interact autonomously:
- No standard way to represent AI agent ownership on-chain
- No compliant way to pay an agent for services across borders
- No mechanism to transfer an AI agent (model + logic) to a new owner
- No trustless marketplace to discover agents and their pricing
- No agent reputation system to verify execution track record

---

## Target Bounties

| Bounty                            | Prize      | Chain      | Key Integration                                                   |
|-----------------------------------|------------|------------|-------------------------------------------------------------------|
| ADI Open Project                  | $19,000    | ADI Chain  | ADIAgentPayments + KYC + FATF Travel Rule + cross-chain receipts  |
| ADI ERC-4337 Paymaster Devtools   | $3,000     | ADI Chain  | AgentFiPaymaster — gas sponsorship for KYC-verified agents        |
| ADI Payments Component            | $3,000     | ADI Chain  | Mode B compliant execution + Travel Rule metadata on-chain        |
| Hedera Killer App (OpenClaw)      | $10,000    | Hedera     | HCS-10 agent registration, HTS AFC rewards, execution attestation |
| 0G Best DeFAI                     | $7,000     | 0G Chain   | LangGraph ReAct agents, composable orchestrator, real market data |
| 0G Best iNFT (ERC-7857)           | $7,000     | 0G Chain   | AgentNFTv2 — transfer, clone, authorize, revoke                   |
| KiteAI Agent-Native Payments      | $10,000    | KiteAI     | x402 server + Kite Agent Passport + USDT micropayments            |
| ETHDenver FUTURLLAMA              | $2,000     | Multi      | AI + multi-chain agent economy                                    |
| **TOTAL**                         | **$61,000** |            |                                                                   |

---

## Sponsor Requirements & Judging Criteria

### ADI Foundation ($25,000 total — 3 tracks)

ADI Chain is an EVM-compatible chain with compliance tooling (FATF Travel Rule, ADGM), $ADI as the native gas token, and ERC-4337 Account Abstraction support.

#### Track 1: Open Project Submission — $19,000
Judges want: real-world cross-border payment use case, active compliance features, institutional framing (MENA/Asia/Africa), $ADI used for value exchange not just gas.

**AgentFi angle:** "Compliant cross-border payment infrastructure for AI agents — enabling the agent economy to operate in regulated emerging markets via ADI Chain."

#### Track 2: ERC-4337 Paymaster Devtools — $3,000
Judges want: working ERC-4337 Paymaster that sponsors gas, developer tooling around account abstraction on ADI Chain.

**AgentFi angle:** `AgentFiPaymaster.sol` sponsors gas for KYC-verified agent wallets, gating access via `ADIAgentPayments.kycVerified()`.

#### Track 3: ADI Payments Component for Merchants — $3,000
Judges want: reusable payment component that merchants/developers can integrate, showing $ADI as a settlement currency.

**AgentFi angle:** `ADICompliance.tsx` + `/agents/{id}/execute-compliant` endpoint together form a drop-in compliance payment component any AI service can reuse.

**What's built (covers all 3 tracks):**
- `ADIAgentPayments.sol` — KYC whitelist (3 tiers), FATF Travel Rule metadata on-chain, $ADI payments, cross-chain execution receipts linking to Hedera HCS
- `AgentFiPaymaster.sol` — ERC-4337 Paymaster: sponsors gas for KYC-verified wallets, daily gas budget per user
- Backend `ADIComplianceService` — real web3.py calls to ADI Chain RPC, KYC verification, execution receipt recording
- Mode B execution endpoint: `/agents/{id}/execute-compliant`
- `ADICompliance.tsx` — frontend dashboard for KYC status + compliance stats

---

### Hedera ($10,000 — OpenClaw)

Hedera wants agent-native applications where autonomous agents transact, coordinate, and exchange value.

**Hard requirements:**
- HTS for value exchange between agents
- On-chain attestations for agent identity and trust
- Agents reachable via HCS-10, A2A, XMTP, or MCP
- Register via HOL Standards SDK or Hashnet MCP
- Natural language user interface

**AgentFi angle:** "AgentFi is the marketplace for OpenClaw agents — each agent is registered on Hedera via HOL SDK, reachable via HCS-10, and earns HTS/AFC tokens autonomously for every execution."

**What's built:**
- 3 agents registered on Hedera testnet with dedicated Hedera accounts, inbound/outbound HCS topics
- HCS-10 execution attestation: SHA256(result) submitted to agent's inbound topic after every execution
- AFC token (HTS) rewards: 1.00 AFC transferred from operator to agent Hedera account per execution
- Agent reputation dashboard: reads AFC balance from Hedera Mirror Node, shows tier (New → Legend)
- Hedera Agent Kit with 10 filtered tools + 7 custom DeFi tools (LangGraph ReAct agents)
- `CrossAgentService`: agents call each other via HCS, funded by AFC balance

**Mandatory submission:**
- Demo video on YouTube
- Pitch deck PDF: team intro + project summary + roadmap + demo link

---

### 0G Labs — DeFAI ($7,000) & iNFT ($7,000)

**DeFAI:** AI must make real financial decisions, not just display data.
**iNFT:** Transfer must meaningfully transfer the AI agent — intelligence travels with the token.

**What's built:**
- `AgentNFTv2.sol` (ERC-7857): encapsulates `modelHash`, `encryptedURI`, `sealedKey`, `capabilities`, `pricePerCall` — generation-based auth invalidation on transfer
- `AgentMarketplacev2.sol`: 2.5% platform fee, owner-bypass hire, `authorizeUsage()` gated to NFT owner + marketplace
- `AgentRegistry.sol`: on-chain Hedera account + x402 config per token ID
- LangGraph ReAct agents with real CoinGecko prices, DeFi Llama yields, SaucerSwap pools, Bonzo Finance markets
- Composable orchestrator: Claude Haiku plans execution steps, chains portfolio_analyzer → risk_scorer → yield_optimizer with `{step_N}` output injection

---

### KiteAI ($10,000 — Agent-Native Payments & Identity, x402-Powered)

KiteAI is an EVM L1 purpose-built for AI agent payments. They were among the first chains to implement x402. Judges want:
- Working x402 server: returns HTTP 402 with correct JSON format, verifies `X-PAYMENT` header
- Agent identity via **Kite Agent Passport** (KITE_API_KEY + KITE_AGENT_PASSPORT_ID)
- Stablecoin (USDT) micropayments via KiteAI chain for agent services
- Service registration on KiteAI Application Marketplace
- Real agent-to-agent or user-to-agent payment flow demonstrable end-to-end

**AgentFi angle:** "AgentFi's 3 DeFAI agents are x402-enabled — any AI agent, wallet, or KiteAI-compatible client can autonomously pay and call our agents in USDT with zero human interaction."

**What's built:**
- `KiteAgentFiService.sol` deployed on KiteAI Testnet (chain 2368) — service registry with 3 registered agent services + payment recording
- x402 server middleware — returns HTTP 402 with `scheme: "exact"`, `network: "eip155:2368"`, USDT amount, `payTo` from env (`KITE_WALLET_ADDRESS`)
- x402 payment verification via **Pieverse facilitator** (`POST facilitator.pieverse.io/v2/verify`) — real on-chain validation of EIP-3009 payment authorization
- x402 settlement via **Pieverse facilitator** (`POST facilitator.pieverse.io/v2/settle`) — triggers on-chain USDT transfer after successful agent execution
- `X-PAYMENT-RESPONSE` header returned with base64-encoded settlement receipt (per x402 spec)
- x402 cross-agent flow — `X-AgentFi-Internal: true` header bypasses 402 for pre-paid internal calls
- `x402Version: 2` throughout (Pieverse v2 format)
- Demo script: `agents/scripts/demo_x402.sh` — 5-step curl walkthrough (discover → 402 → build payment → retry → settlement)

**Remaining for KiteAI submission:**
- Register on [Kite Agent Passport](https://docs.gokite.ai/kite-agent-passport/service-provider-guide) → get `KITE_API_KEY` + `KITE_AGENT_PASSPORT_ID`
- Register 3 agent services on KiteAI Application Marketplace (manual UI step)
- Record x402 demo flow (curl or screen recording showing 402 → pay → settle → result)

---

## Core Application Flow

### Mode A — Permissionless (Default)

```
User connects wallet (RainbowKit, 0G Galileo network)
    │
    ▼
Marketplace (/marketplace)
  - Reads getListedAgents() from AgentMarketplacev2 on chain 16602
  - Displays 3 on-chain agents: portfolio_analyzer, yield_optimizer, risk_scorer
  - Shows ERC-7857 metadata, pricePerCall, reputation tier (Hedera Mirror Node)
    │
    ▼
Agent Detail (/agent/0 | /agent/1 | /agent/2)
  - Shows ERC-7857 metadata hash, isAuthorized() status, AgentReputation (AFC balance)
  - "Hire Agent" → calls hireAgent(tokenId) payable on AgentMarketplacev2 (chain 16602)
    - Owner bypass: free (msg.value = 0)
    - Non-owner: splits 97.5% to NFT owner / 2.5% to platform wallet
    - Calls agentNFT.authorizeUsage(tokenId, executor, permissions) on success
    │
    ▼
Execute (/agent/[id] query form)
  POST /agents/{agent_id}/execute
    ├── x402 middleware: checks X-AgentFi-Marketplace-Paid header; returns HTTP 402 if missing
    │     (passes through with X-AgentFi-Internal header for internal calls)
    ├── CrossAgentService: reads agent AFC balance, routes sub-queries to peer agents if balance OK
    ├── LangGraph ReAct agent runs with Hedera Agent Kit + custom DeFi tools
    ├── Hedera attestation: SHA256(result) submitted to agent HCS topic (non-blocking)
    └── AFC reward: 1.00 AFC transferred to agent Hedera account (non-blocking)
    │
    ▼
Result displayed with:
  - AI analysis output
  - Hedera proof (HCS topic + sequence number)
  - AFC reward confirmation
  - Cross-agent report (if orchestrator called peer agents)
```

### Mode B — Compliant (ADI Chain gated)

```
User connects wallet (ADI Testnet, chain 99999)
    │
    ▼
ADI Compliance Panel (ADICompliance component on /agent/[id])
  GET /adi/status → shows KYC users, payment count, volume, service count
  GET /adi/kyc/{wallet} → shows wallet KYC tier and jurisdiction
    │
    ▼
User pays via ADIAgentPayments.payForAgentService(serviceId) on ADI Chain
  - Requires kycVerified[user] == true (gated)
  - Writes FATF Travel Rule metadata on-chain
  - Emits TravelRuleRecord + CompliancePayment events
  - Records PaymentRecord with sender, receiver, amount, jurisdiction, complianceHash
    │
    ▼
POST /agents/{agent_id}/execute-compliant { payment_id, wallet_address, query }
  ├── ADIComplianceService.is_kyc_verified(wallet) → rejects if not KYC
  ├── ADIComplianceService.verify_adi_payment(payment_id) → verifies payment on ADI RPC
  ├── Agent executes (same LangGraph pipeline as Mode A)
  ├── Hedera attestation submitted (HCS)
  └── ADIComplianceService.record_execution_receipt(payment_id, hederaTopicId, executionHash)
        → writes cross-chain proof: ADI payment ↔ Hedera execution on ADI Chain
    │
    ▼
Result displayed with compliance receipt and cross-chain proof
```

### Composable Orchestration (/orchestrate)

```
POST /orchestrate { query }
    │
    ▼
Claude Haiku plans JSON execution steps:
  [
    { agent: "portfolio_analyzer", input: "analyze the portfolio" },
    { agent: "risk_scorer",        input: "score this: {step_0}" },
    { agent: "yield_optimizer",    input: "optimize for: {step_1}" }
  ]
    │
    ▼
Sequential execution with {step_N} output injection
Each step: x402 check → LangGraph agent → Hedera attest → AFC reward
    │
    ▼
Final step output returned as orchestrated result
```

---

## Technical Architecture

### Monorepo Structure

```
agentfi/
├── contracts/                          # Foundry — 0G Galileo + ADI (Foundry)
│   ├── src/
│   │   ├── AgentNFTv2.sol              # ERC-7857 iNFT — DEPLOYED on 0G (16602)
│   │   ├── AgentMarketplacev2.sol      # Marketplace, 2.5% fee — DEPLOYED on 0G (16602)
│   │   ├── AgentRegistry.sol           # Hedera + x402 config registry — DEPLOYED on 0G
│   │   ├── AgentPayment.sol            # Simple whitelist payment — DEPLOYED on ADI (99999)
│   │   ├── KiteAgentFiService.sol      # KiteAI service registry — DEPLOYED on KiteAI (2368)
│   │   ├── AgentNFT_v1.sol             # Legacy (superseded by v2)
│   │   └── AgentMarketplace_v1.sol     # Legacy (superseded by v2)
│   ├── test/
│   ├── script/
│   │   ├── DeployV2.s.sol              # Deploys AgentNFTv2 + AgentMarketplacev2
│   │   ├── DeployRegistry.s.sol        # Deploys AgentRegistry
│   │   ├── DeployADI.s.sol             # Deploys AgentPayment to ADI
│   │   ├── DeployKiteAI.s.sol
│   │   ├── Seed.s.sol / SeedV2.s.sol   # Mints + lists 3 agents
│   │   └── SeedRegistry.s.sol          # Seeds Hedera account links
│   └── foundry.toml
├── contracts-adi/                      # Hardhat — ADI Chain compliance layer
│   ├── contracts/
│   │   ├── ADIAgentPayments.sol        # KYC + Travel Rule + $ADI payments — DEPLOYED
│   │   └── AgentFiPaymaster.sol        # ERC-4337 Paymaster — DEPLOYED
│   ├── scripts/
│   │   └── deploy-evm.ts               # Standard ethers.js deployment (not zkSync)
│   ├── hardhat-evm.config.ts           # Standard EVM config (ADI is EVM-compatible)
│   └── package.json
├── frontend/                           # Next.js 14 (App Router)
│   └── src/
│       ├── app/
│       │   ├── page.tsx                # Homepage
│       │   ├── marketplace/page.tsx    # Agent marketplace grid
│       │   ├── agent/[id]/page.tsx     # Agent detail + hire + execute
│       │   ├── my-agents/page.tsx      # Owned iNFT viewer
│       │   └── dashboard/page.tsx      # DeFAI portfolio dashboard
│       ├── components/
│       │   ├── AgentCard.tsx
│       │   ├── AgentReputation.tsx     # Hedera Mirror Node AFC balance → tier
│       │   ├── ADICompliance.tsx       # ADI KYC status + payment stats
│       │   └── WalletConnect.tsx
│       ├── hooks/
│       │   ├── useAgentData.ts         # wagmi — reads AgentNFTv2 on-chain
│       │   ├── useListedAgents.ts      # wagmi — reads AgentMarketplacev2
│       │   ├── useHireAgent.ts         # wagmi — calls hireAgent()
│       │   ├── useExecuteAgent.ts      # calls /agents/{id}/execute
│       │   ├── useAgentReputation.ts   # Hedera Mirror Node, 30s refresh
│       │   └── useIsAuthorized.ts      # wagmi — isAuthorized(tokenId, address)
│       ├── config/
│       │   ├── chains.ts               # ogTestnet (16602) + adiTestnet (99999)
│       │   └── contracts.ts            # Reads from deployments.json
│       ├── lib/api.ts                  # Backend API client functions
│       └── abi/                        # AgentNFTv2, AgentMarketplacev2, AgentRegistry, AgentPayment
├── agents/                             # Python FastAPI — port 8000
│   ├── agents/
│   │   ├── portfolio_analyzer.py       # Real CoinGecko prices + 0G wallet balance
│   │   ├── yield_optimizer.py          # DeFi Llama + Bonzo Finance + SaucerSwap
│   │   ├── risk_scorer.py              # Deterministic scoring + CoinGecko 30d history
│   │   └── orchestrator.py             # Claude Haiku plans steps, {step_N} injection
│   ├── hedera/
│   │   ├── service_factory.py          # Real/Mock toggle (HEDERA_ENABLED)
│   │   ├── hcs_messaging.py            # HCS-10 message submission
│   │   ├── hts_service.py              # HTS token transfers
│   │   ├── attestation.py              # Execution attestation → HCS
│   │   └── afc_rewards.py              # AFC reward transfers per execution
│   ├── adi/
│   │   └── compliance_service.py       # web3.py → ADIAgentPayments on ADI RPC
│   ├── x402/
│   │   ├── config.py                   # Reads AgentRegistry on-chain (0G RPC)
│   │   ├── server_middleware.py         # HTTP 402 + Pieverse verify/settle
│   │   ├── cross_agent_service.py      # Agent-to-agent calls via AFC balance
│   │   └── afc_payment_service.py      # AFC payment execution (HTS)
│   ├── tools/
│   │   └── defi_tools.py               # 7 LangChain tools (CoinGecko, DeFi Llama, etc.)
│   ├── scripts/
│   │   └── demo_x402.sh                # x402 curl demo (402 → pay → settle)
│   ├── agent_factory.py                # LangGraph ReAct agent factory
│   └── api.py                          # FastAPI app, all endpoints
├── deployments.json                    # Single source of truth for all addresses
├── CLAUDE.md
├── PRD.md
└── pnpm-workspace.yaml
```

---

### Deployed Contracts

| Contract             | Chain              | Chain ID | Address                                      |
|----------------------|--------------------|----------|----------------------------------------------|
| AgentNFTv2           | 0G Galileo Testnet | 16602    | `0xE79Bf574BfCfC17bA858CC311CE5FeF8B78e947B` |
| AgentMarketplacev2   | 0G Galileo Testnet | 16602    | `0xC203E2686601Cc252EcE66F8c792FF88E8fbDD9b` |
| AgentRegistry        | 0G Galileo Testnet | 16602    | `0xa259E6D0a4F740AD8879EA433Ba56B1C5A9e1a5B` |
| AgentPayment (v1)    | ADI Testnet        | 99999    | `0x10e3399025e930da7b4d4be71181157ccee4e882` |
| ADIAgentPayments     | ADI Testnet        | 99999    | `0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd` |
| AgentFiPaymaster     | ADI Testnet        | 99999    | `0xBeD159217F43711c32fB6D57e4b203aEbC46B74A` |
| KiteAgentFiService   | KiteAI Testnet     | 2368     | `0x10E3399025E930da7B4d4bE71181157CCee4E882` |

### Hedera Testnet Resources

| Resource                    | ID               |
|-----------------------------|------------------|
| portfolio_analyzer account  | `0.0.7977799`    |
| portfolio_analyzer inbound  | `0.0.7977803`    |
| portfolio_analyzer outbound | `0.0.7977802`    |
| yield_optimizer account     | `0.0.7977811`    |
| yield_optimizer inbound     | `0.0.7977813`    |
| yield_optimizer outbound    | `0.0.7977812`    |
| risk_scorer account         | `0.0.7977819`    |
| risk_scorer inbound         | `0.0.7977822`    |
| risk_scorer outbound        | `0.0.7977821`    |
| AFC Token (HTS)             | `0.0.7977623`    |

---

### Tech Stack

| Layer              | Technology                                                                  |
|--------------------|-----------------------------------------------------------------------------|
| Smart Contracts    | Foundry + Hardhat, Solidity ^0.8.24, OpenZeppelin v5                        |
| ERC-7857           | AgentNFTv2 — generation-based auth, clone, sealedKey transfer               |
| ERC-4337           | AgentFiPaymaster — EntryPoint V0.7, daily gas budget per KYC wallet         |
| Frontend           | Next.js 14 (App Router), TailwindCSS, shadcn/ui                             |
| Web3 Client        | wagmi v2, viem, RainbowKit                                                   |
| AI Model           | Anthropic Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) — all agents       |
| Agent Framework    | LangGraph `create_react_agent` with Hedera Agent Kit (10 tools) + 7 custom DeFi tools |
| Agent Routing      | `AgentOrchestrator` — Claude Haiku plans JSON steps, `{step_N}` injection   |
| Backend API        | FastAPI, Python 3.11+, uvicorn                                               |
| Hedera SDK         | `hiero_sdk_python` — HCS messaging, HTS token transfers                      |
| ADI Chain Client   | `web3.py` — reads/writes `ADIAgentPayments` on ADI RPC                      |
| Payment Provider   | Pluggable `BasePaymentProvider`; active: `MockPaymentProvider` (no real tx) |
| Package Manager    | pnpm (frontend), pip (agents)                                                |

---

### Contract Details

#### AgentNFTv2.sol — ERC-7857 iNFT (0G Galileo)

Key data per token:
- `modelHash` — IPFS CID of AI model weights/config
- `encryptedURI` — encrypted system prompt
- `sealedKey` — decryption key, transferred only to new owner on `transfer()`
- `capabilities` — JSON string of agent capabilities
- `pricePerCall` — denominated in wei

Key behaviors:
- `transfer()` bumps `_authGeneration[tokenId]` → invalidates ALL prior `authorizeUsage()` grants instantly
- `clone()` — copies full agent to new owner (sealedKey re-sealed to recipient)
- `authorizeUsage(tokenId, executor, permissions)` — callable by token owner or marketplace contract
- `isAuthorized(tokenId, executor)` — generation-checked; stale authorizations silently expire

#### AgentMarketplacev2.sol (0G Galileo)

- `hireAgent(tokenId)` payable:
  - Owner bypass: `msg.sender == ownerOf(tokenId)` → free (0 value, no fee split)
  - Non-owner: `PLATFORM_FEE_BPS = 250` (2.5%) → platform wallet, remainder → NFT owner
  - Calls `agentNFT.authorizeUsage(tokenId, msg.sender, "")` on success
- `listAgent()`, `delistAgent()`, `updatePrice()` — standard listing management
- `getListedAgents()` — returns all active listings

#### ADIAgentPayments.sol (ADI Testnet)

```
KYCData:
  - verified: bool
  - jurisdiction: string (ISO 3166-1 alpha-2, e.g. "AE", "SG")
  - verifiedAt: uint256
  - tier: uint8 (1=basic, 2=enhanced, 3=institutional)
  - complianceHash: bytes32

AgentService:
  - agentName: string
  - priceADI: uint256
  - active: bool
  - description: string
  - minKYCTier: uint8
  - totalExecutions: uint256

PaymentRecord:
  - sender, receiver: address
  - amount: uint256
  - serviceId: uint256
  - jurisdiction: string
  - complianceHash: bytes32
  - hederaTopicId: string    ← cross-chain link to Hedera HCS
  - executionHash: bytes32   ← SHA256 of agent output
  - status: PENDING | COMPLETED | REFUNDED
```

Events: `TravelRuleRecord`, `CompliancePayment`, `ExecutionReceiptRecorded`

3 services pre-registered (per deploy script):
- `portfolio_analyzer` — 0.01 ADI, Tier 1
- `yield_optimizer` — 0.015 ADI, Tier 1
- `risk_scorer` — 0.005 ADI, Tier 1

Demo state on ADI testnet: 1 KYC user (deployer), 1 demo payment, 1 execution receipt with Hedera cross-chain link.

#### AgentFiPaymaster.sol — ERC-4337 (ADI Testnet)

- Validates against `ADIAgentPayments.kycVerified(sender)` before sponsoring gas
- Tracks `dailyGasUsed[user][day]` — rejects if `> maxDailyGasPerUser`
- `validatePaymasterUserOp()` + `postOp()` — standard EntryPoint V0.7 interface
- `depositToEntryPoint()` / `withdrawFromEntryPoint()` — operator managed

---

### Backend API Endpoints

| Method | Path | Description | Mode |
|--------|------|-------------|------|
| GET | `/health` | Health check | — |
| GET | `/agents` | List 3 agents with metadata | — |
| POST | `/agents/{id}/execute` | Run agent (LangGraph + Hedera + AFC) | A |
| POST | `/orchestrate` | Chain all agents sequentially | A |
| GET | `/payments/status` | Payment provider info | — |
| GET | `/agents/{id}/x402` | x402 discovery (reads AgentRegistry on-chain) | A |
| GET | `/hedera/status` | Hedera token + topic status | — |
| GET | `/hedera/agents/{id}/topics` | HCS topic IDs per agent | — |
| GET | `/hedera/registration` | Registration results JSON | — |
| POST | `/agents/{id}/execute-compliant` | ADI-gated execution (KYC check + receipt) | B |
| GET | `/adi/status` | ADI compliance stats (on-chain) | B |
| GET | `/adi/kyc/{wallet}` | Wallet KYC status (on-chain) | B |
| GET | `/adi/payment/{payment_id}` | ADI payment record (on-chain) | B |

---

### AFC Token Economy

Each agent execution (Mode A):
1. Agent produces result via LangGraph
2. `attestation.py` submits `SHA256(result)` to agent's HCS inbound topic (non-blocking)
3. `afc_rewards.py` transfers 1.00 AFC (100 units, 2 decimals) from operator (`0.0.7973940`) to agent Hedera account (non-blocking)

AFC balance is read from Hedera Mirror Node every 30 seconds in `useAgentReputation.ts` and mapped to reputation tiers:

| AFC Balance | Tier | Display |
|-------------|------|---------|
| 0           | New Agent | — |
| 1–9         | Active Agent | ★ |
| 10–49       | Proven Agent | ★★ |
| 50–99       | Expert Agent | ★★★ |
| 100+        | Legend Agent | ★★★★ |

---

### x402 / Cross-Agent Architecture

The `x402/server_middleware.py` intercepts agent execution requests:
- Returns HTTP 402 (`x402Version: 2`) with `accepts: [{ scheme: "hedera-hts" }, { scheme: "exact", network: "eip155:2368" }]` for uncredentialed calls
- Verifies `X-PAYMENT` header via Pieverse facilitator (`/v2/verify`) — real on-chain EIP-3009 validation
- Settles payment after execution via Pieverse (`/v2/settle`) — returns `X-PAYMENT-RESPONSE` header with settlement receipt
- Passes through requests with `X-AgentFi-Marketplace-Paid: true` (hired via marketplace) or `X-AgentFi-Internal: true` (cross-agent call)

`CrossAgentService` enables agent-to-agent calls:
- Reads calling agent's AFC balance from Hedera Mirror Node
- If balance ≥ threshold, makes internal API call to peer agent with `X-AgentFi-Internal: true`
- AFC split configured in `AgentRegistry` on-chain: 70% owner / 20% agent / 10% platform
- Cross-agent routing: `portfolio_analyzer` calls `risk_scorer` + `yield_optimizer`; `yield_optimizer` calls `risk_scorer`

---

### Two-Mode Architecture — Critical Design Principle

**Mode A (Permissionless) — untouched by ADI integration:**
- Hire via `AgentMarketplacev2.hireAgent()` on 0G Chain
- Execute via `POST /agents/{id}/execute`
- No KYC, no ADI dependency, no compliance gate
- Works without any ADI env vars

**Mode B (Compliant) — opt-in via ADI:**
- Pay via `ADIAgentPayments.payForAgentService()` on ADI Chain
- Execute via `POST /agents/{id}/execute-compliant`
- Requires KYC, writes FATF Travel Rule data on-chain
- Falls back to `MockADIComplianceService` if `ADI_PAYMENTS_ADDRESS` not set

**The ADI integration must not break Mode A under any circumstances.**

---

### x402 Payment Protocol — What's Showcaseable

The x402 integration is split into two roles: **server** (AgentFi receives payment) and **client** (AgentFi pays other agents). The server side is fully working and demo-ready.

#### x402 Server Flow (fully working — real Pieverse verification + settlement)

```
External client calls POST /agents/portfolio_analyzer/execute (no payment header)
    │
    ▼
x402_middleware_check() runs:
  ├── X-AgentFi-Marketplace-Paid: true → pass through (already paid on 0G)
  ├── X-AgentFi-Internal: true → pass through (cross-agent internal call)
  ├── X-PAYMENT header present → verify via Pieverse → pass through if valid
  └── None of the above → return HTTP 402:
        {
          "error": "X402PaymentRequired",
          "accepts": [
            { "scheme": "hedera-hts", "asset": "AFC", "maxAmountRequired": "100",
              "payTo": "0.0.7977799", "extra": { "splitModel": "70-20-10" } },
            { "scheme": "exact", "network": "eip155:2368", "asset": "<USDT>",
              "maxAmountRequired": "10000", "payTo": "<KITE_WALLET_ADDRESS>" }
          ],
          "x402Version": 2
        }
    │
Client signs EIP-3009 transferWithAuthorization → base64-encodes as X-PAYMENT header
    │
    ▼
verify_x402_payment():
  → POST facilitator.pieverse.io/v2/verify { payment, paymentRequirements }
  → Pieverse validates signature + authorization on-chain
  → Returns { isValid: true }
    │
    ▼
Agent executes (LangGraph + Hedera attestation + AFC reward)
    │
    ▼
settle_x402_payment():
  → POST facilitator.pieverse.io/v2/settle { payment, paymentRequirements }
  → Pieverse triggers on-chain USDT transfer on KiteAI (chain 2368)
  → Returns { txHash, success }
    │
    ▼
Response returned with X-PAYMENT-RESPONSE header (base64 settlement receipt)
```

#### x402 Cross-Agent Flow (fully working with real HTS transfers)

```
portfolio_analyzer executes query
    │
    ▼
CrossAgentService.execute_with_cross_agent() runs:
  1. Reads portfolio_analyzer AFC balance from Hedera Mirror Node
  2. For each peer agent in CROSS_AGENT_RECOMMENDATIONS:
       risk_scorer (price: X AFC), yield_optimizer (price: Y AFC)
  3. If balance ≥ price:
       AFCPaymentService.process_inter_agent_payment():
         → Transfer owner_share (70%) to target agent's owner Hedera account (HTS)
         → Transfer agent_share (20%) to target agent Hedera account (HTS, reputation credit)
         → Transfer platform_fee (10%) to operator account (HTS)
       Call target agent via POST /agents/{target}/execute with X-AgentFi-Internal: true
  4. If balance < price:
       Return self-computed fallback with note explaining AFC needed
    │
    ▼
Enhanced result = main result + "### Cross-Agent Insights" section
Result includes cross_agent_report: [{ agent, status, cost, payment_splits, hashscan_url }]
```

#### Payment Provider Architecture (orchestrator)

The composable orchestrator uses a pluggable `BasePaymentProvider` (separate from x402 middleware):

```
BasePaymentProvider (abstract)
  ├── MockPaymentProvider       ← ACTIVE (logs only — orchestrator payment logging)
  └── X402PaymentProvider       ← STUBBED (client-side: for AgentFi paying external agents)
```

The `MockPaymentProvider` is for the orchestrator's per-step billing log — it does not affect the x402 server middleware or the cross-agent AFC payments, both of which are real.

To activate client-side x402 (AgentFi paying external services):
1. Implement `agents/payments/x402_provider.py`
2. Set `KITE_API_KEY` + `KITE_AGENT_PASSPORT_ID` in `.env`
3. Swap `MockPaymentProvider → X402PaymentProvider` in `agents/api.py`
4. No other file needs to change.

---

## Demo Flow (3 minutes — what judges see)

```
Step 1  Connect wallet via RainbowKit (0G Galileo testnet)
Step 2  Browse /marketplace → 3 live on-chain agents with ERC-7857 metadata + AFC reputation tiers
Step 3  Click "Hire Agent" (portfolio_analyzer) → MetaMask confirms transaction on 0G
         → AgentMarketplacev2.hireAgent() fires → 2.5% platform fee splits automatically
         → AgentNFTv2.authorizeUsage() fires → wallet now authorized
Step 4  Enter query: "Analyze a DeFi portfolio with 40% ETH, 30% BTC, 30% stablecoins"
         → POST /agents/portfolio_analyzer/execute
         → LangGraph ReAct agent fetches real CoinGecko prices
         → Hedera attestation submitted to HCS (non-blocking)
         → AFC reward transferred on Hedera (non-blocking)
Step 5  Show result + Hedera proof (HCS sequence number) + AFC reward confirmation
         → Result card shows: cross_agent_report with risk_scorer + yield_optimizer insights
         → x402 payment splits visible: "paid 0.20 AFC → risk_scorer owner (70%), agent (20%), platform (10%)"
         → HashScan links to each HTS transfer transaction
Step 6  Show x402 HTTP 402 response (open DevTools or curl demo):
         curl -X POST http://localhost:8000/agents/portfolio_analyzer/execute -d '{"query":"test"}'
         → Returns 402 with accepts: [AFC/Hedera, USDT/KiteAI]
         → "This is standard x402 protocol — any x402-compatible client can pay and call our agents"
Step 7  Click "Full Orchestration" → POST /orchestrate same query
         → Claude Haiku plans 3 steps: portfolio_analyzer → risk_scorer → yield_optimizer
         → Shows chained output: "Recommend shifting 15% ETH → Bonzo Finance (8.2% APY)"
Step 8  Show /agent/[id] → ADICompliance panel → KYC user count, payment volume, explorer link
         → Demonstrate Mode B: "This wallet is KYC-verified on ADI Chain (UAE, Tier 3)"
Step 9  Show iNFT ownership: navigate to /my-agents → shows owned ERC-7857 token
         → Click "Transfer" demo → new owner gets sealed key, auth generation bumps
```

---

## What Is Fully Working vs Stubbed

### Fully Working (real, end-to-end)

- 0G Chain contract interactions: hire, list, read agent data, ERC-7857 auth, marketplace fee split
- LangGraph ReAct agents with real CoinGecko, DeFi Llama, SaucerSwap, Bonzo Finance data
- Hedera attestation (HCS-10 message submission) — `HEDERA_ENABLED=true`
- AFC token rewards (HTS transfer per execution) — `HEDERA_ENABLED=true`
- Agent reputation display — Hedera Mirror Node, 30s refresh
- ADI compliance service — real web3.py calls to `ADIAgentPayments` on ADI RPC
- Composable orchestrator — Claude Haiku plans, `{step_N}` injection, sequential execution
- x402 server middleware — HTTP 402 with `scheme: "exact"`, `network: "eip155:2368"`, dual payment options
- x402 payment verification — real Pieverse facilitator `/v2/verify` call (on-chain EIP-3009 validation)
- x402 payment settlement — real Pieverse facilitator `/v2/settle` call + `X-PAYMENT-RESPONSE` header
- x402 cross-agent payments — real HTS transfers with 70/20/10 owner/agent/platform split
- `CrossAgentService` — reads AFC balance from Mirror Node, routes to peer agents, falls back gracefully
- ERC-4337 Paymaster deployed and callable on ADI Chain

### Stubbed / Mocked

| Component | Status | Impact | Activation path |
|-----------|--------|--------|-----------------|
| `MockPaymentProvider` (orchestrator) | Active — logs billing per step, no real tx | Low — separate from x402 | See payment provider architecture above |
| `X402PaymentProvider` (client) | Raises `NotImplementedError` | None — only needed for AgentFi paying *external* agents | Implement + set KITE_API_KEY |
| `MockADIComplianceService` | Fallback if `ADI_PAYMENTS_ADDRESS` unset | None — already activated via env | Set env var |
| `MockAFCPaymentService` | Fallback if `HEDERA_ENABLED=false` | None — Hedera is enabled | Set `HEDERA_ENABLED=true` |
| `MockHedera` (HTS + HCS) | Fallback if `HEDERA_ENABLED=false` | None — Hedera is enabled | Set `HEDERA_ENABLED=true` |
| API data fallbacks | CoinGecko, DeFi Llama, SaucerSwap, Bonzo have hardcoded fallback data | Low — only triggers on API timeout | Already handled gracefully |
| 3 "coming soon" marketplace cards | Static mock | Low | Mint + list new agents |

---

## MVP Success Criteria (Definition of Done)

- [x] `AgentNFTv2.sol` deployed on 0G Galileo — ERC-7857 mint, transfer, clone, authorize working
- [x] `AgentMarketplacev2.sol` deployed on 0G Galileo — list, hire, 2.5% fee split working
- [x] `AgentRegistry.sol` deployed on 0G Galileo — Hedera account + x402 config on-chain
- [x] `ADIAgentPayments.sol` deployed on ADI Testnet — KYC, Travel Rule, payments working
- [x] `AgentFiPaymaster.sol` deployed on ADI Testnet — ERC-4337 Paymaster live
- [x] 3 AI agents running with real market data (CoinGecko, DeFi Llama, SaucerSwap, Bonzo Finance)
- [x] Composable orchestrator routing and chaining agents with `{step_N}` injection
- [x] Hedera attestation per execution — HCS-10 messages submitted to agent topics
- [x] AFC token rewards per execution — HTS transfers from operator to agent accounts
- [x] Agent reputation dashboard reading Hedera Mirror Node in real time
- [x] ADI compliance panel — KYC status + payment stats from on-chain
- [x] Mode B compliant execution endpoint — KYC gate + execution receipt on ADI Chain
- [x] Wallet connect → hire → authorize → execute → result (Mode A end-to-end)
- [ ] 3-minute demo video recorded on YouTube
- [ ] Pitch deck PDF submitted (team intro + summary + roadmap + demo link)
- [ ] KiteAI Agent Passport registered (KITE_API_KEY in env)
- [x] x402 Pieverse verify + settle integrated (real on-chain validation via facilitator.pieverse.io)
- [ ] x402 USDT payment demo recorded (curl 402 → pay → retry with X-PAYMENT → settle)
- [ ] All 8 bounty submissions filed before Feb 21 deadline

---

## Submission Narrative Per Bounty

### ADI Open Project ($19,000) + ERC-4337 Paymaster ($3,000) + Payments Component ($3,000)

**Headline:** "Compliant Cross-Border Payment Infrastructure for Autonomous AI Agents"

**Open Project ($19k):**
- `ADIAgentPayments.sol`: KYC whitelist (3 tiers), FATF Travel Rule metadata recorded on-chain for every payment, $ADI as the settlement currency
- Cross-chain proof: every ADI payment links to a Hedera HCS execution receipt — on-chain evidence that the agent delivered the service
- Frame: AI agents as financial service providers reaching the unbanked — operating compliantly in MENA / Asia / Africa
- "We built the infrastructure for AI agents to transact compliantly across borders — ADI Chain is the compliance settlement layer of the agent economy"

**ERC-4337 Paymaster ($3k):**
- `AgentFiPaymaster.sol`: gates gas sponsorship on `kycVerified()` — KYC-verified wallets pay zero gas, removing friction for regulated agent users
- Daily gas budget per wallet prevents abuse; `depositToEntryPoint()` / `withdrawFromEntryPoint()` for operator management
- Frame: "Gasless UX for compliant agent interactions — ADI's ERC-4337 support makes compliance transparent to end users"

**Payments Component ($3k):**
- `ADICompliance.tsx` + `/agents/{id}/execute-compliant` endpoint = drop-in compliance payment component
- Any AI service can reuse: show KYC panel → user pays in $ADI → service verifies on-chain → records cross-chain receipt
- Frame: "A reusable Mode B pattern: KYC gate → $ADI payment → Hedera execution receipt — plug it into any AI service in 2 files"

### Hedera Killer App ($10,000)

**Headline:** "AgentFi — The Marketplace for the Agentic Society"

- 3 agents registered on Hedera testnet with dedicated accounts, HCS inbound/outbound topics, natural language interface
- Every execution: SHA256 attestation to HCS + 1.00 AFC HTS reward — agents earn autonomously
- AFC reputation system: agents build on-chain reputation via HTS balance — visible in the marketplace
- Cross-agent commerce: agents call each other, funded by AFC balance — autonomous agent-to-agent economy
- LangGraph + Hedera Agent Kit: 10 Hedera tools + 7 custom DeFi tools in a ReAct agent loop
- **MANDATORY: Demo video + pitch deck PDF required for submission**

### 0G Best DeFAI ($7,000)

**Headline:** "Three AI Agents Chaining Together for Multi-Step DeFi Intelligence on 0G"

- Real financial data: CoinGecko prices, DeFi Llama yields, SaucerSwap pools, Bonzo Finance markets — no mock data
- Composable orchestrator: Claude Haiku plans execution, chains portfolio_analyzer → risk_scorer → yield_optimizer with output injection
- Deterministic risk scoring (not LLM-guessed): volatility + concentration + stablecoin exposure + 24h drawdown
- Each agent registered on 0G as an ERC-7857 iNFT with `pricePerCall` and `capabilities`
- "AI is making real DeFi decisions — not displaying data, but producing specific APY targets and rebalance recommendations"

### 0G Best iNFT ($7,000)

**Headline:** "Transfer an iNFT = Transfer a Live AI Agent"

- `AgentNFTv2.sol` implements full ERC-7857: `modelHash` (IPFS CID), `encryptedURI` (system prompt), `sealedKey`, `capabilities`, `pricePerCall`
- Transfer semantics: `transfer()` bumps auth generation → instantly invalidates all prior `authorizeUsage()` grants — new owner gets exclusive control
- `clone()` — creates a derivative agent owned by a new address, sealedKey re-sealed
- Marketplace revenue: every `hireAgent()` → 97.5% to NFT owner / 2.5% platform — iNFT holders earn passively
- "The iNFT IS the agent — intelligence, earnings, and execution rights transfer with ownership"

### KiteAI Agent-Native Payments ($10,000)

**Headline:** "AgentFi — x402-Native DeFAI Agents, Payable by Any Agent in the World"

- `KiteAgentFiService.sol` registered on KiteAI Testnet (chain 2368) — 3 agent services with USDT pricing
- x402 server: every agent endpoint returns HTTP 402 with `scheme: "exact"`, `network: "eip155:2368"`, USDT pricing — standard-compliant, callable by any x402 client
- Real payment verification via Pieverse facilitator (`/v2/verify`) + settlement (`/v2/settle`) — on-chain USDT transfer, not trusted headers
- `X-PAYMENT-RESPONSE` header returned with base64 settlement receipt — full x402 spec compliance
- Agent identity via Kite Agent Passport — agents discoverable on KiteAI Application Marketplace
- `CrossAgentService`: agent-to-agent payment with `X-AgentFi-Internal: true` bypass — agents fund peer calls autonomously via AFC/HTS
- Frame: "Our agents are now revenue streams. Any AI agent in the world can discover, pay for, and consume AgentFi's DeFi intelligence — no human required, no KYC needed, just x402."
- Reference: [x402 spec](https://docs.x402.org/introduction) | [KiteAI Service Provider Guide](https://docs.gokite.ai/kite-agent-passport/service-provider-guide)

### ETHDenver FUTURLLAMA ($2,000)

**Headline:** "The Banking System for Autonomous AI Agents — Multi-Chain Agent Economy"

- Five-chain architecture: 0G (ERC-7857 iNFT), ADI (compliant payments + ERC-4337), Hedera (HCS-10 + HTS), KiteAI (x402 micropayments), multi-chain orchestration
- Autonomous agent-to-agent commerce: agents call peers, funded by on-chain AFC balance, with x402 for external access
- Composable orchestrator as a DeFi reasoning engine — the primitive for agent coordination at scale
- "We built the economic layer the agent economy needs to operate in the real world"

---

## Out of Scope (Hackathon)

- Mainnet deployments of any kind
- Real KYC verification (compliance officer is the deployer wallet — admin-controlled demo)
- `X402PaymentProvider` client-side implementation (AgentFi paying *external* x402 services — not in demo path)
- Mobile-responsive UI (desktop demo only)
- Agent memory persistence between sessions
- 0G Compute integration for decentralized AI inference
- Canton Network / Daml
- QuickNode Streams / Uniswap API integration
- wagmi CLI / typechain code generation

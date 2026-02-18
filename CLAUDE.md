# AgentFi — AI Context File
# ETHDenver 2026 Hackathon | Feb 18–21 | $48,000 target

## Project Overview
AgentFi is a multi-chain marketplace for autonomous AI agents.
Each agent is an iNFT (ERC-7857) on 0G Chain.
Payments are settled on ADI Chain with compliance rails.
Agent execution is orchestrated via Hedera Agent Kit.

## One-Line Pitch
"The banking system for autonomous AI agents."

## Monorepo Structure
```
agentfi/
├── contracts/     → Foundry — Person A owns this
├── frontend/      → Next.js 14 — Person B owns this
├── agents/        → Python FastAPI — Person B owns this
└── CLAUDE.md      → this file
```

## Package Manager
- Always use **pnpm** — never npm or yarn
- `pnpm-workspace.yaml` manages `frontend/` as a workspace

## Environment Variables
- Copy `.env.example` to `.env` before starting
- **NEVER commit `.env` or any private key**
- Use `cast wallet import` for Foundry key management

## Critical Chain Info
| Chain     | Role                     | Chain ID | RPC                             |
|-----------|--------------------------|----------|---------------------------------|
| 0G Chain  | iNFT + DeFAI contracts   | 16600    | https://evmrpc-testnet.0g.ai   |
| ADI Chain | Payments + compliance    | TBD      | See ADI docs                    |
| Hedera    | Agent orchestration      | testnet  | portal.hedera.com               |

## ABI Sync Rule — CRITICAL
1. Person A deploys → exports ABIs to `contracts/out/`
2. Person A copies them to `frontend/src/abi/`
3. Person A commits: `chore: export ABIs after deploy`
4. Person B pulls and uses the updated ABIs
- **Never edit ABI files manually**
- **Never use wagmi with a stale ABI**

## Naming Conventions
| Layer      | Convention  | Example                        |
|------------|-------------|--------------------------------|
| Solidity   | PascalCase  | `AgentNFT`, `AgentMarketplace` |
| TypeScript | camelCase   | `agentNft.ts`, `useHireAgent`  |
| Python     | snake_case  | `portfolio_analyzer.py`        |
| Git branch | kebab-case  | `feature/contracts-agent-nft`  |

## No-Go List (do not implement)
- Canton Network / Daml
- Kite AI / x402 protocol
- Mainnet deploys of any kind
- Real KYC / identity verification

## Demo Priority Rule
The **happy path demo > code perfection**.
If a feature risks breaking the demo, mock it.
Always keep a working fallback for each chain interaction.

## Bounty Target Summary
| Bounty                      | Prize    | Chain     |
|-----------------------------|----------|-----------|
| ADI Open Project            | $19,000  | ADI Chain |
| Hedera Killer App (OpenClaw)| $10,000  | Hedera    |
| 0G Best DeFAI               | $7,000   | 0G Chain  |
| 0G Best iNFT (ERC-7857)     | $7,000   | 0G Chain  |
| ETHDenver FUTURLLAMA        | $2,000   | Multi     |
| **TOTAL**                   |**$45,000**|          |

## Payment Provider Architecture
The orchestrator supports pluggable payment providers via BasePaymentProvider.
Currently active: MockPaymentProvider (logs only, no real transactions).

To activate x402 (Kite AI) when ready:
1. Implement agents/payments/x402_provider.py
2. Install the Kite SDK
3. Set KITE_API_KEY + KITE_AGENT_PASSPORT_ID in .env
4. Swap MockPaymentProvider → X402PaymentProvider in agents/api.py
5. No other file needs to change.

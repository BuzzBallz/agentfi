# AgentFi — Frontend + Agents Context (Person B — Product Dev)

## Your Role
You own everything in `frontend/` and `agents/`.
You drive the demo — judges see your work first.
Coordinate with Person A for ABI updates before using wagmi hooks.

## Tech Stack — Frontend
- **Next.js 14** (App Router, TypeScript strict)
- **TailwindCSS** + **shadcn/ui** components
- **wagmi v2** + **viem** for web3 interactions
- **RainbowKit** for wallet connect UI
- **pnpm** as package manager

## Tech Stack — Agents
- **Python 3.11+**
- **FastAPI** for the API server (port 8000)
- **Hedera Agent Kit v3**
- **OpenAI API** (`gpt-4o-mini` by default)
- **uvicorn** as ASGI server

## Frontend File Structure
```
frontend/src/
├── app/
│   ├── page.tsx                → Homepage / hero
│   ├── marketplace/page.tsx    → Agent listing grid
│   ├── agent/[id]/page.tsx     → Agent detail + hire flow
│   ├── my-agents/page.tsx      → Owned iNFTs viewer
│   └── dashboard/page.tsx      → DeFAI portfolio view
├── components/
│   ├── AgentCard.tsx
│   ├── HireButton.tsx
│   └── WalletConnect.tsx
├── hooks/
│   ├── useHireAgent.ts         → wagmi write hook
│   ├── useAgentData.ts         → wagmi read hook
│   └── useListedAgents.ts      → wagmi read hook
├── config/
│   └── chains.ts               → chain + wagmi config (single source of truth)
└── abi/                        → copied from contracts/out/ by Person A
    ├── AgentNFT.json
    ├── AgentMarketplace.json
    └── AgentPayment.json
```

## API Endpoints (FastAPI — localhost:8000)
```
GET  /health                    → { status: "ok" }
GET  /agents                    → list all agents with metadata
POST /agents/{id}/execute       → run agent, returns { result: string }
POST /payment/confirm           → called after on-chain payment confirmed
```

## Agents File Structure
```
agents/
├── agents/
│   ├── base_agent.py           → abstract base class
│   ├── portfolio_analyzer.py   → analyzes DeFi portfolio
│   ├── yield_optimizer.py      → recommends best yields
│   └── risk_scorer.py          → scores token risk
├── api.py                      → FastAPI app
├── requirements.txt
└── .env                        → OPENAI_API_KEY, HEDERA_ACCOUNT_ID, etc.
```

## Agent Base Interface
Every agent in `agents/agents/` must implement:
```python
class BaseAgent:
    name: str
    description: str
    price_per_call: float  # in HBAR

    async def execute(self, query: str) -> str:
        """Run the agent and return a string result."""
        ...
```

## wagmi Config Rules
- Define ALL chains in `frontend/src/config/chains.ts` — never hardcode RPC URLs elsewhere
- Use `useReadContract` for reads (not deprecated `useContractRead`)
- Use `useWriteContract` + `useWaitForTransactionReceipt` for writes
- Always handle three states in every async UI block:
  ```tsx
  if (isLoading) return <Skeleton />
  if (isError) return <ErrorMessage message={error.message} />
  return <YourComponent data={data} />
  ```

## ABI Usage Rules
- ABIs live in `frontend/src/abi/*.json` — copied from `contracts/out/` by Person A
- Import: `import AgentNFT from "@/abi/AgentNFT.json"`
- **Never edit ABI files manually**
- If ABI is missing or stale → ask Person A to deploy + export

## OpenAI Usage Rules
- Default model: `gpt-4o-mini` (speed + cost for hackathon)
- Always set `max_tokens=500`
- Always wrap in try/except:
  ```python
  try:
      response = await openai_client.chat.completions.create(...)
  except Exception as e:
      return f"Agent error: {str(e)}"
  ```

## TypeScript Rules
- **No `any` types** — use `unknown` + type guard if needed
- **No `ts-ignore`** without a comment explaining why
- `"use client"` only when using hooks, events, or browser APIs
- All environment variables typed in `env.d.ts`

## Python Rules
- Type hints on **all** function signatures
- All API endpoints return:
  ```python
  { "success": bool, "data": Any, "error": str | None }
  ```
- Log every agent execution:
  ```
  [2026-02-19 14:32:01] [portfolio_analyzer] INPUT: "analyze my portfolio" DURATION: 1243ms
  ```
- Use `python-dotenv` — never hardcode API keys

## Demo Flow Priority (build in this order, stop when time runs out)
```
MUST HAVE:
  1. Wallet connect + chain switching
  2. Marketplace page with 3 agents (mock data OK)
  3. Hire flow + payment confirmation UI
  4. Agent execution + result displayed in UI

NICE TO HAVE:
  5. My Agents / iNFT viewer page
  6. DeFAI dashboard with chart
```

## UI Rules
- Use **shadcn/ui** components — no custom CSS when shadcn covers it
- **TailwindCSS only** — no inline styles, no styled-components
- Desktop-first — don't waste time on mobile for hackathon
- Error states: always user-friendly message, never raw JS errors in UI
- Loading states: skeleton or spinner for every async operation

## Sync Instructions — From Dev A (18 Fév soir)

### What changed on `main`
- `contracts/src/` → 3 contracts finalized and deployed:
  - `AgentNFT.sol` — ERC-7857 iNFT (0G Chain)
  - `AgentMarketplace.sol` — listing + hiring (0G Chain)
  - `AgentPayment.sol` — compliance payments (ADI Chain)
- `frontend/src/abi/` → 3 ABI JSON files synced (AgentNFT, AgentMarketplace, AgentPayment)
- `deployments.json` → live addresses on 0G (chainId 16600) + ADI (chainId 99999)
- `contracts/script/Seed.s.sol` → 3 agents minted and listed on 0G marketplace

### Deployed Addresses
| Chain | Contract | Address |
|-------|----------|---------|
| 0G Testnet (16600) | AgentNFT | `0x10e3399025e930da7b4d4be71181157ccee4e882` |
| 0G Testnet (16600) | AgentMarketplace | `0x1a9e3f39cf83e53ca34933f81b409a92ad004246` |
| ADI Testnet (99999) | AgentPayment | `0x10e3399025e930da7b4d4be71181157ccee4e882` |

### Seeded Agents on 0G Marketplace
| TokenId | Agent | Price/Hire |
|---------|-------|------------|
| 0 | Portfolio Analyzer | 0.001 ETH |
| 1 | Yield Optimizer | 0.001 ETH |
| 2 | Risk Scorer | 0.0005 ETH |

⚠️ **TokenIds are 0-based** (0, 1, 2) — not 1-based.

### Files you must NEVER edit
- `contracts/` — owned by Dev A
- `frontend/src/abi/` — auto-generated by sync-abis.sh
- `deployments.json` — updated by Dev A after each deploy

### How to use the ABIs in wagmi hooks
```typescript
// Import ABI
import AgentNFTAbi from "@/abi/AgentNFT.json";
import AgentMarketplaceAbi from "@/abi/AgentMarketplace.json";

// Import addresses from deployments.json via config
import { CONTRACT_ADDRESSES } from "@/config/contracts";

// Example: read agent data
const { data } = useReadContract({
  address: CONTRACT_ADDRESSES.AgentNFT,
  abi: AgentNFTAbi,
  functionName: "getAgentData",
  args: [BigInt(tokenId)],
  chainId: 16600,
});

// Example: hire agent (payable)
const { writeContract } = useWriteContract();
writeContract({
  address: CONTRACT_ADDRESSES.AgentMarketplace,
  abi: AgentMarketplaceAbi,
  functionName: "hireAgent",
  args: [BigInt(tokenId)],
  value: parseEther("0.001"),
  chainId: 16600,
});
```

### Key contract interfaces for your hooks
**AgentNFT — read functions:**
- `getAgentData(uint256 tokenId)` → returns `(string modelHash, string systemPrompt, string capabilities, uint256 pricePerCall)`
- `ownerOf(uint256 tokenId)` → returns `address`
- `tokenURI(uint256 tokenId)` → returns `string`

**AgentMarketplace — read functions:**
- `getListedAgents()` → returns array of `(uint256 tokenId, address owner, uint256 pricePerHire, bool active)`
- `getListing(uint256 tokenId)` → returns single listing struct

**AgentMarketplace — write functions:**
- `hireAgent(uint256 tokenId)` — payable, send `value >= pricePerHire`

**AgentPayment (ADI Chain) — write functions:**
- `pay(address recipient, uint256 agentTokenId)` — payable, both sender and recipient must be whitelisted

### If contracts get redeployed
Dev A will merge into main and send you a message. You then:
1. `git checkout main && git pull origin main`
2. `git checkout your-branch && git rebase main`
3. New ABIs and addresses are automatically picked up
```
# Hedera Demo — Manual Test Steps

> Covers the full Hedera demo flow ($10k: Killer App for the Agentic Society / OpenClaw)
> Reference: `docs/demo-specs.md` — Demo 2

---

## Prerequisites

### Services Running

```bash
# Terminal 1 — Backend
cd agents && python -m uvicorn api:app --reload --port 8000

# Terminal 2 — Frontend
cd frontend && pnpm dev
```

### Pre-flight Checks

```bash
# 1. Backend health + Hedera status
curl http://localhost:8000/health
# Expected: {"status":"ok"}

# 2. Hedera integration enabled
curl http://localhost:8000/hedera/status
# Expected: { "success": true, "data": { "enabled": true, "network": "testnet", ... } }

# 3. All agents registered on Hedera
curl http://localhost:8000/hedera/accounts
# Expected: { "success": true, "data": { "0": "0.0.7997780", "1": "0.0.7997785", "2": "0.0.7997786", ... } }
# Note: Dynamic agents (10, 11, 12, ...) will also appear, mapped to operator account 0.0.7973940

# 4. AFC token balance check (operator treasury)
curl "https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.7973940/tokens" | python -m json.tool
# Expected: token_id "0.0.7977623" with balance 100000 (= 1000.00 AFC)

# 5. Agent 0 (Portfolio Analyzer) AFC balance
curl "https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.7997780/tokens" | python -m json.tool
# Expected: token_id "0.0.7977623" with balance >= 1000 (= 10.00 AFC initial funding)
# These accounts are controlled by the operator's key — AFC transfers work!

# 6. 0G RPC alive (marketplace still on 0G)
cast client --rpc-url https://evmrpc-testnet.0g.ai
```

**Expected:** Backend running with Hedera enabled, 3 agents registered with accounts + topics, AFC token funded in agent accounts + operator treasury, Mirror Node reachable.

### Wallets

| Wallet | Role | Requirement |
|--------|------|-------------|
| Wallet B | Agent consumer/hirer | Needs OG for gas + hire price (~0.01 OG) |

> The Hedera demo only needs one wallet (consumer perspective). No agent creation step — focus is on inter-agent commerce.

### Hedera Infrastructure

| Resource | ID | HashScan Link |
|----------|----|---------------|
| Operator Account | `0.0.7973940` | [hashscan.io/testnet/account/0.0.7973940](https://hashscan.io/testnet/account/0.0.7973940) |
| AFC Token | `0.0.7977623` | [hashscan.io/testnet/token/0.0.7977623](https://hashscan.io/testnet/token/0.0.7977623) |

### Agent Hedera Accounts

| Agent | Token ID | Hedera Account (AFC) | Inbound Topic | Outbound Topic |
|-------|----------|----------------------|---------------|----------------|
| Portfolio Analyzer | 0 | `0.0.7997780` | `0.0.7977803` | `0.0.7977802` |
| Yield Optimizer | 1 | `0.0.7997785` | `0.0.7977813` | `0.0.7977812` |
| Risk Scorer | 2 | `0.0.7997786` | `0.0.7977822` | `0.0.7977821` |

### Contract Addresses (0G Galileo — Chain 16602)

| Contract | Address |
|----------|---------|
| AgentNFTv2 | `0xDCD2e9B068913fcF0C80ff5DA070B243Df091EFE` |
| AgentMarketplacev2 | `0x0eC3981a544C3dC6983C523860E13c2B7a66cd6e` |

---

## Step 1 — Mode Selection & Wallet Connect

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1.1 | Open `http://localhost:3000` | Mode selector full-screen | |
| 1.2 | Click **Permissionless** | Sidebar shows green dot + "PERMISSIONLESS" + "0G Galileo" | |
| 1.3 | Click "Connect Wallet" in sidebar | RainbowKit modal opens | |
| 1.4 | Connect wallet via MetaMask | Wallet address appears, connected to 0G Galileo (chain 16602) | |

> Hedera demo uses Permissionless mode. On-chain payments happen on 0G; Hedera handles attestation + AFC.

---

## Step 2 — Marketplace & Agent Selection

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 2.1 | Navigate to `/marketplace` | 3+ agents displayed: Portfolio Analyzer, Yield Optimizer, Risk Scorer | |
| 2.2 | Verify agent cards show SVG images | Each agent has a rendered SVG | |
| 2.3 | Click **Portfolio Analyzer** (token 0) | `/agent/0` page loads | |
| 2.4 | Agent Reputation section visible | Shows AFC balance + reputation tier (e.g. "Active" if > 5 executions) | |
| 2.5 | HashScan link clickable | Opens `https://hashscan.io/testnet/account/0.0.7997780` | |

### Demo Talking Point

> *"These agents have different specialties. They can hire each other via x402, paying in AFC tokens on Hedera. Each agent has its own Hedera account with HCS-10 inbound/outbound topics."*

---

## Step 3 — Single Agent Execution (Without Cross-Agent)

Do a simple hire first to show the basic Hedera attestation + AFC reward flow.

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 3.1 | Ensure cross-agent toggle is **OFF** | Checkbox unchecked | |
| 3.2 | Type query: "Analyze a portfolio with 60% ETH, 30% USDC, 10% HBAR" | Textarea accepts input | |
| 3.3 | Click "Hire & Execute" | MetaMask popup: `hireAgent(0)` with value | |
| 3.4 | Confirm tx in MetaMask | "Confirming on-chain..." then "Agent thinking..." | |
| 3.5 | Agent response loads | Markdown analysis with portfolio breakdown | |
| 3.6 | Scroll to **HEDERA PROOFS** section | Green section appears below response | |
| 3.7 | HCS Attestation link visible | Clickable link: `https://hashscan.io/testnet/transaction/...` | |
| 3.8 | AFC Reward visible | "AFC Reward: 1.00 -> 0.0.7997780" with HashScan link | |
| 3.9 | Click HCS attestation link | Opens HashScan showing HCS message submission | |
| 3.10 | Click AFC HashScan link | Opens HashScan showing agent's account page | |

### What Happens Under the Hood

1. User pays OG on 0G Chain via `hireAgent()` contract call
2. Backend verifies on-chain authorization (`isAuthorized()`)
3. Agent executes query with LangChain ReAct + live DeFi data
4. **HCS Attestation:** Result hash submitted to agent's inbound topic (`0.0.7977803`)
5. **AFC Reward:** 1.00 AFC transferred from operator (`0.0.7973940`) to agent (`0.0.7997780`) via HTS
6. Both proofs returned to frontend

### Verify on HashScan

```bash
# Check agent's AFC balance increased
curl "https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.7997780/tokens" | python -m json.tool
# Look for token_id "0.0.7977623" — balance should have increased by 100 (= 1.00 AFC)

# Check HCS messages on agent's inbound topic
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.7977803/messages?order=desc&limit=1" | python -m json.tool
# Should show recent message with HCS-10 format payload
```

---

## Step 4 — Cross-Agent Collaboration (The Demo Centerpiece)

This is the key demo moment: agents autonomously hiring and paying each other.

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 4.1 | Click "Ask another question" to reset | Form resets to idle | |
| 4.2 | **Enable "Cross-agent collaboration (x402)" toggle** | Checkbox turns purple | |
| 4.3 | Type query: "Analyze my portfolio: 40% ETH, 40% USDC, 20% HBAR — recommend yield strategies and score the risk" | Query that triggers multi-agent collaboration | |
| 4.4 | Click "Hire & Execute", confirm tx | MetaMask -> confirming -> executing (~10-15s) | |
| 4.5 | Agent response loads | Comprehensive analysis from **all 3 agents** | |
| 4.6 | Scroll to **x402 CROSS-AGENT COLLABORATION** section | Purple section below response | |
| 4.7 | Cross-agent payments visible | Risk Scorer: paid 0.50 AFC, Yield Optimizer: paid 1.50 AFC (or similar) | |
| 4.8 | Payment split shown | "Payment split: 70% owner / 20% agent reputation / 10% platform" | |
| 4.9 | Scroll to **HEDERA PROOFS** section | Green section: HCS attestation + AFC reward | |
| 4.10 | HCS attestation link clickable | Opens HashScan | |
| 4.11 | AFC reward visible | "AFC Reward: 1.00 -> Portfolio Analyzer" | |

### Demo Talking Points

> *"This query needs portfolio analysis, yield optimization, AND risk scoring. One agent can't do it all — so it hires the others."*

> *"While we wait: the Portfolio Analyzer is calling the Risk Scorer and Yield Optimizer via x402. Each costs AFC — paid autonomously on Hedera, with a 70/20/10 split: owner, reputation, platform."*

> *"Three agents collaborated autonomously. No human decided which agents to call — the orchestrator discovered, paid, and integrated their responses."*

### Cross-Agent Payment Split (70/20/10)

When Portfolio Analyzer calls Risk Scorer (cost: 0.50 AFC):
- **70% (0.35 AFC) -> Owner** of Risk Scorer (reward for creating the agent)
- **20% (0.10 AFC) -> Risk Scorer** account (reputation/execution bonus)
- **10% (0.05 AFC) -> Platform** operator (`0.0.7973940`)

### Verify Cross-Agent Activity on HashScan

Open these tabs before/during the demo:

```
# AFC Token — shows token metadata and holder list
https://hashscan.io/testnet/token/0.0.7977623

# Portfolio Analyzer — agent account (HCS transactions visible)
https://hashscan.io/testnet/account/0.0.7997780

# Risk Scorer — agent account
https://hashscan.io/testnet/account/0.0.7997786

# Yield Optimizer — agent account
https://hashscan.io/testnet/account/0.0.7997785

# Operator — holds AFC treasury, HCS topic submissions visible
https://hashscan.io/testnet/account/0.0.7973940
```

> Agent accounts now hold real AFC tokens. Balance changes are visible on HashScan after each execution.

---

## Step 5 — Verify Agent Reputation in UI

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 5.1 | On `/agent/0`, check Agent Reputation card | Shows AFC balance and reputation tier | |
| 5.2 | AFC balance reflects executions | Balance should be >= 10.00 AFC (initial funding) + 1 AFC per execution | |
| 5.3 | Reputation tier correct | Based on execution count: New (0+), Active (5+), Proven (20+), Expert (50+), Legend (100+) | |
| 5.4 | HashScan link clickable | Opens agent's Hedera account page with real AFC balance | |
| 5.5 | Navigate to `/agent/1` (Yield Optimizer) | Different AFC balance reflecting its executions | |
| 5.6 | Navigate to `/agent/2` (Risk Scorer) | Different AFC balance — may be higher due to cross-agent calls | |

### Reputation Tiers

| Tier | Executions | What it means |
|------|------------|---------------|
| New | 0+ | Recently deployed |
| Active | 5+ | Getting traction |
| Proven | 20+ | Reliable performer |
| Expert | 50+ | Highly trusted |
| Legend | 100+ | Top-tier agent |

---

## Step 6 — Backend Verification (Hedera Status)

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 6.1 | Check Hedera status endpoint | Full Hedera infrastructure info | |
| 6.2 | Check agent registration | All 3 agents with accounts + topics | |
| 6.3 | Check AFC balances | Tracked balances for dynamic agents | |

```bash
# 1. Full Hedera status
curl http://localhost:8000/hedera/status | python -m json.tool
# Expected:
# {
#   "success": true,
#   "data": {
#     "enabled": true,
#     "network": "testnet",
#     "token_id": "0.0.7977623",
#     "operator": "0.0.7973940",
#     "agents": {
#       "portfolio_analyzer": { "account": "0.0.7997780", "inbound": "0.0.7977803", ... },
#       "yield_optimizer": { "account": "0.0.7997785", "inbound": "0.0.7977813", ... },
#       "risk_scorer": { "account": "0.0.7997786", "inbound": "0.0.7977822", ... }
#     }
#   }
# }

# 2. Token map (shows all registered agents)
curl http://localhost:8000/agents/token-map | python -m json.tool
# Expected: { "0": "portfolio_analyzer", "1": "yield_optimizer", "2": "risk_scorer" }

# 3. Hedera accounts mapping
curl http://localhost:8000/hedera/accounts | python -m json.tool
# Expected: { "0": "0.0.7997780", "1": "0.0.7997785", "2": "0.0.7997786" }

# 4. AFC tracked balances (dynamic agents)
curl http://localhost:8000/hedera/afc-balances | python -m json.tool
# Expected: { "success": true, "data": { ... } }
```

---

## Step 7 — Mirror Node Verification (Hedera Testnet)

These commands verify real on-chain state on Hedera. Use for judge Q&A.

```bash
# 1. Check AFC token exists and metadata
curl "https://testnet.mirrornode.hedera.com/api/v1/tokens/0.0.7977623" | python -m json.tool
# Expected: name="AgentFi Credits", symbol="AFC", decimals=2, initial_supply=100000

# 2. All AFC token holders and balances
curl "https://testnet.mirrornode.hedera.com/api/v1/tokens/0.0.7977623/balances" | python -m json.tool
# Expected: operator 0.0.7973940 + 3 agent accounts each holding AFC
# Agent balances increase by 100 (1.00 AFC) with each execution

# 3. Recent HCS messages on Portfolio Analyzer's inbound topic (THE KEY PROOF)
curl "https://testnet.mirrornode.hedera.com/api/v1/topics/0.0.7977803/messages?order=desc&limit=3" | python -m json.tool
# Expected: recent messages with base64-encoded HCS-10 payloads
# This is the real, immutable, on-chain proof that the agent executed

# 4. Decode an HCS message (copy the "message" field from above)
echo "<base64_message_field>" | base64 -d
# Expected: JSON with { "p": "hcs-10", "op": "message", "data": "execution_proof|agent=portfolio_analyzer|hash=..." }

# 5. Portfolio Analyzer AFC balance
curl "https://testnet.mirrornode.hedera.com/api/v1/accounts/0.0.7997780/tokens" | python -m json.tool
# Expected: token_id "0.0.7977623" with balance >= 1000 (= 10.00 AFC)
# balance / 100 = AFC display value. Increases by 1.00 with each execution.
```

---

## Step 8 — Show Agent Economy on HashScan (Judge Proof)

Pre-open these HashScan tabs for the demo. Show them when judges ask about real on-chain activity.

| Tab | URL | What it proves |
|-----|-----|----------------|
| AFC Token | `https://hashscan.io/testnet/token/0.0.7977623` | Token exists with holders + balances |
| Inbound Topic 0 | `https://hashscan.io/testnet/topic/0.0.7977803` | HCS-10 execution attestation messages |
| Portfolio Analyzer | `https://hashscan.io/testnet/account/0.0.7997780` | Agent account with real AFC balance + HTS transfers |
| Yield Optimizer | `https://hashscan.io/testnet/account/0.0.7997785` | Different agent, different AFC balance |
| Risk Scorer | `https://hashscan.io/testnet/account/0.0.7997786` | Terminal agent — receives cross-agent payments |
| Operator | `https://hashscan.io/testnet/account/0.0.7973940` | AFC treasury + platform fee collection |

### What to Point Out on HashScan

1. **Token Holders tab** on AFC Token page — shows all 3 agent accounts + operator holding AFC
2. **Recent Transactions** on any agent account — shows HTS transfers (AFC payments in/out)
3. **HCS Messages** — click on inbound topic to see attestation messages
4. **Balance changes** — after cross-agent execution, Portfolio Analyzer's balance decreases, others increase

---

## Key Proof Points for Hedera Judges

| Proof Point | Where to show it | What you say |
|-------------|-----------------|--------------|
| HCS-10 attestation | HEDERA PROOFS section + HashScan topic | "Every execution attested on HCS. Immutable proof. Click to verify on HashScan." |
| AFC token on HTS | HashScan token page + agent accounts | "Real token, real balances. Watch them change live after each execution." |
| Agents autonomously collaborating | x402 CROSS-AGENT section in UI | "Agent decided which specialists to call, not a human. Autonomous commerce." |
| Per-agent Hedera identity | HashScan account pages | "Each agent has its own Hedera account with HCS-10 inbound/outbound topics." |
| 70/20/10 payment split | Payment split note in UI | "AFC economy incentivizes quality. Owners earn 70%, agents earn reputation." |
| 3 agents with HCS topics | `/hedera/status` endpoint | "Each agent has inbound/outbound HCS topics — full HCS-10 compliance." |

---

## Known Issues & Edge Cases

### Known Limitations

| Issue | Root Cause | Impact | Demo Mitigation |
|-------|-----------|--------|-----------------|
| AFC balance tracking for dynamic agents (3+) | Dynamic agents share operator account; self-transfer is no-op on HTS | Virtual tracking only — not on-chain | Virtual tracking in `dynamic_registry.py` + `/hedera/afc-balances` endpoint |
| Old HCS-10 accounts still exist | Original accounts from `register-agents.js` had no AFC association | No impact — new accounts with operator key are used for AFC | Topics still reference old accounts but topic IDs are unchanged |

### Fixed Bugs

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| AFC balance stuck at 1000 for dynamic agents | Frontend fetched operator's Mirror Node balance | Added `/hedera/afc-balances` endpoint + frontend fetches from backend for tokenId >= 3 |
| HCS attestation fails silently | Topic ID missing from env | Non-blocking — execution still succeeds, proof shows null |
| Cross-agent payments fail | Agent lacks sufficient AFC | Graceful fallback — report shows "insufficient_funds" with amounts |

### Edge Cases to Watch

| Case | What to check |
|------|---------------|
| Hedera testnet down | Backend falls back to MockHCSMessaging — UI still works, proofs show "mock-xxx" |
| Mirror Node slow | HCS messages may take ~5-10s to appear after submission |
| Cross-agent with empty AFC | Report shows "insufficient_funds" — agent still returns its own analysis |
| Backend restart | Dynamic agents reloaded from `dynamic_agents.json` — AFC balances preserved |

---

## Resetting Between Demos

```bash
# Delete dynamic agent state (if created custom agents)
rm -f agents/dynamic_agents.json

# Restart backend
cd agents && python -m uvicorn api:app --reload --port 8000
```

> On-chain state (Hedera accounts, AFC balances, HCS messages) cannot be reset. This is fine — it shows real accumulated activity to judges.

---

## Quick Smoke Test (3 minutes)

For a fast pre-demo check, run these steps only:

1. Backend health: `curl http://localhost:8000/health` returns OK
2. Hedera enabled: `curl http://localhost:8000/hedera/status` shows `"enabled": true`
3. Open site -> Permissionless -> connect wallet -> go to `/agent/0`
4. Verify Agent Reputation section shows AFC balance (Step 5.1)
5. Hire Portfolio Analyzer WITHOUT cross-agent -> verify HEDERA PROOFS appear (Step 3.6-3.8)
6. Click HashScan link -> verify it opens a real page (Step 3.9)
7. Hire Portfolio Analyzer WITH cross-agent -> verify x402 section appears with AFC costs (Step 4.6-4.8)

If all 7 pass, the Hedera demo is ready.

---

## Demo Script (Talking Points Timeline)

| Time | What you do | What you say |
|------|------------|--------------|
| 0:00 | Open AgentFi, select Permissionless, connect wallet | "AgentFi is a marketplace of AI agents. Each is an iNFT. But the magic is what happens between agents — on Hedera." |
| 0:30 | Navigate to `/marketplace` | "These agents have different specialties. They can hire each other via x402, paying in AFC tokens on Hedera." |
| 0:50 | Click Portfolio Analyzer, point to reputation | "Notice the AFC balance — this agent has earned reputation through executions." |
| 1:10 | **Enable cross-agent toggle** | "When enabled, this agent can autonomously hire other agents and pay them in AFC." |
| 1:20 | Type multi-agent query | "This query needs portfolio analysis, yield optimization, AND risk scoring. One agent can't do it all — so it hires the others." |
| 1:40 | Hire & Execute, confirm tx | "While we wait: the Portfolio Analyzer is calling the Risk Scorer and Yield Optimizer via x402. Each costs AFC — paid autonomously on Hedera, with a 70/20/10 split." |
| 2:30 | Result appears | "Three agents collaborated autonomously." |
| 2:50 | **Scroll to x402 section** | "Proof: Portfolio Analyzer paid AFC to Risk Scorer and Yield Optimizer. All on Hedera." |
| 3:20 | **Scroll to HEDERA PROOFS** | "Every execution attested on HCS. Let's verify." |
| 3:40 | **Click HashScan link** | "Immutable proof on Hedera: this agent executed at this time with this result hash." |
| 4:10 | **Open HashScan for AFC token** (pre-loaded tab) | "Each agent has an AFC balance on Hedera. Portfolio Analyzer decreased, others increased. Autonomous commerce." |
| 4:40 | Show `/hedera/status` endpoint | "All 3 agents registered on Hedera with HCS-10 inbound/outbound topics." |
| 5:10 | Point to payment split | "AFC economy incentivizes quality: agents hired more earn more reputation. Owners get 70% of inter-agent payments." |
| 5:30 | Wrap-up | "AgentFi: a society of autonomous agents that discover, hire, and pay each other on Hedera. HCS-attested, AFC-powered. The agentic economy." |

### Fallback Plan

- **Hedera down** -> MockAFCPaymentService still runs flow, show report as "simulated"
- **Pre-screenshot** HashScan pages as backup slides
- **Mirror Node slow** -> narrate while waiting, show pre-loaded tabs

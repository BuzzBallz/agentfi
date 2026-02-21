# KiteAI Demo — Manual Test Steps

> Covers the full KiteAI demo flow ($10k: Agent-Native Payments & Identity on Kite AI / x402-Powered)
> Reference: `docs/demo-specs.md` — Demo 3

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
# 1. Backend health
curl http://localhost:8000/health
# Expected: {"status":"ok"}

# 2. KiteAI RPC alive
cast client --rpc-url https://rpc-testnet.gokite.ai/
# Expected: returns version

# 3. KiteAgentFiService deployed
cast call 0x10E3399025E930da7B4d4bE71181157CCee4E882 \
  "owner()(address)" \
  --rpc-url https://rpc-testnet.gokite.ai/
# Expected: deployer address

# 4. USDT token exists on KiteAI
cast call 0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63 \
  "decimals()(uint8)" \
  --rpc-url https://rpc-testnet.gokite.ai/
# Expected: 6

# 5. x402 discovery endpoint
curl http://localhost:8000/agents/portfolio_analyzer/x402
# Expected: JSON with pricing (AFC + USDT), payment methods, scheme info

# 6. 0G RPC alive (marketplace still on 0G)
cast client --rpc-url https://evmrpc-testnet.0g.ai

# 7. Agents seeded on marketplace
cast call 0x0eC3981a544C3dC6983C523860E13c2B7a66cd6e \
  "getListedAgents()((uint256,address,uint256,bool)[])" \
  --rpc-url https://evmrpc-testnet.0g.ai
```

**Expected:** Backend running, KiteAI RPC responding, contract deployed, USDT token accessible, x402 discovery returns pricing, 0G marketplace seeded.

### Wallets

| Wallet | Role | Requirement |
|--------|------|-------------|
| Wallet B | Agent consumer/hirer | Needs OG for gas + hire price (~0.01 OG) on 0G for UI demo |

> The KiteAI demo uses **terminal + UI side-by-side**. Terminal shows raw x402 protocol; UI shows the same flow abstracted for end users.

### Contract Addresses

| Chain | Contract | Address |
|-------|----------|---------|
| KiteAI (2368) | KiteAgentFiService | `0x10E3399025E930da7B4d4bE71181157CCee4E882` |
| KiteAI (2368) | USDT Token | `0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63` |
| 0G (16602) | AgentNFTv2 | `0xDCD2e9B068913fcF0C80ff5DA070B243Df091EFE` |
| 0G (16602) | AgentMarketplacev2 | `0x0eC3981a544C3dC6983C523860E13c2B7a66cd6e` |

### x402 Infrastructure

| Resource | Value |
|----------|-------|
| Pieverse Facilitator | `https://facilitator.pieverse.io` |
| Verify Endpoint | `https://facilitator.pieverse.io/v2/verify` |
| Settle Endpoint | `https://facilitator.pieverse.io/v2/settle` |
| KiteAI Explorer | `https://testnet.kitescan.ai` |

### Agent x402 Pricing

| Agent | Token ID | AFC Price | USDT Price |
|-------|----------|-----------|------------|
| Portfolio Analyzer | 0 | 1.00 AFC | 0.01 USDT |
| Yield Optimizer | 1 | 1.50 AFC | 0.015 USDT |
| Risk Scorer | 2 | 0.50 AFC | 0.005 USDT |

### Payment Split (Cross-Agent AFC)

| Recipient | Share | Example (0.50 AFC call) |
|-----------|-------|------------------------|
| Owner of called agent | 70% | 0.35 AFC |
| Called agent (reputation) | 20% | 0.10 AFC |
| Platform operator | 10% | 0.05 AFC |

---

## Step 1 — Terminal: Request Without Payment (402 Response)

This is the demo centerpiece. Open a terminal **side by side** with the browser.

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1.1 | Run curl without payment header (see command below) | HTTP **402 Payment Required** response | |
| 1.2 | Response contains `accepts` array | Two payment methods: Hedera HTS (AFC) + EIP-155 (USDT) | |
| 1.3 | USDT method shows `eip155:2368` | KiteAI chain, USDT address, amount in base units | |
| 1.4 | AFC method shows `hedera-testnet` | Hedera network, AFC token ID, amount in base units | |
| 1.5 | `payTo` address present | AgentFi treasury/operator address | |

### Command

```bash
curl -s -w "\nHTTP_STATUS: %{http_code}\n" \
  -X POST http://localhost:8000/agents/portfolio_analyzer/execute \
  -H "Content-Type: application/json" \
  -d '{"query":"analyze ETH"}'
```

### Expected 402 Response Structure

```json
{
  "x402_version": 1,
  "accepts": [
    {
      "scheme": "exact",
      "network": "eip155:2368",
      "asset": "0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63",
      "maxAmountRequired": "10000",
      "resource": "agents/portfolio_analyzer/execute",
      "description": "Pay 0.01 USDT on KiteAI to execute Portfolio Analyzer",
      "payTo": "0x..."
    },
    {
      "scheme": "hedera-hts",
      "network": "hedera-testnet",
      "asset": "0.0.7977623",
      "maxAmountRequired": "100",
      "resource": "agents/portfolio_analyzer/execute",
      "description": "Pay 1.00 AFC on Hedera to execute Portfolio Analyzer",
      "payTo": "0.0.7973940"
    }
  ]
}
```

### Demo Talking Points

> *"No payment, 402. The response tells the client exactly how to pay. Two options: USDT on KiteAI chain 2368, or AFC on Hedera. Standard x402. Any compatible client -- another AI agent, a script, a wallet -- can parse this and pay."*

---

## Step 2 — Terminal: x402 Discovery Endpoint

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 2.1 | Hit x402 discovery for Portfolio Analyzer | Full pricing + payment methods JSON | |
| 2.2 | Hit x402 discovery for Yield Optimizer | Different pricing (1.50 AFC / 0.015 USDT) | |
| 2.3 | Hit x402 discovery for Risk Scorer | Cheapest pricing (0.50 AFC / 0.005 USDT) | |

### Commands

```bash
# Portfolio Analyzer pricing
curl -s http://localhost:8000/agents/portfolio_analyzer/x402 | python -m json.tool

# Yield Optimizer pricing
curl -s http://localhost:8000/agents/yield_optimizer/x402 | python -m json.tool

# Risk Scorer pricing
curl -s http://localhost:8000/agents/risk_scorer/x402 | python -m json.tool
```

### Demo Talking Point

> *"Every agent exposes x402 pricing. External agents discover and pay programmatically. No account needed, no API key -- just HTTP."*

---

## Step 3 — Terminal: Request With Payment Header (200 OK)

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 3.1 | Run curl with `X-PAYMENT` header (see command below) | HTTP **200 OK** with agent result | |
| 3.2 | Response body contains agent analysis | Markdown DeFi analysis | |
| 3.3 | Response headers contain `X-PAYMENT-RESPONSE` | Settlement confirmation from Pieverse | |
| 3.4 | Settlement shows `success: true` | Payment verified and settled on KiteAI | |

### Command

```bash
# Set payment header (base64-encoded EIP-3009 authorization)
# For demo: use pre-generated payment header from env or script
export X402_PAYMENT_HEADER="<base64_payment_data>"

curl -s -D - \
  -X POST http://localhost:8000/agents/portfolio_analyzer/execute \
  -H "Content-Type: application/json" \
  -H "X-PAYMENT: $X402_PAYMENT_HEADER" \
  -d '{"query":"analyze a portfolio with 50% ETH, 30% USDC, 20% LINK"}'
```

### Expected Response

```
HTTP/1.1 200 OK
X-PAYMENT-RESPONSE: {"success":true,"settlement_tx":"0x...","network":"eip155:2368"}

{
  "success": true,
  "result": "## Portfolio Analysis\n...",
  "hedera_proof": { ... },
  "afc_reward": { ... }
}
```

### Verify Settlement on KiteScan

```bash
# Open KiteScan for the settlement tx (pre-load this tab)
# https://testnet.kitescan.ai/tx/<settlement_tx_hash>
```

### Demo Talking Point

> *"x402 payment header sent. Backend verifies via Pieverse facilitator, executes, settles. One HTTP round-trip. Verify -> execute -> settle."*

---

## Step 4 — Verify on KiteScan

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 4.1 | Open KiteScan for USDT payment tx (pre-loaded tab) | KiteScan shows payment transaction | |
| 4.2 | TX shows USDT transfer | 0.01 USDT transferred to AgentFi payTo address | |
| 4.3 | Recipient address matches payTo | Same address from 402 response | |

### Pre-load Tab

```
https://testnet.kitescan.ai
```

### Demo Talking Point

> *"Verifiable on KiteScan. 0.01 USDT for one agent call. Same standard any payment-aware client can use."*

---

## Step 5 — Switch to Browser: UI Demo

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 5.1 | Open AgentFi in browser, select **Permissionless** | Sidebar shows green dot + "PERMISSIONLESS" + "0G Galileo" | |
| 5.2 | Connect wallet via MetaMask | Connected on 0G Galileo (chain 16602) | |
| 5.3 | Navigate to `/marketplace` | 3+ agents displayed | |
| 5.4 | Click **Portfolio Analyzer** | `/agent/0` page loads | |
| 5.5 | Agent detail shows price in OG | "0.001 OG" (marketplace price, not x402 USDT price) | |
| 5.6 | ERC-7857 badge visible | Purple badge | |

### Demo Talking Point

> *"Same protocol, through our UI. Frontend abstracts x402 for end users. Users can also pay via 0G marketplace -- backend checks on-chain authorization instead of payment header."*

---

## Step 6 — Browser: Show x402 Info on Agent Page

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 6.1 | On `/agent/0`, look for x402 pricing info | Shows AFC + USDT pricing from backend | |
| 6.2 | x402 discovery link or section visible | Agent exposes both payment rails | |

### Demo Talking Point

> *"Users can also pay via 0G marketplace -- backend checks on-chain authorization instead of payment header. But externally, any agent can pay via x402."*

---

## Step 7 — Browser: Cross-Agent Collaboration via x402

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 7.1 | On `/agent/0`, **enable "Cross-agent collaboration (x402)" toggle** | Checkbox turns purple | |
| 7.2 | Type query: "Analyze portfolio 40% ETH, 40% USDC, 20% HBAR and recommend yield strategies" | Multi-agent query | |
| 7.3 | Click "Hire & Execute", confirm tx | MetaMask -> confirming -> executing (~10-15s) | |
| 7.4 | Agent response loads | Comprehensive analysis from multiple agents | |
| 7.5 | Scroll to **x402 CROSS-AGENT COLLABORATION** section | Purple section showing agents called + AFC costs | |
| 7.6 | Cross-agent payments visible | Risk Scorer: paid 0.50 AFC, Yield Optimizer: paid 1.50 AFC | |
| 7.7 | Payment split shown | "70% owner / 20% agent reputation / 10% platform" | |

### Demo Talking Points

> *"Yield Optimizer needs Risk Scorer -- pays via x402 internally with AFC on Hedera. Agent-to-agent commerce."*

> *"Two agents collaborated. x402 handled payment between them -- no human involved."*

---

## Step 8 — Terminal: Show Full x402 Pricing (Wrap-Up)

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 8.1 | Back in terminal, hit x402 discovery | Full pricing JSON with both rails | |
| 8.2 | Point out dual payment rails | AFC on Hedera + USDT on KiteAI | |

### Command

```bash
curl -s http://localhost:8000/agents/portfolio_analyzer/x402 | python -m json.tool
```

### Demo Talking Point

> *"Any AI agent on the internet can discover, check pricing, and pay. x402 infrastructure. Dual rails -- USDT on KiteAI, AFC on Hedera. Discoverable, payable, settleable via HTTP 402."*

---

## Key Proof Points for KiteAI Judges

| Proof Point | Where to show it | What you say |
|-------------|-----------------|--------------|
| Real 402 response with proper `accepts` schema | Terminal Step 1 | "Standard x402. Any client can parse this and pay." |
| Pieverse facilitator verify + settle | Terminal Step 3 (X-PAYMENT-RESPONSE header) | "Verify -> execute -> settle. Pieverse handles USDT settlement on KiteAI chain." |
| USDT on KiteAI chain 2368 | KiteScan Step 4 | "Verifiable on KiteScan. 0.01 USDT for one agent call." |
| Agent identity = iNFT tokenId | Agent detail page Step 5 | "Agent identity is its iNFT tokenId on 0G. Same identity used as x402 resource identifier." |
| Dual payment rails (USDT + AFC) | x402 discovery endpoint Step 2/8 | "Two payment rails: USDT for external clients, AFC for inter-agent commerce on Hedera." |
| Terminal demo = real protocol | Steps 1-3 | "This is the raw protocol. No UI abstraction. Any HTTP client can pay." |
| Cross-agent x402 payments | Browser Step 7 | "Agents pay each other via x402 internally with AFC. Autonomous commerce." |

---

## Known Issues & Edge Cases

### Known Limitations

| Issue | Root Cause | Impact | Demo Mitigation |
|-------|-----------|--------|-----------------|
| X-PAYMENT header requires pre-generated payment | Real EIP-3009 auth requires wallet signature | Can't generate live in curl | Pre-generate payment header before demo; or show 402 response structure + explain |
| Pieverse facilitator may be slow/down | External dependency | Settlement step fails | Show 402 response structure + KiteScan screenshot as fallback |
| x402 provider stub not fully implemented | `agents/agents/payments/x402_provider.py` raises NotImplementedError | Server middleware handles x402 directly, stub unused | No impact on demo -- middleware is the real implementation |

### Fixed Bugs

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Agent data empty (name, desc, price) | Struct parsed with numeric indexes | `useAgentData.ts` — named property access |
| Price shows "0 OG" | Same as above | `useAgentData.ts` |
| Cross-agent insufficient AFC | Agent lacks balance | Graceful fallback -- report shows "insufficient_funds" |

### Edge Cases to Watch

| Case | What to check |
|------|---------------|
| KiteAI RPC down | 402 response still returns (pricing is static config), but KiteScan verification fails |
| Pieverse down | 402 response returns, but settlement fails -- show response structure + diagram |
| Backend restart mid-demo | Dynamic agents reloaded from `dynamic_agents.json` |
| curl hangs on MINGW | Use PowerShell or Python requests instead (see MEMORY.md) |
| No X-PAYMENT header | Always returns 402 -- this is correct behavior, not a bug |

---

## Pre-Demo Preparation

### Tabs to Pre-Open

| Tab | URL | Purpose |
|-----|-----|---------|
| KiteScan | `https://testnet.kitescan.ai` | Verify USDT settlement tx |
| KiteAgentFiService | `https://testnet.kitescan.ai/address/0x10E3399025E930da7B4d4bE71181157CCee4E882` | Show deployed contract |
| USDT Token | `https://testnet.kitescan.ai/address/0x0fF5393387ad2f9f691FD6Fd28e07E3969e27e63` | Show token exists |
| AgentFi UI | `http://localhost:3000` | Browser demo portion |

### Terminal Setup

```bash
# Pre-test the 402 response before demo
curl -s -w "\nHTTP_STATUS: %{http_code}\n" \
  -X POST http://localhost:8000/agents/portfolio_analyzer/execute \
  -H "Content-Type: application/json" \
  -d '{"query":"test"}'
# Must return 402

# Pre-test x402 discovery
curl -s http://localhost:8000/agents/portfolio_analyzer/x402 | python -m json.tool
# Must return pricing JSON
```

### Demo Script Scripts

Two pre-built demo scripts are available:

```bash
# Script 1 — Simple 3-step flow
scripts/demo/x402-demo.sh

# Script 2 — Detailed 5-step flow with mock EIP-3009 payload
agents/scripts/demo_x402.sh
```

---

## Quick Smoke Test (3 minutes)

For a fast pre-demo check, run these steps only:

1. Backend health: `curl http://localhost:8000/health` returns OK
2. KiteAI RPC: `cast client --rpc-url https://rpc-testnet.gokite.ai/` returns version
3. 402 response: `curl -s -X POST http://localhost:8000/agents/portfolio_analyzer/execute -H "Content-Type: application/json" -d '{"query":"test"}'` returns 402 with `accepts` array
4. x402 discovery: `curl http://localhost:8000/agents/portfolio_analyzer/x402` returns pricing JSON with both AFC and USDT methods
5. Open site -> Permissionless -> connect wallet -> `/agent/0` -> verify agent loads with price
6. Enable cross-agent toggle -> hire -> verify x402 CROSS-AGENT section appears with AFC costs
7. KiteScan loads: `https://testnet.kitescan.ai` accessible

If all 7 pass, the KiteAI demo is ready.

---

## Demo Script (Talking Points Timeline)

| Time | What you do | What you say |
|------|-------------|--------------|
| 0:00 | **Open terminal** (side by side with browser) | "Let me show x402 from the protocol level first, then the UI." |
| 0:20 | Run curl without payment | "No payment, 402. The response tells the client exactly how to pay. Two options: USDT on KiteAI chain 2368, or AFC on Hedera." |
| 0:50 | **Highlight 402 response** -- point to `accepts` array | "Standard x402. Any compatible client -- another AI agent, a script, a wallet -- can parse this and pay." |
| 1:20 | Run curl WITH `X-PAYMENT` header | "x402 payment header sent. Backend verifies via Pieverse facilitator, executes, settles. One HTTP round-trip." |
| 1:50 | **Highlight X-PAYMENT-RESPONSE** header | "Verify -> execute -> settle. Pieverse handles USDT settlement on KiteAI chain." |
| 2:20 | Show KiteScan for USDT tx (pre-loaded tab) | "Verifiable on KiteScan. 0.01 USDT for one agent call." |
| 2:40 | **Switch to browser**. Select Permissionless, connect wallet. | "Same protocol, through our UI. Frontend abstracts x402 for end users." |
| 3:00 | Go to agent detail page | "Users can also pay via 0G marketplace -- backend checks on-chain authorization instead of payment header." |
| 3:20 | Click agent's x402 info | "Every agent exposes x402 pricing. External agents discover and pay programmatically." |
| 3:40 | **Enable cross-agent toggle** + execute | "Yield Optimizer needs Risk Scorer -- pays via x402 internally with AFC on Hedera. Agent-to-agent commerce." |
| 4:20 | Show result with x402 report | "Two agents collaborated. x402 handled payment between them -- no human involved." |
| 4:50 | **Back to terminal**: show x402 discovery | "Any AI agent on the internet can discover, check pricing, and pay. x402 infrastructure." |
| 5:20 | **Wrap-up** | "AgentFi: x402 payment infrastructure for AI agents. Dual rails -- USDT on KiteAI, AFC on Hedera. Discoverable, payable, settleable via HTTP 402." |

### Fallback Plan

- **Pre-record curl session** as replayable script (`scripts/demo/x402-demo.sh`)
- **Pieverse down** -> show 402 response structure + explain with diagram
- **KiteAI RPC slow** -> show KiteScan screenshots from previous run
- **curl hangs on MINGW** -> use PowerShell: `Invoke-RestMethod -Uri ... -Method Post`

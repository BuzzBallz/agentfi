# ADI Demo — Manual Test Steps

> Covers the full ADI Foundation demo flow ($25k: Open Project $19k + ERC-4337 Paymaster $3k + ADI Payments Component $3k)
> Reference: `docs/demo-specs.md` — Demo 4

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

# 2. ADI RPC alive
cast client --rpc-url https://rpc.ab.testnet.adifoundation.ai/
# Expected: returns version

# 3. ADI compliance status
curl http://localhost:8000/adi/status
# Expected: { "success": true, "data": { "enabled": true, ... } }

# 4. ADIAgentPayments contract deployed
cast call 0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd \
  "owner()(address)" \
  --rpc-url https://rpc.ab.testnet.adifoundation.ai/
# Expected: deployer address

# 5. AgentFiPaymaster deployed
cast call 0xBeD159217F43711c32fB6D57e4b203aEbC46B74A \
  "getEntryPointBalance()(uint256)" \
  --rpc-url https://rpc.ab.testnet.adifoundation.ai/
# Expected: non-zero balance (gas sponsorship pool)

# 6. Compliance stats
cast call 0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd \
  "getComplianceStats()(uint256,uint256,uint256,uint256)" \
  --rpc-url https://rpc.ab.testnet.adifoundation.ai/
# Expected: (totalKYCUsers, totalPayments, totalVolumeADI, serviceCount)

# 7. 0G RPC alive (for mode switch at end)
cast client --rpc-url https://evmrpc-testnet.0g.ai
```

**Expected:** Backend running with ADI enabled, ADI RPC responding, both contracts deployed, Paymaster funded, compliance stats readable.

### Wallets

| Wallet | Role | Requirement |
|--------|------|-------------|
| Wallet B | Agent consumer (KYC'd) | Needs ADI for gas + hire price (~0.01 ADI) on ADI Testnet |

> The ADI demo only needs one wallet (consumer perspective). Focus is on compliance rails, KYC gate, and Paymaster.

### Contract Addresses (ADI Testnet — Chain 99999)

| Contract | Address | Purpose |
|----------|---------|---------|
| ADIAgentPayments | `0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd` | FATF-compliant payments + KYC registry |
| AgentFiPaymaster | `0xBeD159217F43711c32fB6D57e4b203aEbC46B74A` | ERC-4337 gas sponsorship for KYC users |
| EntryPoint (v0.7) | `0x0000000071727De22E5E9d8BAf0edAc6f37da032` | ERC-4337 standard EntryPoint |

### Contract Addresses (0G Galileo — Chain 16602)

| Contract | Address |
|----------|---------|
| AgentNFTv2 | `0xDCD2e9B068913fcF0C80ff5DA070B243Df091EFE` |
| AgentMarketplacev2 | `0x0eC3981a544C3dC6983C523860E13c2B7a66cd6e` |

### ADI Explorer

```
https://explorer.ab.testnet.adifoundation.ai/
```

### KYC Data Structure (On-Chain)

| Field | Type | Description |
|-------|------|-------------|
| verified | bool | KYC status |
| jurisdiction | string | ISO 3166-1 alpha-2 (e.g. "AE", "SG", "NG") |
| verifiedAt | uint256 | Timestamp of verification |
| tier | uint256 | 1 = basic, 2 = enhanced, 3 = institutional |
| complianceHash | string | Hash of off-chain KYC docs (privacy preserving) |

### FATF Travel Rule Fields (PaymentRecord)

| Field | Description |
|-------|-------------|
| originator | Payer wallet address |
| originatorJurisdiction | ISO 3166-1 country code |
| originatorKYCTier | KYC verification level |
| beneficiary | AgentFi treasury address |
| beneficiaryName | "AgentFi Protocol" |
| amount | Payment in wei |
| purposeOfPayment | "AI Agent DeFi Analysis Service" |
| agentServiceId | Registered service ID |
| agentName | Agent name string |
| hederaTopicId | Cross-chain proof link |
| executionHash | Result integrity hash |
| status | PENDING -> COMPLETED -> REFUNDED |

---

## Step 1 — Mode Selection (Compliant)

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1.1 | Open `http://localhost:3000` | Mode selector full-screen: "Permissionless" / "Compliant" | |
| 1.2 | Click **Compliant** | Mode switches, accent color changes to indigo (#818CF8) | |
| 1.3 | Sidebar shows | Purple dot + "COMPLIANT" + "ADI Testnet" + "ADI" currency | |
| 1.4 | Navigate to `/marketplace` via sidebar | Marketplace loads. Mode persists | |
| 1.5 | Navigate to `/dashboard`, then back | Mode persists across all pages (localStorage) | |
| 1.6 | Hard-refresh (F5) | Mode still persists | |

### Demo Talking Point

> *"AgentFi supports two modes. Compliant mode connects to ADI Chain. KYC required, FATF Travel Rule payments, gas sponsored."*

---

## Step 2 — Wallet Connect (ADI Testnet)

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 2.1 | Click "Connect Wallet" in sidebar | RainbowKit modal opens | |
| 2.2 | Connect **Wallet B** via MetaMask | Wallet address appears in sidebar | |
| 2.3 | Check MetaMask network | Should show ADI Testnet (chain 99999) | |
| 2.4 | If MetaMask prompts to add network | Auto-adds ADI Testnet with correct RPC + chain ID | |

---

## Step 3 — KYC Gate

This is a key demo moment: compliance-gated access before any agent interaction.

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 3.1 | Navigate to `/marketplace` or `/agent/0` | **KYC gate appears** — blocks content | |
| 3.2 | Banner shows | "Verification Required" with "Complete KYC Verification" button | |
| 3.3 | Content behind gate is not accessible | Cannot browse agents or interact until KYC'd | |
| 3.4 | Click **"Complete KYC Verification"** | Mock verification triggers | |
| 3.5 | Backend call | `POST /adi/kyc/mock-verify` with wallet address | |
| 3.6 | KYC gate disappears | Green checkmark: "KYC Verified" with jurisdiction + tier info | |
| 3.7 | Content now accessible | Marketplace or agent page loads behind the gate | |

### Verify KYC On-Chain (or Mock)

```bash
# Check KYC status via backend
curl http://localhost:8000/adi/kyc/<WALLET_B_ADDRESS>
# Expected: { "success": true, "data": { "wallet": "0x...", "kyc_verified": true, "chain": "ADI Testnet (99999)" } }

# If using real ADI contract (ADI_PAYMENTS_ADDRESS set):
cast call 0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd \
  "kycVerified(address)(bool)" <WALLET_B_ADDRESS> \
  --rpc-url https://rpc.ab.testnet.adifoundation.ai/
# Expected: true
```

### Demo Talking Points

> *"Institutions complete KYC before accessing agents. For demo, mock verification."*

> *"Verified. Contract records: jurisdiction, KYC tier, compliance hash."*

---

## Step 3b — Verify KYC Event on ADI Explorer

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 3b.1 | Open ADI Explorer for the wallet | Shows KYC verification tx (if real contract call) | |
| 3b.2 | Look for `KYCVerified` event | Event shows: user address, jurisdiction, tier, timestamp | |
| 3b.3 | Note the jurisdiction | ISO 3166-1 code (e.g. "AE" for UAE) | |

### ADI Explorer Link

```
https://explorer.ab.testnet.adifoundation.ai/address/<WALLET_B_ADDRESS>
```

### Demo Talking Point

> *"On-chain proof of verification. Auditable by regulators."*

---

## Step 4 — Marketplace in Compliant Mode

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 4.1 | Navigate to `/marketplace` | Grid of agent cards loads | |
| 4.2 | Prices shown in **ADI** (not OG) | "0.001 ADI", "0.0005 ADI", etc. | |
| 4.3 | Same agents as permissionless mode | Portfolio Analyzer, Yield Optimizer, Risk Scorer | |
| 4.4 | ADI Compliance section may appear | Purple "ADI CHAIN COMPLIANCE (MODE B)" section visible | |

### Demo Talking Point

> *"Same marketplace, same agents -- but payments go through ADI compliance rails."*

---

## Step 5 — Agent Detail in Compliant Mode

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 5.1 | Click **Portfolio Analyzer** | `/agent/0` page loads | |
| 5.2 | Agent name, description, capabilities show | Same data as permissionless mode | |
| 5.3 | Price shown in **ADI** | "0.001 ADI" (not OG) | |
| 5.4 | **ADI CHAIN COMPLIANCE (MODE B)** section visible | Purple compliance section appears | |
| 5.5 | KYC status shown in compliance section | Green dot: "KYC Verified" for connected wallet | |
| 5.6 | Compliance badges visible | KYC status, jurisdiction, Travel Rule indicator | |
| 5.7 | Hire button shows compliant label | "Hire & Execute (Compliant)" or similar | |

### Demo Talking Point

> *"Compliance mode shows KYC status, jurisdiction, Travel Rule indicator."*

---

## Step 6 — Hire & Execute (Compliant Payment)

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 6.1 | Type query: "Analyze institutional portfolio: 60% BTC, 30% ETH, 10% stablecoins" | Textarea accepts input | |
| 6.2 | Click "Hire & Execute (Compliant)" | MetaMask popup on **ADI Chain** (99999) | |
| 6.3 | **Verify MetaMask shows ADI Testnet** | NOT 0G Galileo — must be ADI chain | |
| 6.4 | MetaMask TX calls `payForAgentService(serviceId)` | TX sends ADI as value | |
| 6.5 | **Check gas cost in MetaMask** | Should be 0 or very low (Paymaster sponsors) | |
| 6.6 | Confirm tx in MetaMask | TX confirming on ADI Chain | |
| 6.7 | TX confirms, agent executes | "Agent thinking..." state | |
| 6.8 | Agent response loads | Same quality DeFi analysis as permissionless mode | |

### Demo Talking Points

> *"Payment goes to ADIAgentPayments. Records full FATF metadata: originator, jurisdiction, KYC tier, purpose, beneficiary."*

> *"Gas sponsored by our ERC-4337 Paymaster. KYC-verified users get free gas -- reducing institutional friction."*

---

## Step 6b — Verify Payment on ADI Explorer

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 6b.1 | Click ADI Explorer link for payment tx | Explorer shows tx on ADI Testnet | |
| 6b.2 | Look for `CompliancePayment` event | Shows: paymentId, originator, jurisdiction, amount, agentServiceId, agentName, timestamp | |
| 6b.3 | Look for `TravelRuleRecord` event | Shows: originator, originatorJurisdiction, beneficiary, beneficiaryName, amount, purposeOfPayment | |
| 6b.4 | Payment status | PENDING (before execution receipt) | |

### Verify via Cast

```bash
# Get the payment ID from the tx receipt (CompliancePayment event)
# Then read the full PaymentRecord:
cast call 0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd \
  "getPaymentRecord(uint256)(address,string,uint256,address,string,uint256,uint256,uint256,string,string,string,string,uint8)" \
  <PAYMENT_ID> \
  --rpc-url https://rpc.ab.testnet.adifoundation.ai/

# Expected fields:
# originator: Wallet B address
# originatorJurisdiction: "AE" (or whatever jurisdiction was set)
# originatorKYCTier: 2
# beneficiary: AgentFi treasury
# beneficiaryName: "AgentFi Protocol"
# amount: payment in wei
# purposeOfPayment: "AI Agent DeFi Analysis Service"
# status: 0 (PENDING)
```

### Demo Talking Point

> *"Full FATF Travel Rule compliance on-chain. Originator, jurisdiction, purpose of payment. Any auditor can verify."*

---

## Step 7 — Compliance Section in Response

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 7.1 | Scroll below agent response | **"COMPLIANCE -- Mode B"** section appears | |
| 7.2 | KYC verified indicator | Green checkmark with jurisdiction | |
| 7.3 | ADI payment receipt tx | Clickable link to ADI Explorer | |
| 7.4 | Travel Rule recorded | Indicator showing FATF compliance | |
| 7.5 | Hedera proof link | Links to HCS attestation on HashScan | |
| 7.6 | Execution hash present | Hash proving result integrity | |

### Demo Talking Points

> *"Backend wrote execution receipt back to ADI -- linking payment to Hedera attestation and execution hash. Complete audit trail."*

---

## Step 7b — Verify Execution Receipt on ADI Explorer

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 7b.1 | Click ADI Explorer link for execution receipt | Explorer shows `ExecutionReceipt` event | |
| 7b.2 | Payment status updated | PENDING -> **COMPLETED** | |
| 7b.3 | `executionHash` present | Non-empty hash of the agent result | |
| 7b.4 | `hederaTopicId` present | Links to HCS attestation topic | |

### Verify via Cast

```bash
# Re-read the PaymentRecord — status should now be COMPLETED
cast call 0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd \
  "getPaymentRecord(uint256)(address,string,uint256,address,string,uint256,uint256,uint256,string,string,string,string,uint8)" \
  <PAYMENT_ID> \
  --rpc-url https://rpc.ab.testnet.adifoundation.ai/
# status should now be 1 (COMPLETED)
# executionHash should be non-empty
# hederaTopicId should be non-empty
```

### Demo Talking Point

> *"PENDING -> COMPLETED. Execution hash and Hedera topic on-chain. Any auditor can verify."*

---

## Step 8 — Compliance Dashboard

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 8.1 | ADI Compliance section on agent page or marketplace | Shows compliance stats | |
| 8.2 | KYC USERS count | Non-zero (at least 1 — Wallet B) | |
| 8.3 | PAYMENTS count | Non-zero (at least 1 — the hire just done) | |
| 8.4 | VOLUME in ADI | Non-zero (hire amount) | |
| 8.5 | SERVICES count | 3 (registered agent services) | |
| 8.6 | Explorer link clickable | Opens ADI Explorer for the contract | |

### Verify via Backend

```bash
# Compliance stats
curl http://localhost:8000/adi/status | python -m json.tool
# Expected:
# {
#   "success": true,
#   "data": {
#     "enabled": true,
#     "total_kyc_users": 1+,
#     "total_payments": 1+,
#     "total_volume_adi": "0.001+",
#     "service_count": 3,
#     "contract": "0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd",
#     "paymaster": "0xBeD159217F43711c32fB6D57e4b203aEbC46B74A",
#     "explorer_url": "https://explorer.ab.testnet.adifoundation.ai/address/0x56FEa..."
#   }
# }
```

### Demo Talking Point

> *"Compliance dashboard for institutional oversight. All on ADI Chain."*

---

## Step 9 — ERC-4337 Paymaster Verification

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 9.1 | Check Paymaster balance | Non-zero (gas sponsorship pool funded) | |
| 9.2 | Check gas cost from Step 6 tx | Gas was 0 or very low in MetaMask | |
| 9.3 | `GasSponsored` event on ADI Explorer | Shows user address, gas cost, timestamp | |

### Verify Paymaster State

```bash
# Paymaster EntryPoint balance
cast call 0xBeD159217F43711c32fB6D57e4b203aEbC46B74A \
  "getEntryPointBalance()(uint256)" \
  --rpc-url https://rpc.ab.testnet.adifoundation.ai/
# Expected: non-zero balance in wei

# Paymaster max daily gas per user
cast call 0xBeD159217F43711c32fB6D57e4b203aEbC46B74A \
  "maxDailyGasPerUser()(uint256)" \
  --rpc-url https://rpc.ab.testnet.adifoundation.ai/
# Expected: daily gas budget in wei
```

### Demo Talking Point

> *"Gas sponsored by our ERC-4337 Paymaster. KYC-verified users get free gas -- reducing institutional friction."*

---

## Step 10 — Quick Mode Switch (Dual-Mode Demo)

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 10.1 | Click "Switch Mode" in sidebar | Mode selector reappears | |
| 10.2 | Select **Permissionless** | Accent changes to gold (#C9A84C), sidebar shows "PERMISSIONLESS" + "0G Galileo" | |
| 10.3 | Navigate to `/marketplace` | Same agents, prices now in **OG** | |
| 10.4 | KYC gate does NOT appear | Permissionless mode skips KYC | |
| 10.5 | ADI Compliance section NOT visible | Only appears in compliant mode | |
| 10.6 | Switch back to **Compliant** | Everything restores: ADI prices, KYC status, compliance section | |

### Demo Talking Point

> *"For DeFi community -- same agents, permissionless on 0G. No KYC, pay in OG. Two modes, one platform."*

---

## Key Proof Points for ADI Judges

### Open Project ($19k)

| Proof Point | Where to show it | What you say |
|-------------|-----------------|--------------|
| Full AI agent marketplace on ADI | Marketplace in compliant mode | "Complete marketplace with compliance on ADI Chain." |
| Dual-mode architecture | Mode toggle Step 1 + Step 10 | "Two modes, one platform. Institutional compliance + DeFi permissionless." |
| KYC-gated access | KYC Gate Step 3 | "KYC verification before any agent interaction." |
| Real contract deployment | ADI Explorer | "ADIAgentPayments + Paymaster deployed on ADI Testnet." |

### ERC-4337 Paymaster ($3k)

| Proof Point | Where to show it | What you say |
|-------------|-----------------|--------------|
| Gas = 0 in MetaMask | Step 6.5 | "Gas sponsored by our ERC-4337 Paymaster. KYC users get free gas." |
| Paymaster validates KYC | Contract code | "Paymaster calls kycVerified() -- only sponsors verified users." |
| Daily gas budget tracking | Cast command Step 9 | "Per-user daily gas budget prevents abuse." |
| EntryPoint v0.7 | Contract address | "Standard ERC-4337 EntryPoint v0.7 integration." |

### Payments Component ($3k)

| Proof Point | Where to show it | What you say |
|-------------|-----------------|--------------|
| FATF Travel Rule metadata | ADI Explorer Step 6b | "Every payment records originator, jurisdiction, purpose. Full FATF compliance." |
| PaymentRecord on-chain | Cast command Step 6b | "Originator, beneficiary, amount, purpose -- all on-chain." |
| Receipt linking | Step 7b | "PENDING -> COMPLETED. Links ADI payment to Hedera proof to execution hash." |
| Compliance dashboard | Step 8 | "Institutional oversight: KYC users, payments, volume, services." |

---

## Known Issues & Edge Cases

### Known Limitations

| Issue | Root Cause | Impact | Demo Mitigation |
|-------|-----------|--------|-----------------|
| Mock KYC (no real identity verification) | Hackathon scope — no real IDV provider | KYC is in-memory or mock contract call | Explicitly say "For demo, mock verification" — judges understand |
| Paymaster gas sponsorship may not be visible in MetaMask | ERC-4337 gas abstraction depends on bundler setup | Gas may still show in MetaMask if not using AA bundler | Narrate "gas sponsored" — show Paymaster contract balance as proof |
| ADI RPC may be slow/unreliable | Testnet infrastructure | TX confirmation delays | MockADIComplianceService fallback (shows "Mock" badge, flow identical) |
| Receipt write-back requires deployer key | `recordExecutionReceipt` is `onlyOwner` | Backend needs `DEPLOYER_PRIVATE_KEY` to write receipts | If key not set, receipt step is skipped; show payment record without receipt |

### Fixed Bugs

| Bug | Root Cause | Fix |
|-----|-----------|-----|
| Mode selector reappears on navigation | `useState(null)` no persistence | `AppModeContext.tsx` — localStorage persistence |
| ADI Compliance shown in permissionless mode | `<ADICompliance />` not guarded by mode check | `agent/[id]/page.tsx` — `{isCompliant && ...}` |
| Agent data empty in compliant mode | Struct parsing bug (shared with 0G) | `useAgentData.ts` — named property access |

### Edge Cases to Watch

| Case | What to check |
|------|---------------|
| ADI RPC down | Backend falls back to MockADIComplianceService — UI shows "Mock" badge |
| Wallet not on ADI chain | MetaMask prompts network switch to ADI 99999 |
| KYC not completed | KYC gate blocks all agent interactions — cannot bypass |
| Paymaster empty | Gas sponsorship fails — user pays gas normally |
| Switch mode after KYC | KYC status is per-mode; permissionless mode doesn't check KYC |
| Backend restart | Mock KYC state is in-memory — need to re-verify after restart |

---

## Pre-Demo Preparation

### Tabs to Pre-Open

| Tab | URL | Purpose |
|-----|-----|---------|
| ADI Explorer | `https://explorer.ab.testnet.adifoundation.ai/` | Verify KYC + payment events |
| ADIAgentPayments | `https://explorer.ab.testnet.adifoundation.ai/address/0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd` | Show deployed contract |
| AgentFiPaymaster | `https://explorer.ab.testnet.adifoundation.ai/address/0xBeD159217F43711c32fB6D57e4b203aEbC46B74A` | Show Paymaster contract |
| AgentFi UI | `http://localhost:3000` | Main demo |

### Environment Check

```bash
# Verify ADI env vars are set
echo $ADI_PAYMENTS_ADDRESS   # Should be 0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd
echo $ADI_PAYMASTER_ADDRESS  # Should be 0xBeD159217F43711c32fB6D57e4b203aEbC46B74A
echo $ADI_RPC_URL            # Should be https://rpc.ab.testnet.adifoundation.ai/

# If ADI_PAYMENTS_ADDRESS is not set, backend uses MockADIComplianceService
# This is fine for demo — just note "Mock" badge will appear
```

---

## Quick Smoke Test (3 minutes)

For a fast pre-demo check, run these steps only:

1. Backend health: `curl http://localhost:8000/health` returns OK
2. ADI status: `curl http://localhost:8000/adi/status` shows `"enabled": true`
3. ADI RPC: `cast client --rpc-url https://rpc.ab.testnet.adifoundation.ai/` returns version
4. Open site -> select **Compliant** -> verify mode persists on navigation (Step 1.1-1.6)
5. Connect wallet -> verify KYC gate appears -> complete mock KYC (Step 3.1-3.7)
6. Go to `/agent/0` -> verify ADI Compliance section visible + prices in ADI (Step 5.1-5.7)
7. Hire & Execute -> verify MetaMask on ADI chain -> verify compliance section in response (Step 6-7)

If all 7 pass, the ADI demo is ready.

---

## Resetting Between Demos

```bash
# Delete dynamic agent state
rm -f agents/dynamic_agents.json

# Restart backend (clears mock KYC state)
cd agents && python -m uvicorn api:app --reload --port 8000
```

> **Note:** On-chain state (KYC records, payment records, receipts) cannot be reset. This is fine — it shows real accumulated compliance activity to judges.

> **Note:** Mock KYC state is in-memory — restarting the backend clears it. Wallet will need to re-verify KYC after restart.

---

## Demo Script (Talking Points Timeline)

| Time | What you do | What you say |
|------|-------------|--------------|
| 0:00 | Open AgentFi -- **NOT connected yet** | "AgentFi supports two modes. Let me show compliant mode -- built for institutions on ADI Chain." |
| 0:20 | **Select "Compliant" mode** | "Compliant mode connects to ADI Chain. KYC required, FATF Travel Rule payments, gas sponsored." |
| 0:40 | **Connect wallet** on ADI Testnet | "We're on ADI Testnet. Let's verify KYC." |
| 1:00 | **KYC gate appears** | "Institutions complete KYC before accessing agents. For demo, mock verification." |
| 1:15 | Click "Complete KYC" -> instant verification | "Verified. Contract records: jurisdiction, KYC tier, compliance hash." |
| 1:30 | **Show ADI Explorer** -- KYCVerified event | "On-chain proof of verification. Auditable by regulators." |
| 1:50 | Navigate to `/marketplace` | "Same marketplace, same agents -- but payments go through ADI compliance rails." |
| 2:10 | Click Portfolio Analyzer | "Compliance mode shows KYC status, jurisdiction, Travel Rule indicator." |
| 2:30 | Type institutional portfolio query | -- |
| 2:40 | Click "Hire & Execute (Compliant)" | "Payment goes to ADIAgentPayments. Records full FATF metadata: originator, jurisdiction, KYC tier, purpose, beneficiary." |
| 3:10 | **Point out: gas was sponsored** | "Gas sponsored by our ERC-4337 Paymaster. KYC-verified users get free gas -- reducing institutional friction." |
| 3:30 | Show ADI Explorer for payment tx | "Full FATF Travel Rule compliance on-chain. Originator, jurisdiction, purpose of payment." |
| 4:00 | Agent executes -> result | "Same intelligence, same quality -- institutional-grade rails." |
| 4:20 | **Scroll to compliance section** | "Backend wrote execution receipt back to ADI -- linking payment to Hedera attestation and execution hash. Complete audit trail." |
| 4:50 | **Click ADI Explorer for receipt** | "PENDING -> COMPLETED. Execution hash and Hedera topic on-chain. Any auditor can verify." |
| 5:20 | **Show compliance dashboard** | "Compliance dashboard for institutional oversight. All on ADI Chain." |
| 5:40 | **Quick switch**: toggle to Permissionless | "For DeFi community -- same agents, permissionless on 0G. No KYC, pay in OG. Two modes, one platform." |
| 6:00 | **Wrap-up -- hit all 3 prizes** | "FATF-compliant payments on ADI. ERC-4337 Paymaster for gas sponsorship. Payment infrastructure for institutions to adopt AI agents. Thank you." |

### Fallback Plan

- **ADI RPC slow** -> MockADIComplianceService (shows "Mock" badge, flow identical)
- **Paymaster fails** -> skip "gas sponsored" claim, payment still works normally
- **Pre-screenshot** ADI Explorer pages as backup slides
- **Receipt write-back fails** -> show PaymentRecord in PENDING state, explain COMPLETED flow

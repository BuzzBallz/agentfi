# AgentFi — Final Implementation Spec

> Everything that must be built for all 4 demos to work.
> Ordered by priority: blockers first, then enhancements.

---

## Overview: What Exists vs What's Missing

| Feature | Exists | Works | Demo-ready |
|---------|--------|-------|------------|
| Marketplace (browse agents) | Yes | Yes | Yes |
| Agent detail + hire flow | Yes | Yes | Yes |
| Agent execution (AI backend) | Yes | Yes | Yes |
| Cross-agent x402 collaboration | Yes | Yes | Yes |
| Hedera HCS attestation | Yes | Yes | Verify env |
| AFC token rewards | Yes | Yes | Verify env |
| Agent creation form | Yes | Partial | onlyOwner blocker |
| Mode selector (permissionless/compliant) | No | -- | **BUILD** |
| ADI compliant payment flow (frontend) | No | -- | **BUILD** |
| ADI compliance response display | No | -- | **BUILD** |
| Real earnings display | No | Mock | Nice-to-have |
| OG token symbol fix | No | Wrong (A0GI) | **FIX** |
| x402 curl demo script | No | -- | **BUILD** |

---

## PRIORITY 1: Mode Selector + Chain-Aware Wallet Connect

**Why:** Every demo starts here. The mode selector determines which chain the wallet connects to.
**Blocks:** ADI demo entirely. Affects all other demos (they select Permissionless).

### 1A. Create AppMode React Context

**New file: `frontend/src/context/AppModeContext.tsx`**

```typescript
"use client";

import { createContext, useContext, useState, useCallback } from "react";

type AppMode = "permissionless" | "compliant";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  chainId: number;           // 16602 for permissionless, 99999 for compliant
  chainName: string;         // "0G Galileo" or "ADI Testnet"
  currencySymbol: string;    // "OG" or "ADI"
  explorerUrl: string;
  isCompliant: boolean;
}

const AppModeContext = createContext<AppModeContextType | null>(null);

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode | null>(null);

  const setMode = useCallback((m: AppMode) => { setModeState(m); }, []);

  const value: AppModeContextType = {
    mode: mode ?? "permissionless",
    setMode,
    chainId: mode === "compliant" ? 99999 : 16602,
    chainName: mode === "compliant" ? "ADI Testnet" : "0G Galileo",
    currencySymbol: mode === "compliant" ? "ADI" : "OG",
    explorerUrl: mode === "compliant"
      ? "https://explorer.ab.testnet.adifoundation.ai"
      : "https://chainscan-galileo.0g.ai",
    isCompliant: mode === "compliant",
  };

  // If mode not yet selected, render the mode selector screen
  if (mode === null) {
    return (
      <AppModeContext.Provider value={{ ...value, mode: "permissionless" }}>
        <ModeSelector onSelect={setMode} />
      </AppModeContext.Provider>
    );
  }

  return (
    <AppModeContext.Provider value={value}>
      {children}
    </AppModeContext.Provider>
  );
}

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within AppModeProvider");
  return ctx;
}
```

The `<ModeSelector>` component is a full-screen overlay with two cards:

```
┌──────────────────────────────────────────────────────┐
│                                                      │
│              Welcome to AgentFi                      │
│    The banking system for autonomous AI agents       │
│                                                      │
│  ┌─────────────────┐    ┌─────────────────┐          │
│  │  Permissionless  │    │    Compliant    │          │
│  │                  │    │                 │          │
│  │  0G Galileo      │    │  ADI Testnet    │          │
│  │  Pay in OG       │    │  Pay in ADI     │          │
│  │  No KYC          │    │  KYC required   │          │
│  │  For everyone    │    │  Institutional  │          │
│  │                  │    │                 │          │
│  │  [ Select ]      │    │  [ Select ]     │          │
│  └─────────────────┘    └─────────────────┘          │
│                                                      │
└──────────────────────────────────────────────────────┘
```

### 1B. Wrap App with AppModeProvider

**Modify: `frontend/src/components/Providers.tsx`**

- Import `AppModeProvider` from `@/context/AppModeContext`
- Wrap children: `<AppModeProvider>` goes OUTSIDE `<WagmiProvider>` so mode is set before wallet connects
- Structure: `AppModeProvider > WagmiProvider > QueryClientProvider > RainbowKitProvider`

### 1C. Dynamic Wagmi Config Based on Mode

**Problem:** The current `wagmiConfig` is static (created at module load). We need the initial chain to match the selected mode.

**Approach:** Create the wagmi config dynamically inside `Providers.tsx` based on the selected mode. Both chains stay in the config (user CAN switch), but the `initialChainId` prop on RainbowKitProvider sets the default.

**Modify: `frontend/src/components/Providers.tsx`**

```typescript
// Pass initialChain to RainbowKitProvider based on mode
<RainbowKitProvider initialChain={mode === "compliant" ? adiTestnet : ogTestnet}>
```

### 1D. Mode Indicator in Sidebar

**Modify: `frontend/src/components/AppSidebar.tsx`**

- Import `useAppMode`
- Show current mode as a badge/indicator at the top of the sidebar
- Show "Switch Mode" link/button that resets mode (clears state, shows selector again)
- In compliant mode: show a compliance badge (e.g., shield icon + "Compliant")

---

## PRIORITY 2: Fix OG Token Symbol

**Why:** Judges will notice "A0GI" doesn't match the official "OG" symbol.

### 2A. Update Chain Config

**Modify: `frontend/src/config/chains.ts` line 9**

```typescript
// Before:
nativeCurrency: { name: "A0GI", symbol: "A0GI", decimals: 18 },
// After:
nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
```

### 2B. Update All Frontend References

Search and replace across frontend:
- `"A0GI"` -> `"OG"` in display strings
- `priceA0GI` variable names can stay (internal, not shown to user)
- Files affected:
  - `frontend/src/app/agent/[id]/page.tsx` (lines showing "A0GI" to user)
  - `frontend/src/app/marketplace/page.tsx` (price display)
  - `frontend/src/app/dashboard/page.tsx` (earnings display)
  - `frontend/src/app/dashboard/create/page.tsx` (price input label)

---

## PRIORITY 3: ADI Compliant Payment Flow (Frontend)

**Why:** Blocks the entire ADI demo ($25k prize).
**Backend is ready.** `/execute-compliant` endpoint exists. We need the frontend to call it.

### 3A. KYC Gate Component

**New file: `frontend/src/components/KYCGate.tsx`**

Shown when `isCompliant === true` and wallet is connected but NOT KYC-verified.

**Behavior:**
1. On mount: call `checkADIKYC(walletAddress)` (already in `api.ts`)
2. If verified: render children (pass-through)
3. If not verified: show KYC required banner with "Complete KYC" button
4. Button calls `mockVerifyKYC(walletAddress)` (already in `api.ts`)
5. On success: show green badge "KYC Verified - UAE, Enhanced Tier" + re-check
6. Store verification state in React state (no need for persistence -- demo only)

**Integration point:** Wrap the agent detail page content in `<KYCGate>` when in compliant mode.

### 3B. ADI Payment Hook

**New file: `frontend/src/hooks/useADIPayment.ts`**

```typescript
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import ADIAgentPaymentsAbi from '@/abi/ADIAgentPayments.json';  // NEW ABI needed

export function useADIPayment() {
  const { writeContract, data: hash, isPending, isError, error } = useWriteContract();
  const { isLoading: isConfirming, isSuccess } = useWaitForTransactionReceipt({ hash });

  const payForAgent = (serviceId: number, priceADI: string) => {
    writeContract({
      address: ADI_AGENT_PAYMENTS_ADDRESS,  // 0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd
      abi: ADIAgentPaymentsAbi,
      functionName: 'payForAgentService',
      args: [BigInt(serviceId)],
      value: parseEther(priceADI),
      chainId: 99999,
    });
  };

  return { payForAgent, hash, isPending, isConfirming, isSuccess, isError, error };
}
```

**Requires:** ABI export for `ADIAgentPayments` contract -> `frontend/src/abi/ADIAgentPayments.json`
Person A must export this ABI, OR we extract the minimal ABI (just `payForAgentService` function).

### 3C. Modify Agent Detail Page for Compliance Mode

**Modify: `frontend/src/app/agent/[id]/page.tsx`**

When `isCompliant === true`:

1. **Price display:** Show price in ADI instead of OG
2. **Hire button:** Label changes to "Hire & Execute (Compliant)"
3. **Payment flow:**
   - Step 1: Call `useADIPayment().payForAgent(serviceId, price)` on ADI Chain
   - Step 2: Extract `paymentId` from tx receipt logs (or use a counter)
   - Step 3: Call `executeAgentCompliant(tokenId, query, walletAddress, paymentId)` instead of `executeAgent()`
4. **Result display:** Show compliance metadata section:
   - KYC Verified badge
   - Jurisdiction + KYC Tier
   - ADI Receipt TX (link to ADI Explorer)
   - "Travel Rule Recorded" indicator
   - Hedera proof link (same as permissionless mode)

### 3D. Get paymentId from Transaction Receipt

**Challenge:** `payForAgentService()` returns `paymentId` but wagmi's `useWriteContract` doesn't directly expose return values. We need to read it from logs.

**Solution:** The `ADIAgentPayments` contract emits `PaymentCreated(uint256 paymentId, ...)` event. Parse the tx receipt logs to extract the paymentId.

```typescript
// After tx confirms, read receipt logs:
const receipt = await publicClient.getTransactionReceipt({ hash });
const paymentId = decodeEventLog({
  abi: ADIAgentPaymentsAbi,
  data: receipt.logs[0].data,
  topics: receipt.logs[0].topics,
}).args.paymentId;
```

### 3E. Update Compliance Service to Use Advanced Contract

**Modify: `agents/adi/compliance_service.py`**

The current service uses the simple `AgentPayment` contract ABI. Switch to `ADIAgentPayments`:
- Update ABI to include `payForAgentService`, `getPaymentRecord` with full Travel Rule fields
- Update contract address to `0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd`
- Keep `record_execution_receipt()` as-is (already calls the right function)

### 3F. ADI Agent Payments ABI

**New file: `frontend/src/abi/ADIAgentPayments.json`**

Minimal ABI containing:
- `payForAgentService(uint256 serviceId) payable returns (uint256 paymentId)`
- `getPaymentRecord(uint256 paymentId) view returns (PaymentRecord)`
- `kycVerified(address) view returns (bool)`
- `PaymentCreated` event (for paymentId extraction)

**Source:** Extract from `contracts-adi/contracts/ADIAgentPayments.sol` compilation output, or write minimal ABI by hand.

### 3G. Pre-Register Agent Services on ADI

**Script needed:** Call `registerAgentService()` on `ADIAgentPayments` for all 3 agents.

```javascript
// scripts/adi/register-services.js
// serviceId 0: Portfolio Analyzer, price 0.001 ADI
// serviceId 1: Yield Optimizer, price 0.001 ADI
// serviceId 2: Risk Scorer, price 0.0005 ADI
```

Person A or a Foundry script handles this.

---

## PRIORITY 4: ADI Compliance UI Polish

### 4A. Compliance Response Card

**New section in agent result display (agent/[id]/page.tsx):**

When execution returns `mode: "compliant"`, show a compliance card:

```
┌─ COMPLIANCE VERIFICATION ─────────────────────┐
│  KYC Verified            ✅                    │
│  Jurisdiction            UAE                   │
│  KYC Tier                Enhanced (2)          │
│  ADI Payment ID          #42                   │
│  ADI Amount              0.001 ADI             │
│  Travel Rule             ✅ Recorded           │
│  ADI Receipt             0xabc...def  [View]   │
│  Hedera Proof            0.0.1234567  [View]   │
│  Execution Hash          0x789...012           │
└────────────────────────────────────────────────┘
```

### 4B. Compliance Badge in Marketplace

**Modify: `frontend/src/app/marketplace/page.tsx`**

When `isCompliant === true`:
- Show "Compliant" badge on each agent card
- Price shows ADI instead of OG
- Small text: "FATF Travel Rule"

### 4C. Compliance Dashboard Stats

**Modify: `frontend/src/components/ADICompliance.tsx`**

This component already exists and shows stats. Enhance it:
- Make it more prominent in compliant mode (full card instead of small section)
- Show link to ADI Explorer for the contract address
- Show recent payment records if available

---

## PRIORITY 5: Agent Creation (Public Mint)

**Why:** 0G demo Step 1 requires Wallet A (non-deployer) to mint.
**Blocker:** `AgentNFTv2.mint()` has `onlyOwner` modifier.
**Owner:** Person A must deploy updated contract.

### 5A. Contract Change (Person A)

**Modify: `contracts/src/AgentNFTv2.sol`**

Add a public mint function (or remove `onlyOwner` from existing mint):

```solidity
function publicMint(
    string memory uri,
    AgentMetadata memory metadata,
    bytes32 metadataHash,
    string memory encryptedURI,
    bytes memory sealedKey
) external returns (uint256 tokenId) {
    tokenId = _nextTokenId++;
    _mint(msg.sender, tokenId);
    _setTokenURI(tokenId, uri);
    _agentData[tokenId] = metadata;
    _metadataHashes[tokenId] = metadataHash;
    // ... same as existing mint but msg.sender is the owner
}
```

### 5B. Frontend Mint Hook Update

**Modify: `frontend/src/hooks/useMintAgent.ts`**

- Change `functionName: 'mint'` to `functionName: 'publicMint'`
- Remove the `to` parameter (contract uses `msg.sender`)
- Update args array accordingly

### 5C. Remove KNOWN_OWNER Check

**Modify: `frontend/src/app/dashboard/create/page.tsx`**

- Remove `KNOWN_OWNER` constant (line 13)
- Remove `isOwner` check (line 47)
- Remove the warning badge for non-owners
- Any connected wallet should be able to create

### 5D. Auto-List After Mint

The create page already does mint + list in sequence. Verify this flow works:
1. `mint()` -> get tokenId from receipt
2. `listAgent(tokenId, price)` -> list on marketplace
3. Navigate to `/dashboard`

---

## PRIORITY 6: x402 curl Demo Script (KiteAI)

**Why:** KiteAI demo requires terminal-side demonstration.

### 6A. Demo Script

**New file: `scripts/demo/x402-demo.sh`**

```bash
#!/bin/bash
# x402 Demo Script for KiteAI judges
API="http://localhost:8000"

echo "=== Step 1: Request without payment ==="
curl -s -X POST "$API/agents/portfolio_analyzer/execute" \
  -H "Content-Type: application/json" \
  -d '{"query":"Analyze ETH portfolio"}' | jq .

echo ""
echo "=== Step 2: Check x402 pricing ==="
curl -s "$API/agents/portfolio_analyzer/x402" | jq .

echo ""
echo "=== Step 3: Request with x402 USDT payment ==="
# Pre-built base64 payment header (from a valid Pieverse payment)
PAYMENT_HEADER="<base64-encoded-payment>"
curl -s -X POST "$API/agents/portfolio_analyzer/execute" \
  -H "Content-Type: application/json" \
  -H "X-PAYMENT: $PAYMENT_HEADER" \
  -d '{"query":"Analyze ETH portfolio"}' | jq .
```

### 6B. Pre-Build Payment Header

Before demo day: execute a real x402 payment via Pieverse and capture the base64 X-PAYMENT header. Store it for replay during the demo.

**Alternative:** If Pieverse supports test/demo mode, generate a valid payment header on the fly.

---

## PRIORITY 7: Cosmetic & Polish

### 7A. Mode-Aware Price Display

**Create utility: `frontend/src/lib/format.ts`**

```typescript
export function formatPrice(weiAmount: bigint, mode: "permissionless" | "compliant"): string {
  const eth = formatEther(weiAmount);
  const symbol = mode === "compliant" ? "ADI" : "OG";
  return `${eth} ${symbol}`;
}
```

Use this everywhere prices are displayed.

### 7B. Explorer Links

**Create utility (or extend format.ts):**

```typescript
export function txExplorerUrl(hash: string, mode: AppMode): string {
  return mode === "compliant"
    ? `https://explorer.ab.testnet.adifoundation.ai/tx/${hash}`
    : `https://chainscan-galileo.0g.ai/tx/${hash}`;
}
```

### 7C. Mode-Aware Agent Detail Page

**Modify: `frontend/src/app/agent/[id]/page.tsx`**

Conditional rendering based on mode:

| Element | Permissionless | Compliant |
|---------|---------------|-----------|
| Price | "0.001 OG" | "0.001 ADI" |
| Button | "Hire & Execute" | "Hire & Execute (Compliant)" |
| Payment chain | 0G (16602) | ADI (99999) |
| Payment contract | AgentMarketplacev2 | ADIAgentPayments |
| Auth check | isAuthorized on-chain | KYC verified |
| Result extras | Hedera proofs | Hedera proofs + Compliance card |
| Explorer links | 0G Explorer | ADI Explorer |

---

## PRIORITY 8: Pre-Demo Verification Checklist

### Environment Variables

```bash
# 0G Chain
OG_RPC_URL=https://evmrpc-testnet.0g.ai
AGENT_NFT_V2_ADDRESS=0xE79Bf574BfCfC17bA858CC311CE5FeF8B78e947B
AGENT_REGISTRY_ADDRESS=0xa259E6D0a4F740AD8879EA433Ba56B1C5A9e1a5B

# Hedera (must verify these work)
HEDERA_ENABLED=true
HEDERA_ACCOUNT_ID=...
HEDERA_PRIVATE_KEY=...
HEDERA_TOKEN_ID=...

# ADI Chain
ADI_PAYMENTS_ADDRESS=0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd
ADI_RPC_URL=https://rpc.ab.testnet.adifoundation.ai/
ADI_PAYMASTER_ADDRESS=0xBeD159217F43711c32fB6D57e4b203aEbC46B74A
DEPLOYER_PRIVATE_KEY=...  # For writing receipts back to ADI

# KiteAI / x402
KITE_WALLET_ADDRESS=...

# OpenAI
OPENAI_API_KEY=...
```

### Pre-Demo Script Checklist

```bash
# 1. Verify 0G Chain
cast call $AGENT_NFT_V2_ADDRESS "totalSupply()" --rpc-url $OG_RPC_URL

# 2. Verify Hedera
curl https://testnet.mirrornode.hedera.com/api/v1/tokens/$HEDERA_TOKEN_ID

# 3. Verify ADI Chain
cast call 0x56FEa0d531faC7a870F0cdC5dBFB57a6C6182cDd "getComplianceStats()" --rpc-url https://rpc.ab.testnet.adifoundation.ai/

# 4. Verify Backend
curl http://localhost:8000/health

# 5. Verify x402
curl -s http://localhost:8000/agents/portfolio_analyzer/x402 | jq .

# 6. Fund wallets
# Wallet A: needs OG (for 0G demo) + ADI (for ADI demo)
# Wallet B: needs OG (for all demos)
```

---

## Implementation Order

**Phase 1 — Core blockers (must have):**
1. Mode selector + AppModeContext (PRIORITY 1) — ~3-4 hours
2. Fix OG token symbol (PRIORITY 2) — ~15 min
3. ADI payment flow frontend (PRIORITY 3A-3F) — ~4-5 hours

**Phase 2 — Demo completeness:**
4. ADI compliance UI polish (PRIORITY 4) — ~2 hours
5. Public mint contract + frontend update (PRIORITY 5) — Person A deploys, ~1 hour frontend
6. x402 curl demo script (PRIORITY 6) — ~30 min

**Phase 3 — Polish:**
7. Mode-aware cosmetics (PRIORITY 7) — ~1-2 hours
8. Pre-demo verification (PRIORITY 8) — ~1 hour

**Total estimate: ~12-14 hours of Person B work + Person A contract deploy.**

---

## File Change Summary

### New Files
| File | Purpose |
|------|---------|
| `frontend/src/context/AppModeContext.tsx` | Global mode state + selector screen |
| `frontend/src/components/ModeSelector.tsx` | Full-screen mode picker (can be inline in context) |
| `frontend/src/components/KYCGate.tsx` | KYC verification gate for compliant mode |
| `frontend/src/hooks/useADIPayment.ts` | wagmi hook for ADIAgentPayments.payForAgentService |
| `frontend/src/abi/ADIAgentPayments.json` | ABI for advanced ADI contract |
| `frontend/src/lib/format.ts` | Mode-aware price + explorer formatting |
| `scripts/demo/x402-demo.sh` | curl demo script for KiteAI pitch |
| `scripts/adi/register-services.js` | Pre-register agent services on ADI |

### Modified Files
| File | Change |
|------|--------|
| `frontend/src/components/Providers.tsx` | Wrap with AppModeProvider, dynamic initial chain |
| `frontend/src/components/AppSidebar.tsx` | Mode indicator + switch button |
| `frontend/src/config/chains.ts` | Fix A0GI -> OG symbol |
| `frontend/src/app/agent/[id]/page.tsx` | Dual-mode hire flow (0G vs ADI), compliance result card |
| `frontend/src/app/marketplace/page.tsx` | Mode-aware prices + compliance badge |
| `frontend/src/app/dashboard/page.tsx` | Mode-aware earnings display |
| `frontend/src/app/dashboard/create/page.tsx` | Remove KNOWN_OWNER, use publicMint |
| `frontend/src/hooks/useMintAgent.ts` | Switch to publicMint function |
| `frontend/src/hooks/useExecuteAgent.ts` | Add compliant execution path |
| `frontend/src/lib/api.ts` | Already has executeAgentCompliant — no change needed |
| `agents/adi/compliance_service.py` | Switch to ADIAgentPayments contract ABI |
| `frontend/src/config/contracts.ts` | Add ADIAgentPayments address |
| `deployments.json` | Already has the address — no change needed |

### Person A Files (Contract)
| File | Change |
|------|--------|
| `contracts/src/AgentNFTv2.sol` | Add publicMint function |
| Deploy script | Redeploy + export ABIs |

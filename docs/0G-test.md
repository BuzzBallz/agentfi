# 0G Demo — Manual Test Steps

> Covers the full 0G Labs demo flow ($14k: Best DeFAI $7k + Best iNFT $7k)
> Reference: `docs/demo-specs.md` — Demo 1

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
# 1. 0G RPC alive
cast client --rpc-url https://evmrpc-testnet.0g.ai

# 2. Agents seeded on marketplace
cast call 0x0eC3981a544C3dC6983C523860E13c2B7a66cd6e \
  "getListedAgents()((uint256,address,uint256,bool)[])" \
  --rpc-url https://evmrpc-testnet.0g.ai

# 3. Agent 0 data readable
cast call 0xDCD2e9B068913fcF0C80ff5DA070B243Df091EFE \
  "getAgentData(uint256)(string,string,string,uint256)" 0 \
  --rpc-url https://evmrpc-testnet.0g.ai

# 4. Backend health
curl http://localhost:8000/health
```

**Expected:** RPC returns version, 3 agents listed, agent 0 has name/desc/caps/price, backend returns `{"status":"ok"}`.

### Wallets

| Wallet | Role | Requirement |
|--------|------|-------------|
| Deployer | Contract owner | Pre-seeded agents (already done) |
| Wallet A | Agent creator | Needs OG for gas (~0.01 OG) |
| Wallet B | Agent consumer/hirer | Needs OG for gas + hire price (~0.01 OG) |

### Contract Addresses (0G Galileo — Chain 16602)

| Contract | Address |
|----------|---------|
| AgentNFTv2 | `0xDCD2e9B068913fcF0C80ff5DA070B243Df091EFE` |
| AgentMarketplacev2 | `0x0eC3981a544C3dC6983C523860E13c2B7a66cd6e` |

---

## Step 1 — Mode Selection

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 1.1 | Open `http://localhost:3000` | Mode selector full-screen: "Permissionless" / "Compliant" | |
| 1.2 | Click **Permissionless** | Mode selector disappears, sidebar shows green dot + "PERMISSIONLESS" + "0G Galileo" + "OG" | |
| 1.3 | Navigate to `/marketplace` via sidebar | Marketplace loads. Mode selector does NOT reappear | |
| 1.4 | Navigate to `/dashboard`, then back to `/marketplace` | Mode persists across all pages (no selector popup) | |
| 1.5 | Hard-refresh the page (F5) | Mode still persists (localStorage) | |
| 1.6 | Click "Switch Mode" in sidebar | Mode selector reappears, can pick a new mode | |

**Bug history:** Mode selector used to reappear on every navigation (no localStorage persistence). Fixed in `AppModeContext.tsx`.

---

## Step 2 — Wallet Connect

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 2.1 | Click "Connect Wallet" in sidebar | RainbowKit modal opens | |
| 2.2 | Connect **Wallet A** via MetaMask | Wallet address appears in sidebar, connected to 0G Galileo (chain 16602) | |
| 2.3 | Check MetaMask network | Should show 0G Galileo Testnet | |

---

## Step 2b — Dashboard (Connected Wallet)

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 2b.1 | Navigate to `/dashboard` | Dashboard loads, does NOT show "Connect Your Wallet" prompt | |
| 2b.2 | MY AGENTS section | Shows agents owned by connected wallet, OR "No Agents Owned Yet" if wallet owns none | |
| 2b.3 | Earnings Summary section | Shows stats WITHOUT "DEMO DATA" badge (badge only for disconnected state) | |
| 2b.4 | Live Activity section | Shows feed WITHOUT "DEMO DATA" badge | |
| 2b.5 | Performance section | Shows stats WITHOUT "DEMO DATA" badge | |
| 2b.6 | "Create & Mint New Agent" CTA visible | Gold button at bottom of page | |

**Bug history:** Dashboard showed "Connect Your Wallet" during wagmi reconnection even when already connected. Also showed "DEMO DATA" badge on all sections regardless of connection. Fixed by checking `accountStatus === "disconnected"` instead of `!isConnected`, and hiding DemoBadge when connected.

---

## Step 3 — Agent Creation with On-Chain Intelligence (Public Mint)

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 3.1 | Navigate to `/dashboard` | Dashboard page loads | |
| 3.2 | Click "Create & Mint New Agent" | `/dashboard/create` page loads with form | |
| 3.3 | Fill form fields (see exact values below) | All fields accept input, including **SYSTEM PROMPT** textarea | |
| 3.4 | Submit — click "Mint iNFT" | MetaMask popup for `publicMint()` tx (no value, just gas) | |
| 3.5 | Confirm tx in MetaMask | TX hash appears, "Confirming..." state | |
| 3.6 | Wait for confirmation | "Registering AI agent on backend..." then "iNFT Minted Successfully!" with token ID | |
| 3.7 | Backend auto-registers | Frontend calls `POST /agents/register` — agent is now executable on backend | |
| 3.8 | Click "List on Marketplace" | Second MetaMask tx to list the agent for hire | |
| 3.9 | Click 0G Explorer link | Explorer shows mint event: `AgentMinted(tokenId, owner)` | |
| 3.10 | Navigate back to `/dashboard` | New agent visible in MY AGENTS grid | |

**Key contract call:** `AgentNFTv2.publicMint(uri, metadata, metadataHash, encryptedURI, sealedKey)` — mints to `msg.sender`, no `onlyOwner` restriction.

**What changed (ERC-7857 intelligence):**
- `metadataHash = keccak256(name:description:capabilities:systemPrompt)` — the agent's intelligence is part of the on-chain hash
- `encryptedURI = data:application/json;base64,...` — the full intelligence payload (system prompt + model) is stored on-chain
- After mint, the frontend auto-registers the agent on the backend so it's immediately executable

### Exact Field Values for Demo

Use these **exact values** when filling the create agent form at `/dashboard/create`. These are reusable across multiple demos (just delete `agents/dynamic_agents.json` between runs to reset backend state).

| Field | Value |
|-------|-------|
| **NAME** | `DeFi Rebalancer` |
| **DESCRIPTION** | `Autonomous portfolio rebalancing agent. Monitors allocations across DeFi protocols and executes optimal rebalancing strategies using real-time market data.` |
| **SYSTEM PROMPT** | See below — copy the full block |
| **CAPABILITIES** | `portfolio_rebalancing, defi_monitoring, strategy_execution, risk_management` |
| **PRICE PER HIRE (OG)** | `0.002` |
| **TOKEN URI** | See "Token URI" section below (copy the data URI block) |

### System Prompt (copy-paste this)

```
You are DeFi Rebalancer, an autonomous portfolio rebalancing AI agent on AgentFi.

Your job:
1. Analyze the user's current DeFi portfolio allocations
2. Compare against optimal allocation targets (e.g. 60/30/10 rule)
3. Recommend specific rebalancing trades with amounts
4. Calculate estimated gas costs and slippage for each trade
5. Provide a clear action plan with priority order

Rules:
- Always show your math with real numbers
- Categorize urgency: CRITICAL (>20% drift), MODERATE (10-20%), MINOR (<10%)
- Include both the "what" (trade X for Y) and the "why" (reduces concentration risk)
- Format output as clean markdown with tables
- Never recommend more than 5 trades at once
```

> **Why this prompt is good for the demo:** It gives specific, structured output that looks impressive to judges. The agent will respond with tables, urgency categories, and concrete trade recommendations — very "DeFAI".

### Token URI (copy-paste this)

This data URI embeds the full NFT metadata inline — name, description, attributes, and a branded SVG image with the AgentFi gold/dark theme. It works offline, requires no external dependency, and is reusable across every demo.

```
data:application/json;base64,ewogICJuYW1lIjogIkRlRmkgUmViYWxhbmNlciIsCiAgImRlc2NyaXB0aW9uIjogIkF1dG9ub21vdXMgcG9ydGZvbGlvIHJlYmFsYW5jaW5nIGFnZW50LiBNb25pdG9ycyBhbGxvY2F0aW9ucyBhY3Jvc3MgRGVGaSBwcm90b2NvbHMgYW5kIGV4ZWN1dGVzIG9wdGltYWwgcmViYWxhbmNpbmcgc3RyYXRlZ2llcyB1c2luZyByZWFsLXRpbWUgbWFya2V0IGRhdGEuIiwKICAiaW1hZ2UiOiAiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhacFpYZENiM2c5SWpBZ01DQTBNREFnTkRBd0lqNEtJQ0E4WkdWbWN6NEtJQ0FnSUR4c2FXNWxZWEpIY21Ga2FXVnVkQ0JwWkQwaVltY2lJSGd4UFNJd0pTSWdlVEU5SWpBbElpQjRNajBpTVRBd0pTSWdlVEk5SWpFd01DVWlQZ29nSUNBZ0lDQThjM1J2Y0NCdlptWnpaWFE5SWpBbElpQnpkRzl3TFdOdmJHOXlQU0lqTUVFd1FUQkdJaTgrQ2lBZ0lDQWdJRHh6ZEc5d0lHOW1abk5sZEQwaU5UQWxJaUJ6ZEc5d0xXTnZiRzl5UFNJak1VRXhNakE0SWk4K0NpQWdJQ0FnSUR4emRHOXdJRzltWm5ObGREMGlNVEF3SlNJZ2MzUnZjQzFqYjJ4dmNqMGlJekJFTVRFeE55SXZQZ29nSUNBZ1BDOXNhVzVsWVhKSGNtRmthV1Z1ZEQ0S0lDQWdJRHhzYVc1bFlYSkhjbUZrYVdWdWRDQnBaRDBpWjI5c1pDSWdlREU5SWpBbElpQjVNVDBpTUNVaUlIZ3lQU0l4TURBbElpQjVNajBpTUNVaVBnb2dJQ0FnSUNBOGMzUnZjQ0J2Wm1aelpYUTlJakFsSWlCemRHOXdMV052Ykc5eVBTSWpRemxCT0RSRElpOCtDaUFnSUNBZ0lEeHpkRzl3SUc5bVpuTmxkRDBpTlRBbElpQnpkRzl3TFdOdmJHOXlQU0lqUmpWRlEwUTNJaTgrQ2lBZ0lDQWdJRHh6ZEc5d0lHOW1abk5sZEQwaU1UQXdKU0lnYzNSdmNDMWpiMnh2Y2owaUkwTTVRVGcwUXlJdlBnb2dJQ0FnUEM5c2FXNWxZWEpIY21Ga2FXVnVkRDRLSUNBZ0lEeHNhVzVsWVhKSGNtRmthV1Z1ZENCcFpEMGljbWx1WnlJZ2VERTlJakFsSWlCNU1UMGlNQ1VpSUhneVBTSXhNREFsSWlCNU1qMGlNVEF3SlNJK0NpQWdJQ0FnSUR4emRHOXdJRzltWm5ObGREMGlNQ1VpSUhOMGIzQXRZMjlzYjNJOUlpTkRPVUU0TkVNaUlITjBiM0F0YjNCaFkybDBlVDBpTUM0NElpOCtDaUFnSUNBZ0lEeHpkRzl3SUc5bVpuTmxkRDBpTVRBd0pTSWdjM1J2Y0MxamIyeHZjajBpSXpWRE5FRXpNaUlnYzNSdmNDMXZjR0ZqYVhSNVBTSXdMak1pTHo0S0lDQWdJRHd2YkdsdVpXRnlSM0poWkdsbGJuUStDaUFnUEM5a1pXWnpQZ29nSUR4eVpXTjBJSGRwWkhSb1BTSTBNREFpSUdobGFXZG9kRDBpTkRBd0lpQm1hV3hzUFNKMWNtd29JMkpuS1NJdlBnb2dJRHh5WldOMElIZzlJamdpSUhrOUlqZ2lJSGRwWkhSb1BTSXpPRFFpSUdobGFXZG9kRDBpTXpnMElpQnllRDBpTVRZaUlHWnBiR3c5SW01dmJtVWlJSE4wY205clpUMGlkWEpzS0NOeWFXNW5LU0lnYzNSeWIydGxMWGRwWkhSb1BTSXhMalVpTHo0S0lDQThZMmx5WTJ4bElHTjRQU0l5TURBaUlHTjVQU0l4TlRVaUlISTlJall5SWlCbWFXeHNQU0p1YjI1bElpQnpkSEp2YTJVOUluVnliQ2dqWjI5c1pDa2lJSE4wY205clpTMTNhV1IwYUQwaU1pSWdiM0JoWTJsMGVUMGlNQzR6SWk4K0NpQWdQR05wY21Oc1pTQmplRDBpTWpBd0lpQmplVDBpTVRVMUlpQnlQU0kwTlNJZ1ptbHNiRDBpYm05dVpTSWdjM1J5YjJ0bFBTSWpRemxCT0RSRElpQnpkSEp2YTJVdGQybGtkR2c5SWpFdU5TSWdiM0JoWTJsMGVUMGlNQzR4TlNJdlBnb2dJRHgwWlhoMElIZzlJakl3TUNJZ2VUMGlNVFE0SWlCbWIyNTBMV1poYldsc2VUMGliVzl1YjNOd1lXTmxJaUJtYjI1MExYTnBlbVU5SWpVeUlpQm1hV3hzUFNJalF6bEJPRFJESWlCMFpYaDBMV0Z1WTJodmNqMGliV2xrWkd4bElpQm1iMjUwTFhkbGFXZG9kRDBpWW05c1pDSStRV2s4TDNSbGVIUStDaUFnUEd4cGJtVWdlREU5SWpFMU5TSWdlVEU5SWpFMk9DSWdlREk5SWpJME5TSWdlVEk5SWpFMk9DSWdjM1J5YjJ0bFBTSWpRemxCT0RSRElpQnpkSEp2YTJVdGQybGtkR2c5SWpFaUlHOXdZV05wZEhrOUlqQXVOQ0l2UGdvZ0lEeDBaWGgwSUhnOUlqSXdNQ0lnZVQwaU1UZzRJaUJtYjI1MExXWmhiV2xzZVQwaWJXOXViM053WVdObElpQm1iMjUwTFhOcGVtVTlJakV3SWlCbWFXeHNQU0lqT1VFNE1EWXdJaUIwWlhoMExXRnVZMmh2Y2owaWJXbGtaR3hsSWlCc1pYUjBaWEl0YzNCaFkybHVaejBpTkNJK1JWSkRMVGM0TlRjZ2FVNUdWRHd2ZEdWNGRENEtJQ0E4ZEdWNGRDQjRQU0l5TURBaUlIazlJakkwTlNJZ1ptOXVkQzFtWVcxcGJIazlJbk5oYm5NdGMyVnlhV1lpSUdadmJuUXRjMmw2WlQwaU1qSWlJR1pwYkd3OUlpTkdOVVZEUkRjaUlIUmxlSFF0WVc1amFHOXlQU0p0YVdSa2JHVWlJR1p2Ym5RdGQyVnBaMmgwUFNKaWIyeGtJajVFWlVacElGSmxZbUZzWVc1alpYSThMM1JsZUhRK0NpQWdQSFJsZUhRZ2VEMGlNakF3SWlCNVBTSXlOekFpSUdadmJuUXRabUZ0YVd4NVBTSnRiMjV2YzNCaFkyVWlJR1p2Ym5RdGMybDZaVDBpTVRFaUlHWnBiR3c5SWlNMVF6UkJNeklpSUhSbGVIUXRZVzVqYUc5eVBTSnRhV1JrYkdVaVBrRlZWRTlPVDAxUFZWTWdRVWRGVGxROEwzUmxlSFErQ2lBZ1BHY2diM0JoWTJsMGVUMGlNQzR4TWlJK0NpQWdJQ0E4WTJseVkyeGxJR040UFNJMk1DSWdZM2s5SWpZd0lpQnlQU0l4TGpVaUlHWnBiR3c5SWlORE9VRTRORE1pTHo0S0lDQWdJRHhqYVhKamJHVWdZM2c5SWpNME1DSWdZM2s5SWpnd0lpQnlQU0l4SWlCbWFXeHNQU0lqUXpsQk9EUkRJaTgrQ2lBZ0lDQThZMmx5WTJ4bElHTjRQU0kxTUNJZ1kzazlJak0wTUNJZ2NqMGlNU0lnWm1sc2JEMGlJME01UVRnMFF5SXZQZ29nSUNBZ1BHTnBjbU5zWlNCamVEMGlNelV3SWlCamVUMGlNekl3SWlCeVBTSXhMalVpSUdacGJHdzlJaU5ET1VFNE5FTWlMejRLSUNBZ0lEeGphWEpqYkdVZ1kzZzlJakV3TUNJZ1kzazlJakl3TUNJZ2NqMGlNU0lnWm1sc2JEMGlJME01UVRnMFF5SXZQZ29nSUNBZ1BHTnBjbU5zWlNCamVEMGlNekl3SWlCamVUMGlNVGd3SWlCeVBTSXhJaUJtYVd4c1BTSWpRemxCT0RSRElpOCtDaUFnUEM5blBnb2dJRHh5WldOMElIZzlJakV5TUNJZ2VUMGlNekExSWlCM2FXUjBhRDBpTVRZd0lpQm9aV2xuYUhROUlqSTRJaUJ5ZUQwaU5pSWdabWxzYkQwaUkwTTVRVGcwUXlJZ2IzQmhZMmwwZVQwaU1DNHhJaUJ6ZEhKdmEyVTlJaU5ET1VFNE5FTWlJSE4wY205clpTMTNhV1IwYUQwaU1DNDFJaUJ2Y0dGamFYUjVQU0l3TGpNaUx6NEtJQ0E4ZEdWNGRDQjRQU0l5TURBaUlIazlJak15TkNJZ1ptOXVkQzFtWVcxcGJIazlJbTF2Ym05emNHRmpaU0lnWm05dWRDMXphWHBsUFNJeE1TSWdabWxzYkQwaUkwTTVRVGcwUXlJZ2RHVjRkQzFoYm1Ob2IzSTlJbTFwWkdSc1pTSWdabTl1ZEMxM1pXbG5hSFE5SW1KdmJHUWlQa0ZuWlc1MFJtazhMM1JsZUhRK0NpQWdQSFJsZUhRZ2VEMGlNakF3SWlCNVBTSXpOalVpSUdadmJuUXRabUZ0YVd4NVBTSnRiMjV2YzNCaFkyVWlJR1p2Ym5RdGMybDZaVDBpT0NJZ1ptbHNiRDBpSXpORU1rVXhRU0lnZEdWNGRDMWhibU5vYjNJOUltMXBaR1JzWlNJK01FY2dRMGhCU1U0Z2ZDQkhRVXhKVEVWUElGUkZVMVJPUlZROEwzUmxlSFErQ2p3dmMzWm5QZ289IiwKICAiZXh0ZXJuYWxfdXJsIjogImh0dHBzOi8vYWdlbnRmaS54eXoiLAogICJhdHRyaWJ1dGVzIjogWwogICAgeyAidHJhaXRfdHlwZSI6ICJBZ2VudCBUeXBlIiwgInZhbHVlIjogIlJlYmFsYW5jZXIiIH0sCiAgICB7ICJ0cmFpdF90eXBlIjogIlN0YW5kYXJkIiwgInZhbHVlIjogIkVSQy03ODU3IGlORlQiIH0sCiAgICB7ICJ0cmFpdF90eXBlIjogIkNoYWluIiwgInZhbHVlIjogIjBHIEdhbGlsZW8iIH0sCiAgICB7ICJ0cmFpdF90eXBlIjogIlByaWNlIFBlciBDYWxsIiwgInZhbHVlIjogIjAuMDAyIE9HIiB9LAogICAgeyAidHJhaXRfdHlwZSI6ICJNb2RlbCIsICJ2YWx1ZSI6ICJDbGF1ZGUgSGFpa3UgNC41IiB9LAogICAgeyAidHJhaXRfdHlwZSI6ICJJbnRlbGxpZ2VuY2UgSGFzaGVkIiwgInZhbHVlIjogInRydWUiIH0KICBdLAogICJwcm9wZXJ0aWVzIjogewogICAgImNhdGVnb3J5IjogIkRlRmkiLAogICAgImNhcGFiaWxpdGllcyI6IFsicG9ydGZvbGlvX3JlYmFsYW5jaW5nIiwgImRlZmlfbW9uaXRvcmluZyIsICJzdHJhdGVneV9leGVjdXRpb24iLCAicmlza19tYW5hZ2VtZW50Il0sCiAgICAiaW50ZWxsaWdlbmNlX3N0YW5kYXJkIjogIkVSQy03ODU3IG1ldGFkYXRhSGFzaCArIGVuY3J5cHRlZFVSSSIKICB9Cn0K
```

> Copy the whole block above into the **TOKEN URI** field. It works every time, offline, no IPFS/0G Storage needed.

**What's inside this data URI:**

```json
{
  "name": "DeFi Rebalancer",
  "description": "Autonomous portfolio rebalancing agent. Monitors allocations...",
  "image": "data:image/svg+xml;base64,...",
  "external_url": "https://agentfi.xyz",
  "attributes": [
    { "trait_type": "Agent Type", "value": "Rebalancer" },
    { "trait_type": "Standard", "value": "ERC-7857 iNFT" },
    { "trait_type": "Chain", "value": "0G Galileo" },
    { "trait_type": "Price Per Call", "value": "0.002 OG" },
    { "trait_type": "Model", "value": "Claude Haiku 4.5" },
    { "trait_type": "Intelligence Hashed", "value": "true" }
  ],
  "properties": {
    "category": "DeFi",
    "capabilities": ["portfolio_rebalancing", "defi_monitoring", "strategy_execution", "risk_management"],
    "intelligence_standard": "ERC-7857 metadataHash + encryptedURI"
  }
}
```

**The SVG image renders:**
- Dark gradient background (#0A0A0F -> #1A1208 -> #0D1117) matching the AgentFi theme
- Gold concentric circles with "Ai" monogram in the center
- "ERC-7857 iNFT" label below the circles
- "DeFi Rebalancer" as the main title in cream (#F5ECD7)
- "AUTONOMOUS AGENT" subtitle
- "AgentFi" badge with gold border
- "0G CHAIN | GALILEO TESTNET" footer
- Subtle gold dot particles in the background

### Resetting Between Demos

To reset dynamic agents so you can re-run the create flow:

```bash
# Delete backend state (dynamic agents)
rm -f agents/dynamic_agents.json

# Restart backend
cd agents && python -m uvicorn api:app --reload --port 8000
```

On-chain state (minted NFTs) cannot be reset — the next tokenId will increment. This is fine for repeated demos; just note the new tokenId shown in the UI.

---

## Step 3b — Verify On-Chain Intelligence (ERC-7857 Bounty Story)

This step proves to judges that the agent's intelligence is verifiable on-chain. Run these after Step 3.

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 3b.1 | Read metadataHash from contract | Non-zero hash that includes the system prompt | |
| 3b.2 | Read encryptedURI from contract | Base64 data URI containing the system prompt | |
| 3b.3 | Decode encryptedURI | JSON with `system_prompt`, `model`, `name`, `description` | |
| 3b.4 | Recompute hash locally | Matches on-chain metadataHash — proves integrity | |
| 3b.5 | Execute the new agent | Agent responds using the custom system prompt | |

### Cast Commands (replace `TOKEN_ID` with the minted ID, e.g. 3)

```bash
NFT=0xDCD2e9B068913fcF0C80ff5DA070B243Df091EFE
RPC=https://evmrpc-testnet.0g.ai
TOKEN_ID=6

# 1. Read metadataHash — proves intelligence is hashed on-chain
cast call $NFT "getMetadataHash(uint256)(bytes32)" $TOKEN_ID --rpc-url $RPC

# 2. Read encryptedURI — the intelligence payload stored on-chain
cast call $NFT "getEncryptedURI(uint256)(string)" $TOKEN_ID --rpc-url $RPC

# 3. Decode the base64 data URI (strip "data:application/json;base64," prefix)
# Copy the string from step 2, strip the prefix, then:
echo "ewogICJuYW1lIjogIkRlRmkgUmViYWxhbmNlciIsCiAgImRlc2NyaXB0aW9uIjogIkF1dG9ub21vdXMgcG9ydGZvbGlvIHJlYmFsYW5jaW5nIGFnZW50LiBNb25pdG9ycyBhbGxvY2F0aW9ucyBhY3Jvc3MgRGVGaSBwcm90b2NvbHMgYW5kIGV4ZWN1dGVzIG9wdGltYWwgcmViYWxhbmNpbmcgc3RyYXRlZ2llcyB1c2luZyByZWFsLXRpbWUgbWFya2V0IGRhdGEuIiwKICAiaW1hZ2UiOiAiZGF0YTppbWFnZS9zdmcreG1sO2Jhc2U2NCxQSE4yWnlCNGJXeHVjejBpYUhSMGNEb3ZMM2QzZHk1M015NXZjbWN2TWpBd01DOXpkbWNpSUhacFpYZENiM2c5SWpBZ01DQTBNREFnTkRBd0lqNEtJQ0E4WkdWbWN6NEtJQ0FnSUR4c2FXNWxZWEpIY21Ga2FXVnVkQ0JwWkQwaVltY2lJSGd4UFNJd0pTSWdlVEU5SWpBbElpQjRNajBpTVRBd0pTSWdlVEk5SWpFd01DVWlQZ29nSUNBZ0lDQThjM1J2Y0NCdlptWnpaWFE5SWpBbElpQnpkRzl3TFdOdmJHOXlQU0lqTUVFd1FUQkdJaTgrQ2lBZ0lDQWdJRHh6ZEc5d0lHOW1abk5sZEQwaU5UQWxJaUJ6ZEc5d0xXTnZiRzl5UFNJak1VRXhNakE0SWk4K0NpQWdJQ0FnSUR4emRHOXdJRzltWm5ObGREMGlNVEF3SlNJZ2MzUnZjQzFqYjJ4dmNqMGlJekJFTVRFeE55SXZQZ29nSUNBZ1BDOXNhVzVsWVhKSGNtRmthV1Z1ZEQ0S0lDQWdJRHhzYVc1bFlYSkhjbUZrYVdWdWRDQnBaRDBpWjI5c1pDSWdlREU5SWpBbElpQjVNVDBpTUNVaUlIZ3lQU0l4TURBbElpQjVNajBpTUNVaVBnb2dJQ0FnSUNBOGMzUnZjQ0J2Wm1aelpYUTlJakFsSWlCemRHOXdMV052Ykc5eVBTSWpRemxCT0RSRElpOCtDaUFnSUNBZ0lEeHpkRzl3SUc5bVpuTmxkRDBpTlRBbElpQnpkRzl3TFdOdmJHOXlQU0lqUmpWRlEwUTNJaTgrQ2lBZ0lDQWdJRHh6ZEc5d0lHOW1abk5sZEQwaU1UQXdKU0lnYzNSdmNDMWpiMnh2Y2owaUkwTTVRVGcwUXlJdlBnb2dJQ0FnUEM5c2FXNWxZWEpIY21Ga2FXVnVkRDRLSUNBZ0lEeHNhVzVsWVhKSGNtRmthV1Z1ZENCcFpEMGljbWx1WnlJZ2VERTlJakFsSWlCNU1UMGlNQ1VpSUhneVBTSXhNREFsSWlCNU1qMGlNVEF3SlNJK0NpQWdJQ0FnSUR4emRHOXdJRzltWm5ObGREMGlNQ1VpSUhOMGIzQXRZMjlzYjNJOUlpTkRPVUU0TkVNaUlITjBiM0F0YjNCaFkybDBlVDBpTUM0NElpOCtDaUFnSUNBZ0lEeHpkRzl3SUc5bVpuTmxkRDBpTVRBd0pTSWdjM1J2Y0MxamIyeHZjajBpSXpWRE5FRXpNaUlnYzNSdmNDMXZjR0ZqYVhSNVBTSXdMak1pTHo0S0lDQWdJRHd2YkdsdVpXRnlSM0poWkdsbGJuUStDaUFnUEM5a1pXWnpQZ29nSUR4eVpXTjBJSGRwWkhSb1BTSTBNREFpSUdobGFXZG9kRDBpTkRBd0lpQm1hV3hzUFNKMWNtd29JMkpuS1NJdlBnb2dJRHh5WldOMElIZzlJamdpSUhrOUlqZ2lJSGRwWkhSb1BTSXpPRFFpSUdobGFXZG9kRDBpTXpnMElpQnllRDBpTVRZaUlHWnBiR3c5SW01dmJtVWlJSE4wY205clpUMGlkWEpzS0NOeWFXNW5LU0lnYzNSeWIydGxMWGRwWkhSb1BTSXhMalVpTHo0S0lDQThZMmx5WTJ4bElHTjRQU0l5TURBaUlHTjVQU0l4TlRVaUlISTlJall5SWlCbWFXeHNQU0p1YjI1bElpQnpkSEp2YTJVOUluVnliQ2dqWjI5c1pDa2lJSE4wY205clpTMTNhV1IwYUQwaU1pSWdiM0JoWTJsMGVUMGlNQzR6SWk4K0NpQWdQR05wY21Oc1pTQmplRDBpTWpBd0lpQmplVDBpTVRVMUlpQnlQU0kwTlNJZ1ptbHNiRDBpYm05dVpTSWdjM1J5YjJ0bFBTSWpRemxCT0RSRElpQnpkSEp2YTJVdGQybGtkR2c5SWpFdU5TSWdiM0JoWTJsMGVUMGlNQzR4TlNJdlBnb2dJRHgwWlhoMElIZzlJakl3TUNJZ2VUMGlNVFE0SWlCbWIyNTBMV1poYldsc2VUMGliVzl1YjNOd1lXTmxJaUJtYjI1MExYTnBlbVU5SWpVeUlpQm1hV3hzUFNJalF6bEJPRFJESWlCMFpYaDBMV0Z1WTJodmNqMGliV2xrWkd4bElpQm1iMjUwTFhkbGFXZG9kRDBpWW05c1pDSStRV2s4TDNSbGVIUStDaUFnUEd4cGJtVWdlREU5SWpFMU5TSWdlVEU5SWpFMk9DSWdlREk5SWpJME5TSWdlVEk5SWpFMk9DSWdjM1J5YjJ0bFBTSWpRemxCT0RSRElpQnpkSEp2YTJVdGQybGtkR2c5SWpFaUlHOXdZV05wZEhrOUlqQXVOQ0l2UGdvZ0lEeDBaWGgwSUhnOUlqSXdNQ0lnZVQwaU1UZzRJaUJtYjI1MExXWmhiV2xzZVQwaWJXOXViM053WVdObElpQm1iMjUwTFhOcGVtVTlJakV3SWlCbWFXeHNQU0lqT1VFNE1EWXdJaUIwWlhoMExXRnVZMmh2Y2owaWJXbGtaR3hsSWlCc1pYUjBaWEl0YzNCaFkybHVaejBpTkNJK1JWSkRMVGM0TlRjZ2FVNUdWRHd2ZEdWNGRENEtJQ0E4ZEdWNGRDQjRQU0l5TURBaUlIazlJakkwTlNJZ1ptOXVkQzFtWVcxcGJIazlJbk5oYm5NdGMyVnlhV1lpSUdadmJuUXRjMmw2WlQwaU1qSWlJR1pwYkd3OUlpTkdOVVZEUkRjaUlIUmxlSFF0WVc1amFHOXlQU0p0YVdSa2JHVWlJR1p2Ym5RdGQyVnBaMmgwUFNKaWIyeGtJajVFWlVacElGSmxZbUZzWVc1alpYSThMM1JsZUhRK0NpQWdQSFJsZUhRZ2VEMGlNakF3SWlCNVBTSXlOekFpSUdadmJuUXRabUZ0YVd4NVBTSnRiMjV2YzNCaFkyVWlJR1p2Ym5RdGMybDZaVDBpTVRFaUlHWnBiR3c5SWlNMVF6UkJNeklpSUhSbGVIUXRZVzVqYUc5eVBTSnRhV1JrYkdVaVBrRlZWRTlPVDAxUFZWTWdRVWRGVGxROEwzUmxlSFErQ2lBZ1BHY2diM0JoWTJsMGVUMGlNQzR4TWlJK0NpQWdJQ0E4WTJseVkyeGxJR040UFNJMk1DSWdZM2s5SWpZd0lpQnlQU0l4TGpVaUlHWnBiR3c5SWlORE9VRTRORE1pTHo0S0lDQWdJRHhqYVhKamJHVWdZM2c5SWpNME1DSWdZM2s5SWpnd0lpQnlQU0l4SWlCbWFXeHNQU0lqUXpsQk9EUkRJaTgrQ2lBZ0lDQThZMmx5WTJ4bElHTjRQU0kxTUNJZ1kzazlJak0wTUNJZ2NqMGlNU0lnWm1sc2JEMGlJME01UVRnMFF5SXZQZ29nSUNBZ1BHTnBjbU5zWlNCamVEMGlNelV3SWlCamVUMGlNekl3SWlCeVBTSXhMalVpSUdacGJHdzlJaU5ET1VFNE5FTWlMejRLSUNBZ0lEeGphWEpqYkdVZ1kzZzlJakV3TUNJZ1kzazlJakl3TUNJZ2NqMGlNU0lnWm1sc2JEMGlJME01UVRnMFF5SXZQZ29nSUNBZ1BHTnBjbU5zWlNCamVEMGlNekl3SWlCamVUMGlNVGd3SWlCeVBTSXhJaUJtYVd4c1BTSWpRemxCT0RSRElpOCtDaUFnUEM5blBnb2dJRHh5WldOMElIZzlJakV5TUNJZ2VUMGlNekExSWlCM2FXUjBhRDBpTVRZd0lpQm9aV2xuYUhROUlqSTRJaUJ5ZUQwaU5pSWdabWxzYkQwaUkwTTVRVGcwUXlJZ2IzQmhZMmwwZVQwaU1DNHhJaUJ6ZEhKdmEyVTlJaU5ET1VFNE5FTWlJSE4wY205clpTMTNhV1IwYUQwaU1DNDFJaUJ2Y0dGamFYUjVQU0l3TGpNaUx6NEtJQ0E4ZEdWNGRDQjRQU0l5TURBaUlIazlJak15TkNJZ1ptOXVkQzFtWVcxcGJIazlJbTF2Ym05emNHRmpaU0lnWm05dWRDMXphWHBsUFNJeE1TSWdabWxzYkQwaUkwTTVRVGcwUXlJZ2RHVjRkQzFoYm1Ob2IzSTlJbTFwWkdSc1pTSWdabTl1ZEMxM1pXbG5hSFE5SW1KdmJHUWlQa0ZuWlc1MFJtazhMM1JsZUhRK0NpQWdQSFJsZUhRZ2VEMGlNakF3SWlCNVBTSXpOalVpSUdadmJuUXRabUZ0YVd4NVBTSnRiMjV2YzNCaFkyVWlJR1p2Ym5RdGMybDZaVDBpT0NJZ1ptbHNiRDBpSXpORU1rVXhRU0lnZEdWNGRDMWhibU5vYjNJOUltMXBaR1JzWlNJK01FY2dRMGhCU1U0Z2ZDQkhRVXhKVEVWUElGUkZVMVJPUlZROEwzUmxlSFErQ2p3dmMzWm5QZ289IiwKICAiZXh0ZXJuYWxfdXJsIjogImh0dHBzOi8vYWdlbnRmaS54eXoiLAogICJhdHRyaWJ1dGVzIjogWwogICAgeyAidHJhaXRfdHlwZSI6ICJBZ2VudCBUeXBlIiwgInZhbHVlIjogIlJlYmFsYW5jZXIiIH0sCiAgICB7ICJ0cmFpdF90eXBlIjogIlN0YW5kYXJkIiwgInZhbHVlIjogIkVSQy03ODU3IGlORlQiIH0sCiAgICB7ICJ0cmFpdF90eXBlIjogIkNoYWluIiwgInZhbHVlIjogIjBHIEdhbGlsZW8iIH0sCiAgICB7ICJ0cmFpdF90eXBlIjogIlByaWNlIFBlciBDYWxsIiwgInZhbHVlIjogIjAuMDAyIE9HIiB9LAogICAgeyAidHJhaXRfdHlwZSI6ICJNb2RlbCIsICJ2YWx1ZSI6ICJDbGF1ZGUgSGFpa3UgNC41IiB9LAogICAgeyAidHJhaXRfdHlwZSI6ICJJbnRlbGxpZ2VuY2UgSGFzaGVkIiwgInZhbHVlIjogInRydWUiIH0KICBdLAogICJwcm9wZXJ0aWVzIjogewogICAgImNhdGVnb3J5IjogIkRlRmkiLAogICAgImNhcGFiaWxpdGllcyI6IFsicG9ydGZvbGlvX3JlYmFsYW5jaW5nIiwgImRlZmlfbW9uaXRvcmluZyIsICJzdHJhdGVneV9leGVjdXRpb24iLCAicmlza19tYW5hZ2VtZW50Il0sCiAgICAiaW50ZWxsaWdlbmNlX3N0YW5kYXJkIjogIkVSQy03ODU3IG1ldGFkYXRhSGFzaCArIGVuY3J5cHRlZFVSSSIKICB9Cn0K" | base64 -d
# Expected output: {"system_prompt":"You are DeFi Rebalancer...","model":"claude-haiku-4-5","name":"DeFi Rebalancer","description":"Autonomous portfolio..."}

# 4. Verify integrity — recompute hash and compare
# The hash input is: name:description:capabilities:systemPrompt
# (exact same values from the form)
cast keccak "DeFi Rebalancer:Autonomous portfolio rebalancing agent. Monitors allocations across DeFi protocols and executes optimal rebalancing strategies using real-time market data.:[\"portfolio_rebalancing\",\"defi_monitoring\",\"strategy_execution\",\"risk_management\"]:You are DeFi Rebalancer, an autonomous portfolio rebalancing AI agent on AgentFi.

Your job:
1. Analyze the user's current DeFi portfolio allocations
2. Compare against optimal allocation targets (e.g. 60/30/10 rule)
3. Recommend specific rebalancing trades with amounts
4. Calculate estimated gas costs and slippage for each trade
5. Provide a clear action plan with priority order

Rules:
- Always show your math with real numbers
- Categorize urgency: CRITICAL (>20% drift), MODERATE (10-20%), MINOR (<10%)
- Include both the \"what\" (trade X for Y) and the \"why\" (reduces concentration risk)
- Format output as clean markdown with tables
- Never recommend more than 5 trades at once"
# This should match the hash from step 1
```

### Demo Talking Points for Judges

When showing Step 3b, say:

> *"Every AI agent's intelligence is hashed on-chain as an ERC-7857 iNFT. The `metadataHash` proves the system prompt hasn't been tampered with. The full intelligence payload is stored via `encryptedURI` — in production this would point to 0G decentralized storage with real encryption via `sealedKey`. Anyone can verify: decode the URI, hash it, compare to on-chain. This is a truly intelligent NFT — the intelligence IS the token."*

### Backend Verification

```bash
# Verify the agent was registered on backend
curl http://localhost:8000/agents/token-map | python -m json.tool
# Expected: { "success": true, "data": { "0": "portfolio_analyzer", "1": "yield_optimizer", "2": "risk_scorer", "3": "defi_rebalancer" } }

# Verify the agent is listed
curl http://localhost:8000/agents | python -m json.tool
# Expected: includes "DeFi Rebalancer" in the agent list

# Execute the agent directly (skip on-chain for quick test)
curl -X POST http://localhost:8000/agents/defi_rebalancer/execute -H "Content-Type: application/json" -d '{"query": "I have 70% ETH, 20% USDC, 10% LINK. Rebalance me."}' | python -m json.tool
# Expected: structured rebalancing analysis using the custom system prompt
```

---

## Step 4 — Marketplace Browse

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 4.1 | Navigate to `/marketplace` | Grid of agent cards loads | |
| 4.2 | Check agent cards display | Each card shows: name, category badge, price in OG, SVG image | |
| 4.3 | Verify prices are real (not 0 OG) | Portfolio Analyzer: 0.001 OG, Yield Optimizer: 0.001 OG, Risk Scorer: 0.0005 OG | |
| 4.4 | ADI Compliance section should NOT appear | No purple "ADI CHAIN COMPLIANCE (MODE B)" section visible | |

**Bug history:** Prices showed "0 OG" because `getAgentData` struct was parsed with numeric indexes `[0]` instead of named properties `.name`. Fixed in `useAgentData.ts`.

---

## Step 5 — Agent Detail Page

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 5.1 | Click on "Portfolio Analyzer" (token 0) | `/agent/0` page loads | |
| 5.2 | SVG image displays | Agent SVG from tokenURI renders in image container | |
| 5.3 | Agent name shows | "AgentFi Portfolio Analyzer" (from contract, not fallback) | |
| 5.4 | Description shows | "Autonomous DeFi portfolio analysis with real-time CoinGecko data" | |
| 5.5 | Price shows correctly | "0.001 OG" (not "0 OG") | |
| 5.6 | Platform fee note | "97.5% to owner - 2.5% platform fee" | |
| 5.7 | Owner address shows | Deployer address (truncated) | |
| 5.8 | ERC-7857 badge visible | Purple "ERC-7857 iNFT" badge next to name | |
| 5.9 | Metadata hash (ERC-7857) shows | Non-zero hex string under "METADATA HASH (ERC-7857)" | |
| 5.10 | Capabilities show | Tags: portfolio_analysis, token_tracking, allocation_report, etc. | |
| 5.11 | Authorization status | "Not authorized" (if Wallet A hasn't hired yet) | |
| 5.12 | ADI Compliance section NOT visible | No "ADI CHAIN COMPLIANCE (MODE B)" in permissionless mode | |
| 5.13 | Agent Reputation section visible | Hedera AFC balance/reputation card renders | |

**Bug history:** Description, capabilities, price were all empty/zero due to struct parsing bug. ADI Compliance appeared unconditionally. Both fixed.

---

## Step 6 — Switch to Wallet B

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 6.1 | Disconnect Wallet A | Wallet disconnects | |
| 6.2 | Connect **Wallet B** | Different address appears in sidebar | |
| 6.3 | Navigate to `/agent/0` | Agent detail loads, Wallet B shown as "Not authorized" | |
| 6.4 | "You own this agent" NOT shown | Wallet B is not the owner | |

---

## Step 7 — Hire & Execute Agent

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 7.1 | Type query: "Analyze a portfolio with 50% ETH, 30% USDC, 20% LINK" | Textarea accepts input | |
| 7.2 | Button shows correct price | "Hire & Execute - 0.001 OG" (not "0 OG") | |
| 7.3 | Click "Hire & Execute" | MetaMask popup: `hireAgent(0)` with `value: 0.001 OG` | |
| 7.4 | **Verify MetaMask value** | Must show ~0.001 OG (1000000000000000 wei), NOT 0 | |
| 7.5 | Confirm tx in MetaMask | Button text changes to "Confirm transaction in wallet..." then "Confirming on-chain..." | |
| 7.6 | TX confirms on-chain | Button changes to "Agent thinking..." | |
| 7.7 | TX hash link appears | Clickable link next to button: `tx: 0xabc123...` | |
| 7.8 | Click tx link | Opens 0G Explorer showing `hireAgent` event + value transfer | |
| 7.9 | Agent response loads | Markdown analysis: portfolio breakdown, risk scores, allocation advice | |
| 7.10 | "Ask another question" button appears | Reset button at bottom of response | |

**Bug history:** TX used to send `value: 0` because pricePerCall was read as 0 (struct parsing bug). Contract reverted with status 0 (failed). UI didn't show the revert error — kept showing "Confirming on-chain..." forever. Both issues fixed.

---

## Step 7b — TX Error Handling

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 7b.1 | Ask another question, click "Hire & Execute" | MetaMask popup | |
| 7b.2 | **Reject** the tx in MetaMask | Error message: "Transaction failed: User rejected..." | |
| 7b.3 | Button returns to "Hire & Execute" (idle state) | Can retry | |
| 7b.4 | If TX reverts on-chain (e.g. insufficient funds) | Error shows: "Transaction failed: [revert reason]" | |

**Bug history:** `useHireAgent` only exposed `isError` from `useWriteContract`, not from `useWaitForTransactionReceipt`. On-chain reverts were invisible. Fixed by merging receipt errors.

---

## Step 8 — Cross-Agent Collaboration

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 8.1 | On `/agent/0`, enable "Cross-agent collaboration (x402)" checkbox | Checkbox turns purple | |
| 8.2 | Type: "Analyze portfolio 40% ETH, 40% USDC, 20% HBAR and recommend yield strategies" | Query that triggers multi-agent collaboration | |
| 8.3 | Click "Hire & Execute", confirm tx | Executes with cross-agent enabled | |
| 8.4 | Wait for result | Comprehensive analysis from multiple agents | |
| 8.5 | Scroll to "x402 CROSS-AGENT COLLABORATION" section | Purple section showing agents called + AFC costs | |
| 8.6 | Scroll to "HEDERA PROOFS" section | Green section: HCS attestation links, AFC reward info | |
| 8.7 | Click HashScan links | Opens Hedera HashScan showing attestation tx | |

---

## Step 9 — Verify On-Chain State

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 9.1 | Check authorization after hire | "Authorized via ERC-7857" (green dot) on agent page | |
| 9.2 | Verify via cast | `cast call $NFT "isAuthorized(uint256,address)(bool)" 0 $WALLET_B` returns `true` | |
| 9.3 | Check marketplace listing still active | Agent still listed on marketplace | |

```bash
# Verify authorization on-chain
cast call 0xDCD2e9B068913fcF0C80ff5DA070B243Df091EFE \
  "isAuthorized(uint256,address)(bool)" 0 <WALLET_B_ADDRESS> \
  --rpc-url https://evmrpc-testnet.0g.ai

# Check listing
cast call 0x0eC3981a544C3dC6983C523860E13c2B7a66cd6e \
  "getListing(uint256)(uint256,address,uint256,bool)" 0 \
  --rpc-url https://evmrpc-testnet.0g.ai
```

---

## Step 10 — Owner Dashboard (Reconnect Wallet A)

| # | Action | Expected | Status |
|---|--------|----------|--------|
| 10.1 | Disconnect Wallet B | Wallet disconnects | |
| 10.2 | Connect **Wallet A** (agent owner) | Different address in sidebar | |
| 10.3 | Navigate to `/dashboard` | Shows owned agents with activity, no "DEMO DATA" badge | |
| 10.4 | Agent shows hire activity / earnings | Earnings from Wallet B's hire visible | |
| 10.5 | Navigate to `/agent/0` | Shows "You own this agent", button says "Execute (Free)" | |
| 10.6 | Execute as owner (free, no payment) | Should work without paying hire price | |

---

## Known Issues & Regression Checklist

### Fixed Bugs (verify no regression)

| Bug | Root Cause | Fix Location | How to Verify |
|-----|-----------|--------------|---------------|
| Mode selector reappears on navigation | `useState(null)` no persistence | `AppModeContext.tsx` — localStorage | Step 1.3-1.5 |
| Agent data empty (name, desc, caps, price) | Struct parsed with `[0]` instead of `.name` | `useAgentData.ts` — named property access | Step 5.3-5.10 |
| Price shows "0 OG" | Same as above (pricePerCall = undefined) | `useAgentData.ts` | Step 5.5, 7.2, 7.4 |
| ADI Compliance in permissionless mode | `<ADICompliance />` not guarded | `agent/[id]/page.tsx` — `{isCompliant && ...}` | Step 5.12 |
| TX revert not shown in UI | Receipt error not exposed | `useHireAgent.ts` — merged receipt error | Step 7b.4 |
| TX sends value 0 | Consequence of data parsing bug | `useAgentData.ts` | Step 7.4 |
| Dashboard shows "Connect Wallet" when connected | `!isConnected` true during reconnection | `dashboard/page.tsx` — use `accountStatus` | Step 2b.1 |
| DEMO DATA badge shows when connected | DemoBadge rendered unconditionally | `dashboard/page.tsx` — hide when connected | Step 2b.3-2b.5 |

### Edge Cases to Watch

| Case | What to check |
|------|---------------|
| Wallet not connected | Hire button disabled, no crash |
| Empty query | Hire button disabled |
| Network switch mid-flow | MetaMask prompts network switch to 0G 16602 |
| Agent that doesn't exist (e.g. `/agent/999`) | "Failed to load agent data" error message |
| Double-click hire button | Button disabled after first click (step != idle) |
| Backend down during execute | Agent error shown: "Agent execution failed" or network error |

---

## Quick Smoke Test (3 minutes)

For a fast pre-demo check, run these steps only:

1. Open site -> select Permissionless -> verify mode persists on navigation (Step 1.1-1.4)
2. Connect wallet -> go to `/dashboard` -> verify no "Connect Wallet" prompt, no "DEMO DATA" badges (Step 2b.1-2b.5)
3. Create agent: `/dashboard/create` -> fill fields with demo values (incl. system prompt) -> Mint -> List (Step 3.1-3.8)
4. Verify on-chain intelligence: `cast call $NFT getMetadataHash(3)` returns non-zero, `getEncryptedURI(3)` returns data URI (Step 3b.1-3b.2)
5. Go to `/agent/0` -> verify name, price, description, capabilities show (Step 5.1-5.10)
6. Type query -> verify button shows correct price (Step 7.1-7.2)
7. Hire & Execute -> verify MetaMask shows correct value -> confirm -> verify result loads (Step 7.3-7.9)

If all 7 pass, the demo is ready.

> **Before repeated demos:** Run `rm -f agents/dynamic_agents.json` and restart the backend to reset dynamic agent state.

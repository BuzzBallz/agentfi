# AgentFi — FUTURLLAMA Track Pitch ($2,000)

> ETHDenver 2026 | 3-minute pitch + live demo | "Most Innovative Multi-Chain Project"

---

## PITCH SCRIPT (spoken text)

### Opening — The Problem (0:00 – 0:25)

> "Today, AI agents live in silos. You have ChatGPT, you have on-chain bots, you have DeFi protocols — but none of them can discover, pay, or collaborate with each other. There's no marketplace. No payment rails. No identity layer. No way for an AI agent to hire another AI agent autonomously. We built that."

### One-liner (0:25 – 0:35)

> "AgentFi is the banking system for autonomous AI agents. We turn AI agents into tradeable on-chain assets that can be created, bought, sold, hired, and — crucially — that can hire each other across chains."

### Architecture — Why Multi-Chain (0:35 – 1:05)

> "We run on four chains, each doing what it does best.
>
> **0G Chain** — agent identity. Every agent is an ERC-7857 iNFT. Its intelligence — the system prompt, the model config — is hashed on-chain in metadataHash and stored encrypted in encryptedURI. The agent IS the NFT.
>
> **Hedera** — agent commerce. Agents earn and spend AFC tokens on HTS. Every execution is attested on HCS-10. When one agent hires another, AFC flows between their Hedera accounts with a 70/20/10 split — owner, reputation, platform.
>
> **ADI Chain** — compliance. Same agents, but KYC-gated, FATF Travel Rule payments, ERC-4337 Paymaster for gasless onboarding. Institutions use the same marketplace with regulatory rails.
>
> Four chains, one platform. Each chain provides a capability that the others can't."

### LIVE DEMO (1:05 – 2:35)

*[Switch to browser — AgentFi is open on localhost:3000]*

> "Let me show you the full loop. I'm on 0G Galileo, permissionless mode."

**Demo Action 1: Create an agent (1:05 – 1:30)**

*[Navigate to /dashboard/create, form is pre-filled]*

> "I'm creating a Hedera DeFi Advisor. It pulls live rates from SaucerSwap — Hedera's main DEX — and Bonzo Finance — Hedera's lending protocol. Real data, real protocols."

*[Toggle the x402 cross-agent switch ON]*

> "x402 cross-agent toggle — other agents on the platform can discover and hire this agent autonomously, paying in AFC on Hedera."

*[Click Mint iNFT, sign the MetaMask tx]*

> "The agent is now an ERC-7857 iNFT on 0G. Its intelligence hash is on-chain. Its encrypted prompt is in the encryptedURI. It's listed on the marketplace."

**Demo Action 2: Agent-to-agent collaboration (1:30 – 2:10)**

*[Navigate to /marketplace, click on Portfolio Analyzer (token 0)]*

> "Now let's see agent-to-agent commerce. I'm using the Portfolio Analyzer — one of our pre-deployed agents."

*[Enable "Cross-agent collaboration (x402)" toggle]*

> "Cross-agent is ON. Watch what happens."

*[Type query: "Analyze a portfolio with 40% HBAR, 30% USDC, 20% ETH, 10% SAUCE — find the best SaucerSwap LP pools and Bonzo Finance lending rates, score the risk"]*

*[Click Hire & Execute, sign tx]*

> "The Portfolio Analyzer receives my query. It realizes it needs risk scoring and yield optimization. It autonomously discovers the Risk Scorer, the Yield Optimizer, and our newly created Hedera DeFi Advisor — checks their AFC price, and pays them on Hedera. Agent-to-agent commerce, no human in the loop."

*[Result appears — scroll to cross-agent section]*

> "Three agents collaborated. The x402 report shows: Risk Scorer was paid 0.50 AFC, Yield Optimizer 1.50 AFC. Every payment split 70/20/10 — owner revenue, agent reputation, platform fee. Every execution attested on HCS."

**Demo Action 3: Compliance mode (2:10 – 2:30)**

*[Quick switch: toggle to Compliant mode]*

> "And for institutions — same agents, compliant mode on ADI Chain. KYC-gated, FATF Travel Rule metadata on every payment, ERC-4337 Paymaster for gasless onboarding. Two modes, one platform."

### Closing — Why This Matters (2:30 – 3:00)

> "We didn't build another chatbot wrapper. We built the economic infrastructure for an agent economy:
>
> - **Identity** — agents are ERC-7857 iNFTs with verifiable intelligence on 0G.
> - **Commerce** — agents hire and pay each other in AFC on Hedera, autonomously.
> - **Compliance** — institutions onboard through ADI with FATF and KYC rails.
> - **Interoperability** — four chains, each doing what it does best, orchestrated by one platform.
>
> AgentFi — the banking system for autonomous AI agents. Thank you."

---

## DEMO SETUP (run before pitch)

### Pre-pitch terminal commands

```bash
# 1. Delist any leftover test agent from previous demo
cast send 0x0eC3981a544C3dC6983C523860E13c2B7a66cd6e "delistAgent(uint256)" 5 \
  --rpc-url https://evmrpc-testnet.0g.ai \
  --private-key $DEPLOYER_PK \
  --gas-price 2500000000 --priority-gas-price 2500000000

# 2. Clear dynamic agents so the create looks fresh
rm agents/dynamic_agents.json

# 3. Start backend
cd agents && SKIP_WEB3=1 python -m uvicorn api:app --host 0.0.0.0 --port 8000

# 4. Start frontend (separate terminal)
cd frontend && pnpm dev
```

### Browser tabs to have open

1. `http://localhost:3000` — AgentFi (main)
2. `https://chainscan-galileo.0g.ai` — 0G Explorer (for mint tx)
3. `https://hashscan.io/testnet/token/0.0.7977623` — AFC token balances on Hedera

### Wallet setup

- **Wallet A** connected in MetaMask on 0G Galileo (chain 16602)
- Have enough OG for gas + hiring (~0.01 OG)

---

## AGENT TO CREATE DURING DEMO

### Form fields

| Field | Value |
|-------|-------|
| **NAME** | Hedera DeFi Advisor |
| **DESCRIPTION** | Hedera-native DeFi agent. Fetches live rates from SaucerSwap DEX and Bonzo Finance lending markets to recommend optimal LP positions and lending/borrowing strategies on Hedera. |
| **SYSTEM PROMPT** | *(see below)* |
| **CAPABILITIES** | saucerswap_lp, bonzo_lending, hedera_defi, yield_analysis |
| **PRICE PER HIRE (OG)** | 0.002 |
| **TOKEN URI** | *(leave empty — auto-generated)* |
| **x402 CROSS-AGENT** | ON (toggle enabled) |

### System Prompt (copy-paste into form)

```
You are Hedera DeFi Advisor, an autonomous DeFi intelligence agent specialized in the Hedera ecosystem.

You have live access to:
- SaucerSwap DEX: liquidity pools, APR, TVL
- Bonzo Finance: lending/borrowing markets, supply APY, borrow APY, TVL

Your job:
1. Analyze the SaucerSwap pool data to find the best LP opportunities by APR and TVL
2. Analyze Bonzo Finance markets to find the best lending rates and cheapest borrowing rates
3. Compare LP yield vs lending yield — recommend which is better for each asset
4. If the user has a portfolio, recommend specific allocations across SaucerSwap LP and Bonzo lending
5. Flag any risks: impermanent loss for volatile pairs, low TVL pools, high borrow rates

Output format:
- Start with a summary table of top 3 SaucerSwap pools by APR
- Then a summary table of Bonzo markets with supply vs borrow APY
- Then your recommendation with specific percentages
- Always include the source (SaucerSwap or Bonzo Finance) next to each number
- Use clean markdown tables
```

### Token URI (leave empty — auto-generated from name)

---

## DEMO FLOW — MINUTE-BY-MINUTE

| Time | Action | Screen | What you say |
|------|--------|--------|--------------|
| 0:00 | Stand, face judges | — | **Opening: The Problem** (spoken above) |
| 0:25 | — | — | **One-liner** (spoken above) |
| 0:35 | — | — | **Architecture: Why Multi-Chain** (spoken above) |
| 1:05 | Open browser, navigate to `/dashboard/create` | Create agent form | "Let me show you the full loop." |
| 1:10 | Form is pre-filled with Hedera DeFi Advisor data | Filled form visible | "I'm creating a Hedera DeFi Advisor. It pulls live data from SaucerSwap and Bonzo Finance — real Hedera DeFi protocols." |
| 1:18 | **Toggle x402 cross-agent ON** | Purple toggle switches | "x402 cross-agent toggle — other agents can now discover and hire this agent, paying in AFC on Hedera." |
| 1:22 | Click **Mint iNFT**, sign MetaMask tx | MetaMask popup → confirming | "Minting as an ERC-7857 iNFT on 0G. Intelligence hashed on-chain." |
| 1:30 | Tx confirms, auto-registers on backend | "iNFT Minted Successfully" screen | "Listed on the marketplace. Now let's see agent-to-agent commerce." |
| 1:35 | Navigate to `/marketplace` | Marketplace with 4+ agents | "Four agents available. Let's use Portfolio Analyzer." |
| 1:40 | Click **Portfolio Analyzer** | Agent detail page | — |
| 1:43 | **Enable cross-agent toggle** | Purple toggle | "Cross-agent ON. This agent can hire others autonomously." |
| 1:48 | Type query (pre-copied, paste it) | Query textarea | "This query needs portfolio analysis, risk scoring, yield optimization, AND live Hedera DeFi rates. One agent can't do it all." |
| 1:55 | Click **Hire & Execute**, sign tx | MetaMask → executing | "While we wait — the Portfolio Analyzer is discovering which agents to hire, checking their AFC price, and paying them on Hedera. No human involved." |
| 2:15 | Result appears | Full analysis with cross-agent insights | "Three agents collaborated." |
| 2:20 | **Scroll to x402 cross-agent report** | Purple section: agents paid, AFC amounts | "Proof: Risk Scorer paid 0.50 AFC, Yield Optimizer 1.50 AFC. 70/20/10 split — owner, reputation, platform." |
| 2:30 | Quick: toggle to **Compliant mode** | Mode switches | "And for institutions — same agents, ADI Chain. KYC, FATF Travel Rule, gasless. Two modes, one platform." |
| 2:35 | Face judges | — | **Closing** (spoken above) |
| 3:00 | Done | — | — |

### Query to paste during demo

```
Analyze a portfolio with 40% HBAR, 30% USDC, 20% ETH, 10% SAUCE — find the best SaucerSwap LP pools and Bonzo Finance lending rates, score the risk
```

---

## QUESTIONS TO PREPARE FOR (Q&A)

### Technical

**Q: Why four chains instead of one?**
> "Each chain provides a capability the others can't. 0G gives us the iNFT standard — ERC-7857 — which is native to their chain. Hedera gives us HCS for immutable attestation and HTS for fungible token transfers with sub-second finality — perfect for micropayments between agents. ADI gives us built-in compliance infrastructure — KYC, Travel Rule, Paymaster — that doesn't exist on general-purpose L1s. We're not splitting for the sake of splitting. Each chain is purpose-fit."

**Q: How does the agent intelligence stay secure if it's on-chain?**
> "The system prompt is stored in the ERC-7857 encryptedURI field — it's encrypted, not plaintext. What's visible on-chain is the metadataHash — a keccak256 hash of the agent's name, description, capabilities, and prompt. Anyone can verify the hash matches, but you can't reverse-engineer the prompt from the hash. The encrypted payload is only decrypted server-side when the agent executes."

**Q: What happens if an agent doesn't have enough AFC to hire another agent?**
> "The cross-agent service checks the caller's AFC balance on Hedera Mirror Node before each call. If the balance is insufficient, it falls back to a self-computed approximation — a simplified version of what the target agent would have returned. The report transparently shows 'insufficient_funds' with the amount needed vs. available. As the agent earns more AFC from being hired, it can afford better collaboration."

**Q: Is the x402 protocol real or simulated?**
> "The x402 discovery endpoint is real — every agent exposes `/agents/{id}/x402` with its AFC and USDT pricing. The inter-agent AFC payment flow on Hedera is real — we use the Hedera Token Service to transfer AFC between agent accounts. The USDT settlement on KiteAI chain goes through Pieverse as the facilitator. For the demo, if web3 libraries are unavailable, we fall back to a mock payment service that logs the same flow structure."

**Q: How do you prevent agents from spamming each other?**
> "Two mechanisms. First, every cross-agent call costs AFC — economic cost prevents spam. Second, each agent has a `max_budget_afc` parameter that caps how much it can spend per execution. The Portfolio Analyzer has a 5 AFC budget — once it's spent, no more inter-agent calls for that execution. Owners set the budget when configuring their agent."

### Business / Product

**Q: What's the revenue model?**
> "Three revenue streams. First, marketplace fees — 2.5% platform fee on every hire transaction on 0G. Second, AFC platform split — 10% of every inter-agent AFC payment goes to the platform. Third, compliance fees on ADI Chain. Agent owners earn 70% of inter-agent payments plus 97.5% of direct hire payments. The incentive is to create high-quality, specialized agents that others want to hire."

**Q: Who is the target user?**
> "Two sides. Agent creators are AI developers and DeFi protocols who want to monetize their intelligence as a service. Agent consumers are DeFi users, DAOs, and institutions who need specialized AI analysis without building their own models. The permissionless/compliant split lets us serve both DeFi degens and institutional clients with the same infrastructure."

**Q: What's the roadmap beyond the hackathon?**
> "Three priorities. First, agent memory — persistent state between sessions so agents learn and improve. Second, 0G Compute integration for decentralized inference — right now the AI runs on our backend, but the architecture is designed for decentralized execution. Third, mainnet deployment with real token economics — AFC becomes a real asset with staking and governance."

**Q: How is this different from existing AI agent platforms?**
> "Most platforms are either purely off-chain — just API wrappers — or purely on-chain with no real intelligence. We bridge both: the agent's identity and economics are fully on-chain (ERC-7857 iNFT, AFC payments, HCS attestation), but the intelligence executes off-chain with real AI models. The key differentiator is agent-to-agent commerce — agents autonomously hiring and paying each other. That doesn't exist anywhere else."

**Q: Why ERC-7857 instead of a regular NFT?**
> "ERC-7857 is the intelligent NFT standard. It has two critical fields regular NFTs don't: `metadataHash` for verifiable intelligence fingerprinting, and `encryptedURI` for storing the actual intelligence payload. When you transfer an ERC-7857 iNFT, the intelligence transfers with it — the new owner gets a working AI agent, not just a JPEG. It also supports `authorizeUsage()` — letting the owner grant temporary execution rights without transferring ownership. That's how our hire mechanism works."

### Edge Cases

**Q: What if Hedera or 0G goes down during execution?**
> "Every chain interaction has a local fallback. If Hedera is down, MockAFCPaymentService simulates the payment flow — the user still gets the cross-agent result, and the report shows 'simulated'. If 0G RPC is slow, we cache the last known authorization status. The rule is: the demo never breaks. We degrade gracefully."

**Q: Can a malicious agent drain another agent's AFC?**
> "No. The caller agent controls its own budget via `max_budget_afc`. The cross-agent service checks the caller's balance and budget before every payment. An agent can only spend its own AFC, never another agent's. And the 70/20/10 split means even if an agent is called repeatedly, 20% goes to its reputation pool — building the agent's value."

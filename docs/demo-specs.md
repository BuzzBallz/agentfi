# AgentFi — Demo Specs per Sponsor

> ETHDenver 2026 | Feb 18-21 | 4 separate pitches, ~6 min each, live demo + video fallback

## Universal Setup (All Demos)

### Mode Toggle (Before Wallet Connect)

Every demo starts with a **mode selector screen** shown BEFORE the user connects their wallet.
The mode determines which chain the wallet connects to.

```
+-----------------------------------------------+
|                                               |
|          Welcome to AgentFi                   |
|   The banking system for autonomous AI agents |
|                                               |
|   Choose your mode:                           |
|                                               |
|   [ Permissionless ]     [ Compliant ]        |
|     0G Galileo             ADI Testnet        |
|     Pay in OG              Pay in ADI         |
|     No KYC                 KYC required       |
|                                               |
+-----------------------------------------------+
```

- **Permissionless** -> connects wallet to 0G Galileo (chain 16602)
- **Compliant** -> connects wallet to ADI Testnet (chain 99999)
- For 0G, Hedera, KiteAI demos: select **Permissionless**
- For ADI demo: select **Compliant**

### Wallets

| Wallet | Role | Used in |
|--------|------|---------|
| Deployer | Contract owner, can mint agents | Pre-demo setup |
| Wallet A | Agent creator/owner (public mint) | 0G demo Step 1 |
| Wallet B | Agent consumer/hirer | All demos |

### Token Names

- 0G Galileo native token: **OG** (not A0GI)
- ADI Testnet native token: **ADI**
- Hedera AFC token: **AFC**
- KiteAI USDT: **USDT**

---

## Demo 1: 0G Labs ($14k)

**Prizes:** Best DeFAI Application ($7k) + Best Use of On-Chain Agent / iNFT ($7k)

**Narrative hook (30s):**
> "AgentFi turns AI agents into tradeable on-chain assets. Each agent is an ERC-7857 iNFT with encrypted intelligence stored on 0G. Owners earn revenue when others hire their agents. It's the App Store for autonomous AI -- built on 0G."

**What 0G judges care about:** ERC-7857 usage, 0G Chain integration, DeFAI innovation, iNFT as an economic primitive.

### Demo Flow

| Time | Action | What judge sees | What you say |
|------|--------|-----------------|--------------|
| 0:00 | Open AgentFi. Select **Permissionless** mode. Connect Wallet A. | Mode selector -> wallet connects on 0G Galileo | "This is AgentFi, running on 0G Galileo testnet. Permissionless mode." |
| 0:30 | Navigate to `/dashboard` | Empty dashboard -- no agents owned | "Wallet A has no agents yet. Let's create one." |
| 0:45 | Click "Create & Mint New Agent" -> fill form | Create form: name, description, capabilities, price, metadata | "We're creating a DeFi Portfolio Analyzer. The intelligence -- model prompt, capabilities -- gets encrypted and stored as ERC-7857 metadata." |
| 1:30 | Submit -> sign mint tx | MetaMask popup -> tx confirming -> tx hash link | "The agent is now an iNFT on 0G. Here's the tx on Galileo Explorer." |
| 2:00 | Click tx link -> show 0G Explorer | Explorer: mint event, token ID, metadata hash | "The metadata hash proves the intelligence is encrypted on-chain. This is ERC-7857 -- the iNFT standard." |
| 2:20 | Navigate back to `/dashboard` | New agent appears with SVG image | "Minted and listed. Now let's see it as a consumer." |
| 2:40 | **Disconnect Wallet A. Connect Wallet B.** | Different wallet address | "Completely different user -- a consumer." |
| 3:00 | Navigate to `/marketplace` | 4+ agents with images, prices in OG, categories | "The marketplace shows all available agents. Prices are in OG." |
| 3:20 | Click "Portfolio Analyzer" | Agent detail: SVG, ERC-7857 badge, metadata hash, price, authorization status | "Notice the ERC-7857 metadata hash -- proving encrypted intelligence. Wallet B is not authorized yet." |
| 3:50 | Type query: "Analyze a portfolio with 50% ETH, 30% USDC, 20% LINK" | Query textarea filled | "Let's hire this agent." |
| 4:00 | Click "Hire & Execute" -> sign tx | MetaMask -> confirming -> executing -> result | "Wallet B pays in OG. The contract calls authorizeUsage() -- the backend verifies authorization on-chain before executing." |
| 4:30 | Show agent result | Markdown DeFi analysis: risk scores, allocation advice | "Real DeFi data -- yields from DeFi Llama, risk calculations, protocol research." |
| 5:00 | Scroll to proofs section | Hedera HCS attestation, AFC reward, cross-agent report | "Every execution is attested on Hedera and earns AFC reputation tokens." |
| 5:20 | Click 0G Explorer link for hire tx | Explorer: hireAgent event, value transferred, authorization | "Hiring payment and authorization -- all verifiable on 0G." |
| 5:40 | **Reconnect Wallet A** -> `/dashboard` | Dashboard shows agent with hire activity | "Back as owner. Earnings from Wallet B's hire are already in Wallet A's balance -- direct settlement, no escrow." |
| 6:00 | **Wrap-up** | -- | "AgentFi: AI agents as ERC-7857 iNFTs on 0G. Create, trade, and monetize intelligence on-chain." |

### Key Proof Points for 0G Judges
- ERC-7857 metadata hash visible on agent detail page
- `isAuthorized()` on-chain verification (no spoofable headers)
- SVG images stored on-chain via tokenURI
- Marketplace economics: 97.5% to owner, 2.5% platform fee
- Real DeFi data in agent responses (DeFi Llama, CoinGecko APIs)

### Fallback
- Mint fails -> show pre-seeded agents, skip Step 1, focus on marketplace
- Execution hangs -> show cached result screenshot
- 0G RPC slow -> narrate while waiting, show explorer links from previous run

---

## Demo 2: Hedera ($10k)

**Prize:** Killer App for the Agentic Society / OpenClaw ($10k)

**Narrative hook (30s):**
> "In AgentFi, AI agents don't just serve humans -- they hire and pay each other. When you ask one agent a question, it autonomously discovers, pays, and collaborates with other agents using AFC tokens on Hedera. Every interaction is attested on HCS. This is autonomous agent commerce."

**What Hedera judges care about:** Autonomous multi-agent coordination, Hedera services (HCS, HTS), real value exchange between agents, OpenClaw compatibility.

### Demo Flow

| Time | Action | What judge sees | What you say |
|------|--------|-----------------|--------------|
| 0:00 | Open AgentFi. Select **Permissionless** mode. Connect wallet. | Connected on 0G Galileo | "AgentFi is a marketplace of AI agents. Each is an iNFT. But the magic is what happens between agents -- on Hedera." |
| 0:30 | Navigate to `/marketplace` | 3 agents: Portfolio Analyzer, Yield Optimizer, Risk Scorer | "These agents have different specialties. They can hire each other via x402, paying in AFC tokens on Hedera." |
| 0:50 | Click "Portfolio Analyzer" | Agent detail page | "Let's use the Portfolio Analyzer. Notice the cross-agent toggle." |
| 1:10 | **Enable "Cross-agent collaboration (x402)" toggle** | Checkbox turns purple | "When enabled, this agent can autonomously hire other agents and pay them in AFC." |
| 1:20 | Type: "Analyze my portfolio: 40% ETH, 40% USDC, 20% HBAR -- recommend yield strategies and score the risk" | Query needs all 3 agents | "This query needs portfolio analysis, yield optimization, AND risk scoring. One agent can't do it all -- so it hires the others." |
| 1:40 | Click "Hire & Execute" -> sign tx | MetaMask -> confirming -> executing (~10-15s) | "While we wait: the Portfolio Analyzer is calling the Risk Scorer and Yield Optimizer via x402. Each costs AFC -- paid autonomously on Hedera, with a 70/20/10 split: owner, reputation, platform." |
| 2:30 | Result appears | Comprehensive analysis from all 3 agents | "Three agents collaborated autonomously." |
| 2:50 | **Scroll to x402 CROSS-AGENT section** | Purple section: Risk Scorer paid 0.50 AFC, Yield Optimizer paid 1.50 AFC | "Proof: Portfolio Analyzer paid 0.50 AFC to Risk Scorer and 1.50 AFC to Yield Optimizer. All on Hedera." |
| 3:20 | **Scroll to HEDERA PROOFS section** | Green section: HCS attestation links, AFC rewards | "Every execution attested on HCS. Let's verify." |
| 3:40 | **Click HashScan link for HCS attestation** | HashScan: HCS message, timestamp, topic ID | "Immutable proof on Hedera: this agent executed at this time with this result hash." |
| 4:10 | **Open HashScan for AFC token** (pre-loaded tab) | AFC token balances for all 3 agent accounts | "Each agent has an AFC balance on Hedera. Portfolio Analyzer decreased, others increased. Autonomous commerce." |
| 4:40 | Navigate to `/hedera/status` endpoint or show in UI | JSON: enabled, network, token_id, registered agents, topic IDs | "All 3 agents registered on Hedera with HCS-10 inbound/outbound topics." |
| 5:10 | **Point to payment split** | "70% owner / 20% agent reputation / 10% platform" | "AFC economy incentivizes quality: agents hired more earn more reputation. Owners get 70% of inter-agent payments." |
| 5:30 | **Wrap-up** | -- | "AgentFi: a society of autonomous agents that discover, hire, and pay each other on Hedera. HCS-attested, AFC-powered. The agentic economy." |

### Key Proof Points for Hedera Judges
- Agents autonomously paying each other (agent decides, not human)
- AFC token on HTS (real token, real balances visible on HashScan)
- HCS-10 attestation of every execution
- Cross-agent discovery via recommendation mapping
- 70/20/10 payment split = agent reputation economy
- 3 agents with inbound/outbound HCS topics

### Fallback
- Hedera down -> MockAFCPaymentService still runs flow, show report as "simulated"
- Pre-screenshot HashScan pages as backup slides

---

## Demo 3: KiteAI ($10k)

**Prize:** Agent-Native Payments & Identity on Kite AI / x402-Powered ($10k)

**Narrative hook (30s):**
> "AgentFi implements x402 -- the HTTP 402 payment protocol -- so any agent on the internet can pay to use our agents. No frontend needed. No account needed. Just send a payment header and get intelligence back. Dual rails: USDT on KiteAI, AFC on Hedera."

**What KiteAI judges care about:** x402 protocol implementation, agent payments infra, agent identity, KiteAI chain integration.

**Format: Terminal + UI side-by-side.** KiteAI judges want the protocol, not just a UI.

### Demo Flow

| Time | Action | What judge sees | What you say |
|------|--------|-----------------|--------------|
| 0:00 | **Open terminal** (side by side with browser) | Terminal + browser | "Let me show x402 from the protocol level first, then the UI." |
| 0:20 | `curl -X POST localhost:8000/agents/portfolio_analyzer/execute -H "Content-Type: application/json" -d '{"query":"analyze ETH"}'` | **402 Payment Required** with `accepts` array | "No payment, 402. The response tells the client exactly how to pay. Two options: USDT on KiteAI chain 2368, or AFC on Hedera." |
| 0:50 | **Highlight 402 response** | JSON: scheme, network eip155:2368, asset (USDT), maxAmountRequired, payTo | "Standard x402. Any compatible client -- another AI agent, a script, a wallet -- can parse this and pay." |
| 1:20 | `curl` with `X-PAYMENT` header (base64 USDT payment) | **200 OK** with result + `X-PAYMENT-RESPONSE` header | "x402 payment header sent. Backend verifies via Pieverse facilitator, executes, settles. One HTTP round-trip." |
| 1:50 | **Highlight settlement** | X-PAYMENT-RESPONSE header | "Verify -> execute -> settle. Pieverse handles USDT settlement on KiteAI chain." |
| 2:20 | Show KiteScan for USDT tx (pre-loaded tab) | KiteScan: payment transaction | "Verifiable on KiteScan. 0.01 USDT for one agent call." |
| 2:40 | **Switch to browser**. Select **Permissionless** mode. Connect wallet. | AgentFi marketplace | "Same protocol, through our UI. Frontend abstracts x402 for end users." |
| 3:00 | Go to agent detail page | Agent page with x402 info | "Users can also pay via 0G marketplace -- backend checks on-chain authorization instead of payment header." |
| 3:20 | Click agent's `/x402` info endpoint | x402 discovery: AFC pricing + USDT pricing + split | "Every agent exposes x402 pricing. External agents discover and pay programmatically." |
| 3:40 | **Enable cross-agent toggle** + execute | Hire & execute with collaboration | "Yield Optimizer needs Risk Scorer -- pays via x402 internally with AFC on Hedera. Agent-to-agent commerce." |
| 4:20 | Show result with x402 report | Purple section: agents called, AFC costs | "Two agents collaborated. x402 handled payment between them -- no human involved." |
| 4:50 | **Back to terminal**: `/agents/portfolio_analyzer/x402` | JSON: full pricing, both rails | "Any AI agent on the internet can discover, check pricing, and pay. x402 infrastructure." |
| 5:20 | **Wrap-up** | -- | "AgentFi: x402 payment infrastructure for AI agents. Dual rails -- USDT on KiteAI, AFC on Hedera. Discoverable, payable, settleable via HTTP 402." |

### Key Proof Points for KiteAI Judges
- Real 402 responses with proper `accepts` schema
- Pieverse facilitator verify + settle (real, not mocked)
- USDT on KiteAI chain 2368
- Agent identity = iNFT tokenId (on-chain identity = x402 resource identity)
- Dual payment rails: USDT + AFC
- Terminal demo = real protocol, not UI gimmick

### Fallback
- Pre-record curl session as replayable script
- Pieverse down -> show 402 response structure + explain with diagram

---

## Demo 4: ADI Foundation ($25k)

**Prizes:** Open Project ($19k) + ERC-4337 Paymaster Devtools ($3k) + ADI Payments Component for Merchants ($3k)

**Narrative hook (30s):**
> "AgentFi has two modes: permissionless for DeFi degens, and compliant for institutions. In compliant mode, every AI agent interaction is KYC-gated, payments follow FATF Travel Rule, gas is sponsored by an ERC-4337 Paymaster, and execution receipts are written back to ADI Chain. Same agents, institutional-grade rails."

**What ADI judges care about:** ADI Chain usage, compliance infra, ERC-4337 Paymaster, merchant payments, institutional narrative.

### Demo Flow

| Time | Action | What judge sees | What you say |
|------|--------|-----------------|--------------|
| 0:00 | Open AgentFi -- **NOT connected yet** | Mode selector screen | "AgentFi supports two modes. Let me show compliant mode -- built for institutions on ADI Chain." |
| 0:20 | **Select "Compliant" mode** | Mode switches, visual indicator changes (accent color/badge) | "Compliant mode connects to ADI Chain. KYC required, FATF Travel Rule payments, gas sponsored." |
| 0:40 | **Connect wallet** | MetaMask connects on ADI Testnet (chain 99999) | "We're on ADI Testnet. Let's verify KYC." |
| 1:00 | **KYC gate appears** | Banner: "Verification Required" with "Complete KYC" button | "Institutions complete KYC before accessing agents. For demo, mock verification." |
| 1:15 | Click "Complete KYC" -> instant verification | Green checkmark: "KYC Verified -- UAE, Enhanced Tier" | "Verified. Contract records: jurisdiction, KYC tier, compliance hash." |
| 1:30 | **Show ADI Explorer** -- UserVerified event | Explorer: KYC verification tx | "On-chain proof of verification. Auditable by regulators." |
| 1:50 | Navigate to `/marketplace` | Same agents, prices in ADI | "Same marketplace, same agents -- but payments go through ADI compliance rails." |
| 2:10 | Click "Portfolio Analyzer" | Agent detail with compliance badges | "Compliance mode shows KYC status, jurisdiction, Travel Rule indicator." |
| 2:30 | Type: "Analyze institutional portfolio: 60% BTC, 30% ETH, 10% stablecoins" | Query filled | -- |
| 2:40 | Click "Hire & Execute (Compliant)" -> sign tx | MetaMask on ADI Chain | "Payment goes to ADIAgentPayments. Records full FATF metadata: originator, jurisdiction, KYC tier, purpose, beneficiary." |
| 3:10 | **Point out: gas was sponsored** | MetaMask shows gas = 0 or very low | "Gas sponsored by our ERC-4337 Paymaster. KYC-verified users get free gas -- reducing institutional friction." |
| 3:30 | Show ADI Explorer for payment tx | PaymentRecord: originator, jurisdiction UAE, KYC tier 2, purpose, status PENDING | "Full FATF Travel Rule compliance on-chain. Originator, jurisdiction, purpose of payment." |
| 4:00 | Agent executes -> result | Same AI analysis as permissionless | "Same intelligence, same quality -- institutional-grade rails." |
| 4:20 | **Scroll to compliance section** | "COMPLIANCE -- Mode B": KYC verified, jurisdiction, ADI receipt tx, Travel Rule recorded, Hedera proof link | "Backend wrote execution receipt back to ADI -- linking payment to Hedera attestation and execution hash. Complete audit trail." |
| 4:50 | **Click ADI Explorer for receipt** | Updated PaymentRecord: COMPLETED, executionHash, hederaTopicId | "PENDING -> COMPLETED. Execution hash and Hedera topic on-chain. Any auditor can verify." |
| 5:20 | **Show compliance dashboard** | Stats: KYC users, payments, volume in ADI, services | "Compliance dashboard for institutional oversight. All on ADI Chain." |
| 5:40 | **Quick switch**: toggle to "Permissionless" | Mode switches to 0G | "For DeFi community -- same agents, permissionless on 0G. No KYC, pay in OG. Two modes, one platform." |
| 6:00 | **Wrap-up -- hit all 3 prizes** | -- | "FATF-compliant payments on ADI. ERC-4337 Paymaster for gas sponsorship. Payment infrastructure for institutions to adopt AI agents. Thank you." |

### Key Proof Points for ADI Judges
- **Open Project ($19k):** Full AI agent marketplace with compliance on ADI
- **ERC-4337 Paymaster ($3k):** Gas = 0 in MetaMask for KYC users
- **Payments Component ($3k):** FATF Travel Rule metadata in every PaymentRecord on Explorer
- Dual-mode architecture as product differentiator
- Receipt linking ADI payment -> Hedera proof -> execution hash
- Compliance dashboard for institutional oversight

### Fallback
- ADI RPC slow -> MockADIComplianceService (shows "Mock" badge, flow identical)
- Paymaster fails -> skip "gas sponsored" claim, payment still works
- Pre-screenshot ADI Explorer pages

---

## Cross-Demo Summary

| Sponsor | Duration | Format | Mode | Core narrative | Unique element |
|---------|----------|--------|------|---------------|----------------|
| **0G** ($14k) | 6 min | Live UI | Permissionless | iNFT marketplace + ERC-7857 | Agent creation + mint + marketplace economics |
| **Hedera** ($10k) | 5.5 min | Live UI | Permissionless | Autonomous agent commerce | Cross-agent AFC payments on HashScan |
| **KiteAI** ($10k) | 5.5 min | Terminal + UI | Permissionless | x402 protocol infrastructure | curl 402 -> pay -> settle flow |
| **ADI** ($25k) | 6.5 min | Live UI | Compliant | Institutional compliance rails | Mode toggle + FATF Travel Rule + Paymaster |

### Shared Foundation
- Same 3 agents (Portfolio Analyzer, Yield Optimizer, Risk Scorer)
- Same marketplace UI
- Same AI execution backend
- Different narrative emphasis per sponsor
- Mode selector before wallet connect in ALL demos

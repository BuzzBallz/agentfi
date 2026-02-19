# Hedera Integration Plan — AgentFi

Target: **Hedera Killer App (OpenClaw) bounty — $10,000**

---

## SDK & Packages

### 1. Hedera Agent Kit (Python) — core Hedera interactions
- **Repo:** https://github.com/hashgraph/hedera-agent-kit-py
- **PyPI:** `hedera-agent-kit` (already in requirements.txt)
- **Install:** `pip install hedera-agent-kit langchain langchain-openai langgraph python-dotenv`
- **What it does:** Plugin-based toolkit for HTS token creation, HBAR transfers, HCS topic management, account queries. Integrates with LangChain.
- **Status:** Actively maintained (last release Feb 2026). Python SDK announced Jan 2026.

### 2. HOL Standards SDK (TypeScript) — agent registration + HCS-10 messaging
- **npm:** `@hashgraphonline/standards-sdk` (v0.1.145)
- **Install:** `pnpm add @hashgraphonline/standards-sdk`
- **What it does:** HCS-10 agent registration, messaging, topic management, HCS-11 profiles.
- **Important:** This is a **TypeScript/Node.js** package. No Python equivalent exists.
- **Decision needed:** We need a small Node.js script or sidecar for agent registration. See Architecture Decision below.

### 3. HOL Standards Agent Kit (TypeScript) — higher-level agent tools
- **npm:** `@hashgraphonline/standards-agent-kit`
- **What it does:** Wraps standards-sdk with LangChain-compatible tools (RegisterAgentTool, FindRegistrationsTool, HCS10Builder).
- **Useful for:** Agent registration, connection management, message sending.

---

## Authentication

### How to create a Hedera testnet account
1. Go to https://portal.hedera.com/register/
2. Confirm email, log in
3. Select **Testnet** from the network dropdown
4. Click **"Create Account"** (uses ED25519 keys by default)
5. Copy the **Account ID** (format: `0.0.XXXXXX`) and **DER-encoded private key**
6. Testnet accounts get up to **1,000 HBAR every 24 hours** (free refills)

### Required env vars
```bash
# In .env (root)
HEDERA_ACCOUNT_ID=0.0.XXXXXX
HEDERA_PRIVATE_KEY=302e020100300506...  # DER-encoded ED25519 key

# In agents/.env
ACCOUNT_ID=0.0.XXXXXX       # hedera-agent-kit uses these names
PRIVATE_KEY=302e020100...
```

---

## Integration Steps (ordered by priority)

### 1. HTS Token Creation — "AGENTFI" fungible token
**Goal:** Create a fungible HTS token that agents earn when hired (judges check for HTS usage).

**Approach:** Use `hedera-agent-kit-py` Core Token Plugin.

```python
from hedera_agent_kit.plugins import core_token_plugin, core_token_plugin_tool_names
# CREATE_FUNGIBLE_TOKEN_TOOL creates a token via natural language or direct params
# Token: name="AgentFi Credits", symbol="AFC", decimals=2, initialSupply=100000
```

Or via the Hedera Python SDK directly:
```python
from hiero_sdk_python import Client, Network, AccountId, PrivateKey, TokenCreateTransaction

client = Client(Network(network="testnet"))
client.set_operator(account_id, private_key)

tx = TokenCreateTransaction()
tx.set_token_name("AgentFi Credits")
tx.set_token_symbol("AFC")
tx.set_decimals(2)
tx.set_initial_supply(100_000)  # 1,000.00 AFC
tx.set_treasury_account_id(account_id)
receipt = tx.execute(client).get_receipt(client)
token_id = receipt.token_id
```

**Design:** One shared token for the marketplace. Agents earn AFC tokens per hire. This is simpler and more demo-friendly than one token per agent.

**Estimated effort:** 2h (create token, write helper, test on testnet)

---

### 2. Agent Registration via HOL Standards SDK (HCS-10)
**Goal:** Register our 3 agents on the Hedera registry so they're discoverable. Judges specifically require "agents reachable via HCS-10" and "registered via HOL Standards SDK."

**Approach:** Small Node.js registration script using `@hashgraphonline/standards-sdk`.

```typescript
import { HCS10Client, AgentBuilder, AIAgentCapability } from '@hashgraphonline/standards-sdk';

const client = new HCS10Client({
  network: 'testnet',
  operatorId: process.env.HEDERA_ACCOUNT_ID,
  operatorPrivateKey: process.env.HEDERA_PRIVATE_KEY,
  logLevel: 'info',
});

// Register Portfolio Analyzer
const agent = new AgentBuilder()
  .setName('Portfolio Analyzer')
  .setDescription('DeFi portfolio analysis agent — allocation tracking, concentration risk')
  .setAgentType('autonomous')
  .setCapabilities([AIAgentCapability.TEXT_GENERATION, AIAgentCapability.KNOWLEDGE_RETRIEVAL])
  .setModel('gpt-4o-mini')
  .setNetwork('testnet');

const result = await client.createAndRegisterAgent(agent);
console.log('Inbound Topic:', result.inboundTopicId);
console.log('Outbound Topic:', result.outboundTopicId);
```

**What metadata is required:**
- name, description, agentType ('manual' | 'autonomous')
- capabilities (from AIAgentCapability enum)
- model (optional, for display)
- network ('testnet')

**Estimated effort:** 3h (setup Node.js script, register 3 agents, save topic IDs)

---

### 3. HCS-10 Messaging — Agent Communication
**Goal:** Demonstrate that agents can be reached via HCS-10 protocol (hard requirement).

**HCS-10 message format:**
```json
{
  "p": "hcs-10",
  "op": "message",         // "connection_request" | "connection_created" | "message"
  "data": "user query text here",
  "operator_id": "topicId@accountId",
  "m": "Optional memo"
}
```

**Connection workflow:**
1. Agent registers → gets inbound + outbound topics
2. User (or another agent) sends `connection_request` to agent's inbound topic
3. Agent creates a private Connection Topic
4. Agent responds with `connection_created` to user's inbound topic
5. Both exchange `message` ops on the Connection Topic

**Implementation:** Wrap the HCS-10 flow in a Python adapter that:
- Receives a query from the FastAPI endpoint
- Submits an HCS-10 message to the agent's inbound topic (via Hedera SDK)
- Waits for response on the connection topic
- Returns the result

**For demo purposes:** We can simplify — submit the user query as an HCS-10 message, let our backend agent process it via the existing orchestrator, and submit the response back as an HCS-10 message. The on-chain message trail is what judges check.

**Estimated effort:** 4h (connection setup, message adapter, test roundtrip)

---

### 4. Natural Language Interface
**Status:** Already covered by our orchestrator (GPT-4o-mini router).

**What Hedera judges specifically want to see:**
- Users interacting with agents via natural language (not raw API calls)
- The frontend chat/input box sending queries → orchestrator → agent response
- This is already our core flow. No extra work needed.

**What to highlight in the demo:**
- "Users type natural language queries in the AgentFi marketplace"
- "The orchestrator routes to the right agent(s) using GPT-4o-mini planning"
- "Results are returned in natural language with DeFi-specific insights"

**Estimated effort:** 0h (already implemented)

---

### 5. On-Chain Attestations for Agent Identity
**Goal:** Prove agent identity and trust on Hedera (judges check for this).

**Approach:** Use HCS-11 Profile Standard (part of HOL SDK). Each registered agent gets:
- A Profile Topic containing its metadata (name, capabilities, model)
- An inbound/outbound topic pair serving as its identity anchor
- The registration in the HCS-2 registry topic = on-chain attestation

**Additional attestation option:** After each agent execution, submit a HCS message with a hash of the result — creates an immutable audit trail of agent activity.

**Estimated effort:** 1h (attestation messages after agent execution, integrated into orchestrator)

---

## What Can Be Mocked

| Feature | Mock OK? | Rationale |
|---------|----------|-----------|
| HTS token transfers per-hire | Partially | Create real token, but can mock per-hire transfers in demo if timing is tight. Judges want to see the token EXISTS on HTS. |
| HCS-10 full bidirectional messaging | Yes | Show message submission on-chain. Full async polling can be simplified. |
| UCP (Universal Commerce Protocol) | Yes | Bonus points only. Mention it in pitch, mock the format. |
| Agent-to-agent autonomous payments | Yes | Frame it as "future roadmap." |

| Feature | MUST be real | Rationale |
|---------|-------------|-----------|
| HTS token creation | Yes | Judges will check TokenID on testnet explorer |
| Agent registration (HOL SDK) | Yes | Judges will check the HCS-2 registry |
| HCS-10 message on-chain | Yes | At least one message per agent must be visible on Hedera explorer |
| Natural language interface | Yes | This is our existing frontend — already real |
| Demo video on YouTube | Yes | Submission rejected without it |
| Pitch deck PDF | Yes | Required for the bounty submission |

---

## Architecture Decision

### Where does Hedera code live?

```
agents/
├── hedera/                     # NEW — all Hedera integration code
│   ├── __init__.py
│   ├── hts_service.py          # HTS token creation + transfers
│   ├── hcs_messaging.py        # HCS-10 message adapter (submit/read)
│   ├── attestation.py          # On-chain attestation after execution
│   └── config.py               # Hedera client setup, env loading
├── agents/
│   ├── orchestrator.py         # MODIFIED — add hedera hooks (post-execution)
│   └── ...                     # UNCHANGED — existing agents untouched
└── api.py                      # MODIFIED — add /hedera/* endpoints

scripts/
└── hedera/
    ├── register-agents.ts      # Node.js script — HOL SDK agent registration
    ├── create-token.ts         # Node.js script — HTS token creation (alternative)
    └── package.json            # Minimal deps: @hashgraphonline/standards-sdk
```

### Does it modify existing agent code?
**No.** The 3 existing agents (portfolio_analyzer, yield_optimizer, risk_scorer) remain untouched. Hedera integration hooks into the orchestrator as a post-execution step:

```python
# In orchestrator.py — after agent.execute():
result = await agent.execute(agent_input)

# NEW: Submit attestation to Hedera (non-blocking, like payment)
try:
    await hedera_attestation.submit(agent_name, result_hash, token_id)
except Exception:
    logger.warning("Hedera attestation failed (non-blocking)")
```

### How does it hook into the orchestrator?
1. **Pre-execution:** Validate HTS token balance (optional, can mock)
2. **Post-execution:** Submit attestation message to HCS topic
3. **Post-execution:** Transfer AFC tokens to agent's Hedera account (or mock)
4. **API layer:** New `/hedera/status` endpoint showing token + registration info

---

## Risk Assessment

### What could go wrong

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| HOL Standards SDK is JS-only, our backend is Python | HIGH | MEDIUM | Use a separate Node.js script for registration (one-time). Daily operations use hedera-agent-kit-py. |
| hedera-agent-kit-py is new (Jan 2026), may have bugs | MEDIUM | HIGH | Pin version. Have fallback using hiero-sdk-python directly for HTS. |
| Hedera testnet is down or slow during demo | LOW | CRITICAL | Pre-record all Hedera transactions. Show explorer screenshots in deck. Cache last-known-good responses. |
| HCS-10 message polling is slow (consensus latency) | MEDIUM | MEDIUM | Submit messages fire-and-forget. Don't block the UX on HCS response. Show tx hash as proof. |
| Token association required before transfers | LOW | LOW | Pre-associate all agent accounts during setup. |

### Fallback plan
1. **If SDK is broken:** Use raw Hedera REST API / Mirror Node API for reads, submit transactions via hiero-sdk-python directly.
2. **If testnet is down during demo:** Show pre-recorded explorer screenshots. All Hedera calls are wrapped in try/catch with non-blocking fallback to mock.
3. **If time runs out:** Minimum viable Hedera = (1) create HTS token + (2) register agents on HCS-10 + (3) submit one attestation message. These 3 prove Hedera usage to judges. The rest is bonus.

---

## Implementation Priority (time-boxed to ~10h)

| Priority | Task | Effort | Blocker? |
|----------|------|--------|----------|
| P0 | Hedera testnet account + fund with HBAR | 15min | Everything else |
| P0 | Create AFC fungible token on HTS | 2h | Demo requirement |
| P0 | Register 3 agents via HOL SDK (Node.js script) | 3h | Bounty requirement |
| P1 | HCS-10 message submission after agent execution | 2h | Bounty requirement |
| P1 | On-chain attestation in orchestrator | 1h | Bounty requirement |
| P2 | HTS token transfer per-hire (real, not mock) | 1.5h | Nice to have |
| P3 | UCP format alignment | 0.5h | Bonus only |

**Total estimated: ~10h**

---

## Submission Checklist (Mandatory)

- [ ] Demo video uploaded to YouTube
- [ ] Pitch deck PDF: team intro + project summary + roadmap + demo link
- [ ] HTS token visible on Hedera testnet explorer (https://hashscan.io/testnet)
- [ ] At least 3 agents registered in HCS-2 registry
- [ ] At least one HCS-10 message per agent visible on-chain
- [ ] Natural language interaction shown in demo

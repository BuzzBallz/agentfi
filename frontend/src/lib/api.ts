const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Static fallback for the 3 seeded agents
const STATIC_TOKEN_MAP: Record<number, string> = {
  0: "portfolio_analyzer",
  1: "yield_optimizer",
  2: "risk_scorer",
};

// Dynamic map fetched from backend (includes static + user-created agents)
let dynamicTokenMap: Record<number, string> | null = null;

export async function refreshTokenMap(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/agents/token-map`);
    if (!res.ok) return;
    const json = await res.json();
    if (json.success && json.data) {
      dynamicTokenMap = {};
      for (const [k, v] of Object.entries(json.data)) {
        dynamicTokenMap[Number(k)] = v as string;
      }
    }
  } catch {
    // Non-fatal — fall back to static map
  }
}

export function resolveAgentId(tokenId: number): string | undefined {
  return dynamicTokenMap?.[tokenId] ?? STATIC_TOKEN_MAP[tokenId];
}

// Kept for backwards compat with imports
const TOKEN_TO_AGENT = STATIC_TOKEN_MAP;

export async function executeAgent(
  tokenId: number,
  query: string,
  walletAddress?: string,
  crossAgent?: boolean,
) {
  let agentId = resolveAgentId(tokenId);

  // If not found, try refreshing the map (handles just-minted agents)
  if (!agentId) {
    await refreshTokenMap();
    agentId = resolveAgentId(tokenId);
  }
  if (!agentId) throw new Error(`Unknown tokenId: ${tokenId}`);

  const body: Record<string, unknown> = { query };
  if (walletAddress) {
    body.wallet_address = walletAddress;
  }
  if (crossAgent) {
    body.cross_agent = true;
  }

  const res = await fetch(`${API_BASE}/agents/${agentId}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getAgentX402Info(tokenId: number) {
  let agentId = resolveAgentId(tokenId);
  if (!agentId) {
    await refreshTokenMap();
    agentId = resolveAgentId(tokenId);
  }
  if (!agentId) throw new Error(`Unknown tokenId: ${tokenId}`);

  const res = await fetch(`${API_BASE}/agents/${agentId}/x402`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function orchestrate(query: string, walletAddress?: string) {
  const body: Record<string, string> = { query };
  if (walletAddress) {
    body.wallet_address = walletAddress;
  }

  const res = await fetch(`${API_BASE}/orchestrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getHederaStatus() {
  const res = await fetch(`${API_BASE}/hedera/status`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

// ── Dynamic agent registration ──────────────────────────────────

export interface RegisterAgentBody {
  agent_id: string;
  name: string;
  description: string;
  system_prompt: string;
  token_id: number;
  price_per_call: number;
  x402_enabled?: boolean;
  allow_cross_agent?: boolean;
}

export async function registerAgent(body: RegisterAgentBody) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 30000);
  try {
    const res = await fetch(`${API_BASE}/agents/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeout);
    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const json = await res.json();
    if (json.success) {
      await refreshTokenMap();
    }
    return json;
  } catch (e: unknown) {
    clearTimeout(timeout);
    if (e instanceof DOMException && e.name === "AbortError") {
      throw new Error("Backend registration timed out (server may be restarting)");
    }
    throw e;
  }
}

// ── ADI Compliance endpoints ─────────────────────────────────────

export async function executeAgentCompliant(
  tokenId: number,
  query: string,
  walletAddress: string,
  adiPaymentId: number,
  crossAgent?: boolean,
) {
  let agentId = resolveAgentId(tokenId);
  if (!agentId) {
    await refreshTokenMap();
    agentId = resolveAgentId(tokenId);
  }
  if (!agentId) throw new Error(`Unknown tokenId: ${tokenId}`);

  const res = await fetch(`${API_BASE}/agents/${agentId}/execute-compliant`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      query,
      wallet_address: walletAddress,
      adi_payment_id: adiPaymentId,
      cross_agent: crossAgent ?? false,
    }),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getADIStatus() {
  const res = await fetch(`${API_BASE}/adi/status`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function checkADIKYC(walletAddress: string) {
  const res = await fetch(`${API_BASE}/adi/kyc/${walletAddress}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getADIPayment(paymentId: number) {
  const res = await fetch(`${API_BASE}/adi/payment/${paymentId}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function mockVerifyKYC(walletAddress: string) {
  const res = await fetch(`${API_BASE}/adi/kyc/mock-verify`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ wallet_address: walletAddress }),
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export { TOKEN_TO_AGENT };

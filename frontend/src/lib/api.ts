const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Map on-chain tokenId to backend agent_id
const TOKEN_TO_AGENT: Record<number, string> = {
  0: "portfolio_analyzer",
  1: "yield_optimizer",
  2: "risk_scorer",
};

export async function executeAgent(
  tokenId: number,
  query: string,
  walletAddress?: string,
  crossAgent?: boolean,
) {
  const agentId = TOKEN_TO_AGENT[tokenId];
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
  const agentId = TOKEN_TO_AGENT[tokenId];
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

// ── ADI Compliance endpoints ─────────────────────────────────────

export async function executeAgentCompliant(
  tokenId: number,
  query: string,
  walletAddress: string,
  adiPaymentId: number,
  crossAgent?: boolean,
) {
  const agentId = TOKEN_TO_AGENT[tokenId];
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

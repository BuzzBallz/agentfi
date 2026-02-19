const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Map on-chain tokenId to backend agent_id
const TOKEN_TO_AGENT: Record<number, string> = {
  0: "portfolio_analyzer",
  1: "yield_optimizer",
  2: "risk_scorer",
};

export async function executeAgent(tokenId: number, query: string) {
  const agentId = TOKEN_TO_AGENT[tokenId];
  if (!agentId) throw new Error(`Unknown tokenId: ${tokenId}`);

  const res = await fetch(`${API_BASE}/agents/${agentId}/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function orchestrate(query: string) {
  const res = await fetch(`${API_BASE}/orchestrate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query }),
  });

  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export async function getHederaStatus() {
  const res = await fetch(`${API_BASE}/hedera/status`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export { TOKEN_TO_AGENT };

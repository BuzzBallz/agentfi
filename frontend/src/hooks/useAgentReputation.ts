import { useState, useEffect } from "react";

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Static fallback — used immediately while backend fetch is in-flight
const STATIC_HEDERA_ACCOUNTS: Record<number, string> = {
  0: "0.0.7997780", // Portfolio Analyzer
  1: "0.0.7997785", // Yield Optimizer
  2: "0.0.7997786", // Risk Scorer
};

// Cached backend response (fetched once per session)
let _cachedAccounts: Record<number, string> | null = null;
let _fetchPromise: Promise<void> | null = null;

async function _fetchHederaAccounts(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/hedera/accounts`);
    if (!res.ok) return;
    const json = await res.json();
    if (json.success && json.data) {
      const parsed: Record<number, string> = {};
      for (const [k, v] of Object.entries(json.data)) {
        parsed[Number(k)] = v as string;
      }
      _cachedAccounts = parsed;
    }
  } catch {
    // Silently fall back to static map
  }
}

function resolveHederaAccount(tokenId: number): string {
  if (_cachedAccounts && _cachedAccounts[tokenId]) return _cachedAccounts[tokenId];
  return STATIC_HEDERA_ACCOUNTS[tokenId] || "";
}

// AFC Token ID on Hedera testnet
const AFC_TOKEN_ID =
  process.env.NEXT_PUBLIC_AFC_TOKEN_ID || "0.0.7977623";

// Cached backend AFC balances for dynamic agents (tracked virtually)
let _cachedAfcBalances: Record<number, number> | null = null;
let _afcFetchPromise: Promise<void> | null = null;

async function _fetchAfcBalances(): Promise<void> {
  try {
    const res = await fetch(`${API_BASE}/hedera/afc-balances`);
    if (!res.ok) return;
    const json = await res.json();
    if (json.success && json.data) {
      const parsed: Record<number, number> = {};
      for (const [k, v] of Object.entries(json.data)) {
        parsed[Number(k)] = Number(v);
      }
      _cachedAfcBalances = parsed;
    }
  } catch {
    // Silently fall back
  }
}

interface AgentReputation {
  afcBalance: number;
  executionCount: number;
  hederaAccountId: string;
  hashscanUrl: string;
  loading: boolean;
  error: string | null;
}

export function useAgentReputation(tokenId: number): AgentReputation {
  const [afcBalance, setAfcBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hederaAccountId, setHederaAccountId] = useState(() => resolveHederaAccount(tokenId));

  // Fetch dynamic accounts from backend (once per session)
  useEffect(() => {
    if (!_fetchPromise) {
      _fetchPromise = _fetchHederaAccounts();
    }
    _fetchPromise.then(() => {
      const resolved = resolveHederaAccount(tokenId);
      if (resolved && resolved !== hederaAccountId) {
        setHederaAccountId(resolved);
      }
    });
  }, [tokenId, hederaAccountId]);

  useEffect(() => {
    if (!hederaAccountId) {
      setLoading(false);
      return;
    }

    let cancelled = false;
    const isDynamic = tokenId >= 3;

    async function fetchBalance() {
      try {
        // For dynamic agents (tokenId >= 3), fetch tracked AFC from backend
        // They share the operator Hedera account so Mirror Node balance is meaningless
        if (isDynamic) {
          _afcFetchPromise = _fetchAfcBalances();
          await _afcFetchPromise;
          if (cancelled) return;
          const tracked = _cachedAfcBalances?.[tokenId] ?? 0;
          setAfcBalance(tracked);
          setLoading(false);
          return;
        }

        // For static agents (0-2), fetch real balance from Hedera Mirror Node
        const response = await fetch(
          `https://testnet.mirrornode.hedera.com/api/v1/accounts/${hederaAccountId}/tokens`
        );

        if (!response.ok) throw new Error("Mirror Node request failed");

        const data = await response.json();

        if (cancelled) return;

        // Find AFC token in account's token list
        const afcToken = data.tokens?.find(
          (t: { token_id: string; balance: number }) =>
            t.token_id === AFC_TOKEN_ID
        );

        if (afcToken) {
          // AFC has 2 decimals: balance 4700 = 47.00 AFC
          const rawBalance = Number(afcToken.balance);
          setAfcBalance(rawBalance / 100);
        } else {
          setAfcBalance(0);
        }

        setLoading(false);
      } catch (err) {
        if (cancelled) return;
        console.error("Failed to fetch agent reputation:", err);
        setError("Could not load reputation");
        setLoading(false);
      }
    }

    fetchBalance();

    // Refresh every 30 seconds
    const interval = setInterval(fetchBalance, 30_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [hederaAccountId, tokenId]);

  return {
    afcBalance,
    executionCount: Math.floor(afcBalance), // 1 AFC per execution
    hederaAccountId,
    hashscanUrl: `https://hashscan.io/testnet/account/${hederaAccountId}`,
    loading,
    error,
  };
}

"use client";

import { useAgentReputation } from "@/hooks/useAgentReputation";
import { Space_Mono } from "next/font/google";

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] });

interface Props {
  tokenId: number;
  compact?: boolean;
}

const TIERS = [
  { name: "New", min: 0, emoji: "\u{1F195}", color: "#5C4A32" },
  { name: "Active", min: 5, emoji: "\u{1F504}", color: "#7A9E6E" },
  { name: "Proven", min: 20, emoji: "\u2705", color: "#5B9BD5" },
  { name: "Expert", min: 50, emoji: "\u2B50", color: "#A78BFA" },
  { name: "Legend", min: 100, emoji: "\u{1F3C6}", color: "#C9A84C" },
] as const;

function getTier(executionCount: number) {
  for (let i = TIERS.length - 1; i >= 0; i--) {
    if (executionCount >= TIERS[i].min) return TIERS[i];
  }
  return TIERS[0];
}

export default function AgentReputation({ tokenId, compact = false }: Props) {
  const {
    afcBalance,
    executionCount,
    hederaAccountId,
    hashscanUrl,
    loading,
    error,
  } = useAgentReputation(tokenId);

  if (loading) {
    return (
      <div
        style={{
          height: compact ? 22 : 80,
          width: compact ? 120 : "100%",
          background: "#241A0E",
          borderRadius: 6,
          animation: "pulse 1.5s ease-in-out infinite",
        }}
      />
    );
  }

  if (error || !hederaAccountId) return null;

  const tier = getTier(executionCount);

  if (compact) {
    return (
      <div
        className={spaceMono.className}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 4,
          padding: "3px 8px",
          borderRadius: 999,
          background: "rgba(201,168,76,0.08)",
          border: "1px solid rgba(201,168,76,0.15)",
          fontSize: 10,
          color: tier.color,
          letterSpacing: "0.03em",
        }}
      >
        <span>{tier.emoji}</span>
        <span style={{ fontWeight: 700 }}>{afcBalance.toFixed(0)} AFC</span>
        <span style={{ color: "#5C4A32" }}>&middot;</span>
        <span>{executionCount} runs</span>
      </div>
    );
  }

  // Full display for agent detail page
  return (
    <div
      style={{
        background: "#241A0E",
        border: "1px solid #3D2E1A",
        borderRadius: 12,
        padding: 24,
        marginBottom: 24,
      }}
    >
      <div
        className={spaceMono.className}
        style={{
          color: "#5C4A32",
          fontSize: 10,
          letterSpacing: "0.08em",
          marginBottom: 12,
        }}
      >
        AGENT REPUTATION (HEDERA)
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <span
          className={spaceMono.className}
          style={{
            background: `${tier.color}15`,
            border: `1px solid ${tier.color}30`,
            color: tier.color,
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 12px",
            borderRadius: 999,
            letterSpacing: "0.05em",
          }}
        >
          {tier.emoji} {tier.name}
        </span>
        <span
          className={spaceMono.className}
          style={{ color: "#F5ECD7", fontSize: 22, fontWeight: 700 }}
        >
          {afcBalance.toFixed(2)} AFC
        </span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
        <div>
          <div className={spaceMono.className} style={{ color: "#5C4A32", fontSize: 10, letterSpacing: "0.08em", marginBottom: 4 }}>
            TOTAL EXECUTIONS
          </div>
          <div className={spaceMono.className} style={{ color: "#9A8060", fontSize: 14, fontWeight: 700 }}>
            {executionCount}
          </div>
        </div>
        <div>
          <div className={spaceMono.className} style={{ color: "#5C4A32", fontSize: 10, letterSpacing: "0.08em", marginBottom: 4 }}>
            HEDERA ACCOUNT
          </div>
          <div className={spaceMono.className} style={{ color: "#9A8060", fontSize: 11 }}>
            {hederaAccountId}
          </div>
        </div>
      </div>

      {/* Reputation progress bar */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          {TIERS.map((t) => (
            <span
              key={t.name}
              className={spaceMono.className}
              style={{
                fontSize: 9,
                color: executionCount >= t.min ? t.color : "#3D2E1A",
                letterSpacing: "0.05em",
              }}
            >
              {t.name}
            </span>
          ))}
        </div>
        <div
          style={{
            width: "100%",
            height: 4,
            background: "#1A1208",
            borderRadius: 2,
            overflow: "hidden",
          }}
        >
          <div
            style={{
              width: `${Math.min(executionCount, 100)}%`,
              height: "100%",
              background: `linear-gradient(to right, #7A9E6E, #5B9BD5, #A78BFA, #C9A84C)`,
              borderRadius: 2,
              transition: "width 0.5s ease",
            }}
          />
        </div>
      </div>

      <a
        href={hashscanUrl}
        target="_blank"
        rel="noopener noreferrer"
        className={spaceMono.className}
        style={{ color: "#C9A84C", fontSize: 10, textDecoration: "underline" }}
      >
        Verify on HashScan &rarr;
      </a>
    </div>
  );
}

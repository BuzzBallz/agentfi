"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Space_Mono, DM_Sans } from "next/font/google";
import { useReadContract } from "wagmi";
import { useAgentData } from "@/hooks/useAgentData";
import { useHireAgent } from "@/hooks/useHireAgent";
import { useExecuteAgent } from "@/hooks/useExecuteAgent";
import { TOKEN_TO_AGENT } from "@/lib/api";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import AgentMarketplaceAbi from "@/abi/AgentMarketplace.json";
import { formatEther } from "viem";

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] });
const dmSans = DM_Sans({ subsets: ["latin"] });

// Agent display names
const AGENT_NAMES: Record<number, string> = {
  0: "Portfolio Analyzer",
  1: "Yield Optimizer",
  2: "Risk Scorer",
};

const CATEGORY_MAP: Record<number, string> = {
  0: "DeFi",
  1: "Yield",
  2: "Risk",
};

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  DeFi: { bg: "rgba(201,168,76,0.1)", text: "#C9A84C" },
  Yield: { bg: "rgba(122,158,110,0.1)", text: "#7A9E6E" },
  Risk: { bg: "rgba(196,122,90,0.1)", text: "#C47A5A" },
};

export default function AgentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const tokenId = Number(params.id);
  const { agentData, isLoading: dataLoading, isError: dataError } =
    useAgentData(tokenId);
  const {
    hireAgent,
    isPending: txPending,
    isConfirming: txConfirming,
    isSuccess: txSuccess,
    hash: txHash,
    isError: txError,
    error: txErrorMsg,
  } = useHireAgent();
  const {
    execute,
    result: agentResult,
    hederaProof,
    isLoading: agentLoading,
    error: agentError,
  } = useExecuteAgent();

  // Fetch listing to get owner address
  const { data: listingData } = useReadContract({
    address: CONTRACT_ADDRESSES.AgentMarketplace as `0x${string}`,
    abi: AgentMarketplaceAbi,
    functionName: "getListing",
    args: [BigInt(tokenId)],
    chainId: 16600,
  });
  const ownerAddress = listingData
    ? ((listingData as any).owner ?? (listingData as any)[1]) as string
    : null;

  const [query, setQuery] = useState("");
  const [step, setStep] = useState<
    "idle" | "tx" | "confirming" | "executing" | "done"
  >("idle");

  const agentName = AGENT_NAMES[tokenId] || `Agent #${tokenId}`;
  const category = CATEGORY_MAP[tokenId] || "DeFi";
  const catColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.DeFi;
  const agentId = TOKEN_TO_AGENT[tokenId];

  // Trigger agent execution after tx confirms
  useEffect(() => {
    if (txSuccess && step === "confirming" && query) {
      setStep("executing");
      execute(tokenId, query);
    }
  }, [txSuccess, step, query, tokenId, execute]);

  // Mark done when agent result arrives
  useEffect(() => {
    if (agentResult && step === "executing") {
      setStep("done");
    }
  }, [agentResult, step]);

  // Mark done on agent error too
  useEffect(() => {
    if (agentError && step === "executing") {
      setStep("done");
    }
  }, [agentError, step]);

  const handleHireAndExecute = () => {
    if (!query.trim() || !agentData) return;
    setStep("tx");
    hireAgent(tokenId, agentData.pricePerCall);
  };

  // Watch tx state transitions
  useEffect(() => {
    if (txPending && step === "tx") {
      // waiting for user to sign
    }
    if (txConfirming && step === "tx") {
      setStep("confirming");
    }
  }, [txPending, txConfirming, step]);

  // Handle tx error
  useEffect(() => {
    if (txError && (step === "tx" || step === "confirming")) {
      setStep("idle");
    }
  }, [txError, step]);

  const statusText = () => {
    switch (step) {
      case "tx":
        return "Confirm transaction in wallet...";
      case "confirming":
        return "Confirming on-chain...";
      case "executing":
        return "Agent thinking...";
      default:
        return null;
    }
  };

  return (
    <div
      className={dmSans.className}
      style={{ maxWidth: 800, margin: "0 auto", padding: "40px 24px 80px" }}
    >
      {/* Back link */}
      <button
        onClick={() => router.push("/marketplace")}
        className={spaceMono.className}
        style={{
          background: "none",
          border: "none",
          color: "#9A8060",
          fontSize: 13,
          cursor: "pointer",
          marginBottom: 28,
          padding: 0,
        }}
      >
        &larr; Back to Marketplace
      </button>

      {/* Agent Header */}
      {dataLoading ? (
        <div style={{ color: "#9A8060", fontSize: 14 }}>
          Loading agent data...
        </div>
      ) : dataError ? (
        <div style={{ color: "#C47A5A", fontSize: 14 }}>
          Failed to load agent data from contract
        </div>
      ) : (
        <>
          {/* Name + category */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 20,
            }}
          >
            <h1
              className={spaceMono.className}
              style={{
                fontSize: 28,
                fontWeight: 700,
                color: "#F5ECD7",
                margin: 0,
              }}
            >
              {agentName}
            </h1>
            <span
              className={spaceMono.className}
              style={{
                background: catColor.bg,
                color: catColor.text,
                fontSize: 11,
                letterSpacing: "0.05em",
                padding: "4px 12px",
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              {category}
            </span>
          </div>

          {/* Metadata card */}
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
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <div
                  className={spaceMono.className}
                  style={{
                    color: "#5C4A32",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  MODEL
                </div>
                <div style={{ color: "#F5ECD7", fontSize: 14 }}>
                  {agentData?.modelHash || "—"}
                </div>
              </div>
              <div>
                <div
                  className={spaceMono.className}
                  style={{
                    color: "#5C4A32",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  PRICE PER HIRE
                </div>
                <div
                  className={spaceMono.className}
                  style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700 }}
                >
                  {agentData
                    ? formatEther(agentData.pricePerCall)
                    : "—"}{" "}
                  OG
                </div>
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
              }}
            >
              <div>
                <div
                  className={spaceMono.className}
                  style={{
                    color: "#5C4A32",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  AGENT ID
                </div>
                <div
                  className={spaceMono.className}
                  style={{ color: "#9A8060", fontSize: 12 }}
                >
                  {agentId || "unknown"}
                </div>
              </div>
              <div>
                <div
                  className={spaceMono.className}
                  style={{
                    color: "#5C4A32",
                    fontSize: 10,
                    letterSpacing: "0.08em",
                    marginBottom: 4,
                  }}
                >
                  OWNER
                </div>
                <div
                  className={spaceMono.className}
                  style={{ color: "#9A8060", fontSize: 12, wordBreak: "break-all" }}
                >
                  {ownerAddress
                    ? `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`
                    : "—"}
                </div>
              </div>
            </div>

            {/* Capabilities */}
            {agentData?.capabilities &&
              agentData.capabilities.length > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div
                    className={spaceMono.className}
                    style={{
                      color: "#5C4A32",
                      fontSize: 10,
                      letterSpacing: "0.08em",
                      marginBottom: 8,
                    }}
                  >
                    CAPABILITIES
                  </div>
                  <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                    {(agentData.capabilities as string[]).map(
                      (cap: string, i: number) => (
                        <span
                          key={i}
                          className={spaceMono.className}
                          style={{
                            background: "#1A1208",
                            border: "1px solid #3D2E1A",
                            color: "#C9A84C",
                            fontSize: 11,
                            padding: "4px 10px",
                            borderRadius: 6,
                          }}
                        >
                          {cap}
                        </span>
                      )
                    )}
                  </div>
                </div>
              )}
          </div>

          {/* Query input + Hire button */}
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
                color: "#F5ECD7",
                fontSize: 14,
                fontWeight: 700,
                marginBottom: 14,
              }}
            >
              Ask this agent
            </div>

            <textarea
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Analyze a portfolio with 60% ETH and 40% USDC..."
              className={spaceMono.className}
              style={{
                width: "100%",
                background: "#1A1208",
                border: "1px solid #3D2E1A",
                color: "#F5ECD7",
                borderRadius: 8,
                padding: "12px 14px",
                fontSize: 13,
                outline: "none",
                resize: "vertical",
                minHeight: 80,
                fontFamily: "inherit",
              }}
            />

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 16,
                marginTop: 14,
              }}
            >
              <button
                onClick={handleHireAndExecute}
                disabled={
                  !query.trim() || step !== "idle" || !agentData
                }
                className={spaceMono.className}
                style={{
                  background:
                    !query.trim() || step !== "idle"
                      ? "#5C4422"
                      : "#C9A84C",
                  color: "#1A1208",
                  border: "none",
                  borderRadius: 8,
                  padding: "10px 24px",
                  fontSize: 12,
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  cursor:
                    !query.trim() || step !== "idle"
                      ? "not-allowed"
                      : "pointer",
                  transition: "background 0.2s",
                }}
              >
                {step === "idle"
                  ? "Hire & Execute \u2192"
                  : statusText()}
              </button>

              {txHash && (
                <span
                  className={spaceMono.className}
                  style={{ color: "#5C4A32", fontSize: 11 }}
                >
                  tx: {txHash.slice(0, 10)}...
                </span>
              )}
            </div>

            {/* Tx error */}
            {txError && (
              <div
                style={{
                  color: "#C47A5A",
                  fontSize: 13,
                  marginTop: 12,
                }}
              >
                Transaction failed:{" "}
                {(txErrorMsg as any)?.shortMessage ||
                  (txErrorMsg as any)?.message ||
                  "User rejected or error"}
              </div>
            )}
          </div>

          {/* Agent Response */}
          {(agentResult || agentError || agentLoading) && (
            <div
              style={{
                background: "#241A0E",
                border: "1px solid #3D2E1A",
                borderRadius: 12,
                padding: 24,
              }}
            >
              <div
                className={spaceMono.className}
                style={{
                  color: "#F5ECD7",
                  fontSize: 14,
                  fontWeight: 700,
                  marginBottom: 14,
                }}
              >
                Agent Response
              </div>

              {agentLoading && (
                <div style={{ color: "#9A8060", fontSize: 13 }}>
                  Agent is thinking...
                </div>
              )}

              {agentError && (
                <div style={{ color: "#C47A5A", fontSize: 13 }}>
                  {agentError}
                </div>
              )}

              {agentResult && (
                <>
                  <div
                    style={{
                      color: "#F5ECD7",
                      fontSize: 14,
                      lineHeight: 1.7,
                      whiteSpace: "pre-wrap",
                      background: "#1A1208",
                      border: "1px solid #3D2E1A",
                      borderRadius: 8,
                      padding: 16,
                      maxHeight: 400,
                      overflowY: "auto",
                    }}
                  >
                    {agentResult}
                  </div>

                  {/* Hedera Proof */}
                  {hederaProof && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: 12,
                        background: "rgba(122,158,110,0.08)",
                        border: "1px solid rgba(122,158,110,0.2)",
                        borderRadius: 8,
                      }}
                    >
                      <div
                        className={spaceMono.className}
                        style={{
                          color: "#7A9E6E",
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          marginBottom: 6,
                        }}
                      >
                        HEDERA PROOF
                      </div>
                      {hederaProof.hcs_messages?.map(
                        (msg: string, i: number) => (
                          <div
                            key={i}
                            className={spaceMono.className}
                            style={{ color: "#7A9E6E", fontSize: 12 }}
                          >
                            HCS tx: {msg}
                          </div>
                        )
                      )}
                      {hederaProof.agents_used && (
                        <div
                          className={spaceMono.className}
                          style={{
                            color: "#5C4A32",
                            fontSize: 11,
                            marginTop: 4,
                          }}
                        >
                          Agents: {hederaProof.agents_used.join(", ")}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reset button */}
                  <button
                    onClick={() => {
                      setStep("idle");
                      setQuery("");
                    }}
                    className={spaceMono.className}
                    style={{
                      marginTop: 14,
                      background: "none",
                      border: "1px solid #3D2E1A",
                      color: "#9A8060",
                      borderRadius: 8,
                      padding: "8px 16px",
                      fontSize: 11,
                      cursor: "pointer",
                    }}
                  >
                    Ask another question
                  </button>
                </>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

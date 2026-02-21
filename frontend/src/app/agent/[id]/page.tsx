"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Space_Mono, DM_Sans } from "next/font/google";
import { useAccount } from "wagmi";
import { useAgentData, useIsAuthorized, useTokenImage, useTokenMetadata, useResolvedAgentId } from "@/hooks/useAgentData";
import { useHireAgent } from "@/hooks/useHireAgent";
import { useExecuteAgent } from "@/hooks/useExecuteAgent";
import { useADIPayment } from "@/hooks/useADIPayment";
import { useAppMode } from "@/context/AppModeContext";
import { PLATFORM_FEE_PCT } from "@/config/contracts";
import { formatEther } from "viem";
import { formatPrice, txExplorerUrl } from "@/lib/format";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import AgentReputation from "@/components/AgentReputation";
import ADICompliance from "@/components/ADICompliance";

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] });
const dmSans = DM_Sans({ subsets: ["latin"] });

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

const FALLBACK_NAMES: Record<number, string> = {
  0: "Portfolio Analyzer",
  1: "Yield Optimizer",
  2: "Risk Scorer",
};

export default function AgentPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { address } = useAccount();
  const tokenId = Number(params.id);
  const {
    agentData,
    tokenURI,
    metadataHash,
    owner: ownerAddress,
    isLoading: dataLoading,
    isError: _dataError,
  } = useAgentData(tokenId);
  const { imageUrl, fallbackSvg } = useTokenImage(tokenURI, tokenId);
  const tokenMeta = useTokenMetadata(tokenURI);
  const agentId = useResolvedAgentId(tokenId);
  const isAuthorized = useIsAuthorized(tokenId, address);
  const isOwner =
    address && ownerAddress
      ? address.toLowerCase() === ownerAddress.toLowerCase()
      : false;

  const {
    hireAgent,
    hireAsOwner,
    isPending: _txPending,
    isConfirming: txConfirming,
    isSuccess: txSuccess,
    hash: txHash,
    isError: txError,
    error: txErrorMsg,
    reset: resetHire,
  } = useHireAgent();
  const {
    execute,
    result: agentResult,
    hederaProof,
    afcReward,
    crossAgentReport,
    complianceData,
    isLoading: agentLoading,
    error: agentError,
    reset: resetAgent,
  } = useExecuteAgent();

  const { isCompliant, mode } = useAppMode();
  const {
    payForAgent: adiPay,
    hash: adiHash,
    isPending: _adiPending,
    isConfirming: adiConfirming,
    isSuccess: adiSuccess,
    isError: adiError,
    error: adiErrorMsg,
    paymentId: adiPaymentId,
    reset: resetADI,
  } = useADIPayment();

  const [query, setQuery] = useState("");
  const [crossAgent, setCrossAgent] = useState(false);
  const [step, setStep] = useState<
    "idle" | "tx" | "confirming" | "executing" | "done"
  >("idle");
  const [txErrorLocal, setTxErrorLocal] = useState<string | null>(null);

  // Name from contract → tokenURI metadata → static fallback
  const agentName = dataLoading
    ? "Loading..."
    : (agentData?.name || tokenMeta?.name || FALLBACK_NAMES[tokenId] || `Agent #${tokenId}`);
  const agentDescription = agentData?.description || tokenMeta?.description || null;
  const category = CATEGORY_MAP[tokenId] || "DeFi";
  const catColor = CATEGORY_COLORS[category] || CATEGORY_COLORS.DeFi;

  // Trigger agent execution after tx confirms (permissionless mode - 0G Chain)
  // Accept step "tx" OR "confirming" to handle fast-confirming TXs (e.g. owner bypass)
  useEffect(() => {
    if (txSuccess && (step === "confirming" || step === "tx") && query && !isCompliant) {
      setStep("executing");
      execute(tokenId, query, address, crossAgent);
    }
  }, [txSuccess, step, query, tokenId, execute, crossAgent, isCompliant, address]);

  // Trigger agent execution after ADI payment confirms (compliant mode)
  useEffect(() => {
    if (adiSuccess && adiPaymentId !== null && (step === "confirming" || step === "tx") && query) {
      setStep("executing");
      execute(tokenId, query, address, crossAgent, adiPaymentId);
    }
  }, [adiSuccess, adiPaymentId, step, query, tokenId, execute, crossAgent, address]);

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

  // Default price fallback (0.001 OG) when agentData is unavailable
  const pricePerCall = agentData?.pricePerCall ?? BigInt(1000000000000000);

  const handleHireAndExecute = () => {
    if (!query.trim()) return;
    setTxErrorLocal(null);
    setStep("tx");
    if (isCompliant) {
      const priceADI = formatEther(pricePerCall);
      adiPay(tokenId, priceADI);
    } else if (isOwner) {
      hireAsOwner(tokenId);
    } else {
      hireAgent(tokenId, pricePerCall);
    }
  };

  // Watch tx state transitions (both 0G and ADI)
  useEffect(() => {
    if ((txConfirming || adiConfirming) && step === "tx") {
      setStep("confirming");
    }
  }, [txConfirming, adiConfirming, step]);

  // Handle tx error (both 0G and ADI) — capture error, reset wagmi, go idle
  useEffect(() => {
    if ((txError || adiError) && (step === "tx" || step === "confirming")) {
      // Capture error message before resetting wagmi
      const errObj = (txErrorMsg || adiErrorMsg) as any;
      const msg = errObj?.shortMessage || errObj?.message || "Transaction rejected";
      setTxErrorLocal(msg.slice(0, 250));
      setStep("idle");
      // Reset wagmi state so next attempt starts fresh (avoids stale hash / "receipt not found")
      if (txError) resetHire();
      if (adiError) resetADI();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [txError, adiError, step]);

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

  const labelStyle = {
    color: "#5C4A32",
    fontSize: 10,
    letterSpacing: "0.08em",
    marginBottom: 4,
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
      ) : (
        <>
          {/* SVG Image from tokenURI */}
          {imageUrl && (
            <div
              style={{
                border: "1px solid #3D2E1A",
                borderRadius: 12,
                overflow: "hidden",
                marginBottom: 20,
                background: "#241A0E",
                display: "flex",
                justifyContent: "center",
                maxHeight: 280,
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt={`${agentName} iNFT`}
                style={{ maxWidth: "100%", maxHeight: 280, objectFit: "contain" }}
                onError={(e) => { if (fallbackSvg) (e.target as HTMLImageElement).src = fallbackSvg; }}
              />
            </div>
          )}

          {/* Name + badges */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              marginBottom: 8,
              flexWrap: "wrap",
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
            <span
              className={spaceMono.className}
              style={{
                background: "rgba(139,92,246,0.1)",
                color: "#A78BFA",
                fontSize: 10,
                letterSpacing: "0.05em",
                padding: "4px 10px",
                borderRadius: 999,
                fontWeight: 700,
              }}
            >
              ERC-7857 iNFT
            </span>
          </div>

          {/* Description from contract or tokenURI fallback */}
          {agentDescription && (
            <div style={{ color: "#9A8060", fontSize: 14, marginBottom: 20, lineHeight: 1.5 }}>
              {agentDescription}
            </div>
          )}

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
                <div className={spaceMono.className} style={labelStyle}>
                  PRICE PER HIRE
                </div>
                <div
                  className={spaceMono.className}
                  style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700 }}
                >
                  {formatPrice(pricePerCall, mode)}
                </div>
                <div style={{ color: "#5C4A32", fontSize: 11, marginTop: 4 }}>
                  97.5% to owner &middot; {PLATFORM_FEE_PCT} platform fee
                </div>
              </div>
              <div>
                <div className={spaceMono.className} style={labelStyle}>
                  OWNER
                </div>
                <div
                  className={spaceMono.className}
                  style={{ color: "#9A8060", fontSize: 12, wordBreak: "break-all" }}
                >
                  {ownerAddress
                    ? `${ownerAddress.slice(0, 6)}...${ownerAddress.slice(-4)}`
                    : "---"}
                </div>
                {isOwner && (
                  <div style={{ color: "#7A9E6E", fontSize: 11, marginTop: 4 }}>
                    You own this agent
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 16,
                marginBottom: 16,
              }}
            >
              <div>
                <div className={spaceMono.className} style={labelStyle}>
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
                <div className={spaceMono.className} style={labelStyle}>
                  STORED ON
                </div>
                <div
                  className={spaceMono.className}
                  style={{ color: "#9A8060", fontSize: 12 }}
                >
                  0G Storage
                </div>
              </div>
            </div>

            {/* Metadata Hash (ERC-7857) */}
            {metadataHash && (
              <div style={{ marginBottom: 16 }}>
                <div className={spaceMono.className} style={labelStyle}>
                  METADATA HASH (ERC-7857)
                </div>
                <div
                  className={spaceMono.className}
                  style={{ color: "#A78BFA", fontSize: 11, wordBreak: "break-all" }}
                >
                  {metadataHash}
                </div>
                <div style={{ color: "#5C4A32", fontSize: 10, marginTop: 2 }}>
                  Proves intelligence is encrypted on-chain
                </div>
              </div>
            )}

            {/* Authorization status */}
            {address && (
              <div style={{ marginBottom: 16 }}>
                <div className={spaceMono.className} style={labelStyle}>
                  AUTHORIZATION
                </div>
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}>
                  <div style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: isOwner || isAuthorized ? "#7A9E6E" : "#5C4A32",
                  }} />
                  <span
                    className={spaceMono.className}
                    style={{
                      color: isOwner || isAuthorized ? "#7A9E6E" : "#5C4A32",
                      fontSize: 12,
                    }}
                  >
                    {isOwner
                      ? "Owner (always authorized)"
                      : isAuthorized
                      ? "Authorized via ERC-7857"
                      : "Not authorized"}
                  </span>
                </div>
              </div>
            )}

            {/* Capabilities */}
            {agentData?.capabilities &&
              agentData.capabilities.length > 0 && (
                <div>
                  <div className={spaceMono.className} style={labelStyle}>
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

          {/* Agent Reputation — live AFC balance from Hedera */}
          <AgentReputation tokenId={tokenId} />

          {/* ADI Chain Compliance — Mode B stats (only in compliant mode) */}
          {isCompliant && <ADICompliance />}

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

            {/* x402 Cross-Agent Toggle */}
            {tokenId !== 2 && (
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 12,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={crossAgent}
                  onChange={(e) => setCrossAgent(e.target.checked)}
                  style={{ accentColor: "#A78BFA", width: 16, height: 16 }}
                />
                <span
                  className={spaceMono.className}
                  style={{ color: "#A78BFA", fontSize: 11, letterSpacing: "0.03em" }}
                >
                  Enable cross-agent collaboration (x402)
                </span>
                <span
                  className={spaceMono.className}
                  style={{ color: "#5C4A32", fontSize: 10 }}
                >
                  Pays AFC to consult other agents
                </span>
              </label>
            )}

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
                  !query.trim() || step !== "idle"
                }
                className={spaceMono.className}
                style={{
                  background:
                    !query.trim() || step !== "idle"
                      ? "#5C4422"
                      : isCompliant
                      ? "#60A5FA"
                      : isOwner
                      ? "#7A9E6E"
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
                  ? isOwner && !isCompliant
                    ? "Execute (Free) \u2192"
                    : isCompliant
                    ? `Hire (Compliant) - ${formatPrice(pricePerCall, mode)} \u2192`
                    : `Hire & Execute - ${formatPrice(pricePerCall, mode)} \u2192`
                  : statusText()}
              </button>

              {(txHash || adiHash) && (
                <a
                  href={txExplorerUrl((txHash || adiHash)!, mode)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={spaceMono.className}
                  style={{ color: isCompliant ? "#60A5FA" : "#C9A84C", fontSize: 11, textDecoration: "underline" }}
                >
                  tx: {((txHash || adiHash)!).slice(0, 10)}...{((txHash || adiHash)!).slice(-6)}
                </a>
              )}
            </div>

            {/* Tx error — persistent local state so it survives wagmi reset */}
            {txErrorLocal && step === "idle" && (
              <div
                style={{
                  color: "#C47A5A",
                  fontSize: 13,
                  marginTop: 12,
                }}
              >
                Transaction failed: {txErrorLocal}
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
                    className="prose prose-invert prose-amber max-w-none
                      [&_h1]:text-2xl [&_h1]:text-amber-100 [&_h1]:font-bold [&_h1]:mb-4
                      [&_h2]:text-xl [&_h2]:text-amber-200 [&_h2]:font-bold [&_h2]:mb-3
                      [&_h3]:text-lg [&_h3]:text-amber-300 [&_h3]:font-semibold [&_h3]:mb-2
                      [&_strong]:text-amber-200
                      [&_table]:w-full [&_th]:text-left [&_th]:text-amber-400 [&_th]:pb-2
                      [&_td]:py-1 [&_td]:pr-4 [&_td]:text-neutral-300 [&_td]:border-b [&_td]:border-amber-900/20
                      [&_th]:border-b [&_th]:border-amber-900/40
                      [&_li]:text-neutral-300 [&_p]:text-neutral-300 [&_p]:mb-3
                      [&_hr]:border-amber-900/30 [&_hr]:my-4
                      text-neutral-300 leading-relaxed"
                    style={{
                      background: "#1A1208",
                      border: "1px solid #3D2E1A",
                      borderRadius: 8,
                      padding: 16,
                      maxHeight: 500,
                      overflowY: "auto",
                    }}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{agentResult}</ReactMarkdown>
                  </div>

                  {/* Hedera Proofs */}
                  {(hederaProof || afcReward) && (
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
                        HEDERA PROOFS
                      </div>

                      {/* HCS Attestation */}
                      {hederaProof?.hcs_messages?.map(
                        (msg: string, i: number) => (
                          <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                            <span style={{ color: "#7A9E6E", fontSize: 12 }}>&#x2705;</span>
                            <span className={spaceMono.className} style={{ color: "#9A8060", fontSize: 11 }}>HCS Attestation:</span>
                            <a
                              href={`https://hashscan.io/testnet/transaction/${msg}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={spaceMono.className}
                              style={{ color: "#7A9E6E", fontSize: 11, textDecoration: "underline" }}
                            >
                              {msg}
                            </a>
                          </div>
                        )
                      )}

                      {/* AFC Token Reward */}
                      {afcReward?.status && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ color: "#C9A84C", fontSize: 12 }}>&#x2705;</span>
                          <span className={spaceMono.className} style={{ color: "#9A8060", fontSize: 11 }}>
                            AFC Reward: {afcReward.amount} &rarr; {afcReward.recipient}
                          </span>
                          {afcReward.hashscan_url && (
                            <a
                              href={afcReward.hashscan_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={spaceMono.className}
                              style={{ color: "#C9A84C", fontSize: 11, textDecoration: "underline" }}
                            >
                              HashScan
                            </a>
                          )}
                        </div>
                      )}

                      {hederaProof?.agents_used && (
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

                  {/* x402 Cross-Agent Report */}
                  {crossAgentReport?.enabled && crossAgentReport.report?.length > 0 && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: 12,
                        background: "rgba(167,139,250,0.08)",
                        border: "1px solid rgba(167,139,250,0.2)",
                        borderRadius: 8,
                      }}
                    >
                      <div
                        className={spaceMono.className}
                        style={{
                          color: "#A78BFA",
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          marginBottom: 6,
                        }}
                      >
                        x402 CROSS-AGENT COLLABORATION
                      </div>

                      {crossAgentReport.report.map((item: any, i: number) => (
                        <div key={i} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 12 }}>
                            {item.status === "success" ? "\u2705" : item.status === "insufficient_funds" ? "\u26A0\uFE0F" : "\u274C"}
                          </span>
                          <span className={spaceMono.className} style={{ color: "#9A8060", fontSize: 11 }}>
                            {item.agent?.replace("_", " ")}:
                          </span>
                          <span className={spaceMono.className} style={{ color: "#A78BFA", fontSize: 11 }}>
                            {item.status === "success"
                              ? `paid ${item.cost} via x402`
                              : item.status === "insufficient_funds"
                              ? `needs ${item.required} (have ${item.available})`
                              : item.reason || item.status}
                          </span>
                        </div>
                      ))}

                      {crossAgentReport.payments?.length > 0 && (
                        <div
                          className={spaceMono.className}
                          style={{ color: "#5C4A32", fontSize: 10, marginTop: 6 }}
                        >
                          Payment split: 70% owner / 20% agent reputation / 10% platform
                        </div>
                      )}
                    </div>
                  )}

                  {/* Compliance Verification Card (compliant mode) */}
                  {(isCompliant || complianceData) && (
                    <div
                      style={{
                        marginTop: 14,
                        padding: 12,
                        background: "rgba(96,165,250,0.08)",
                        border: "1px solid rgba(96,165,250,0.2)",
                        borderRadius: 8,
                      }}
                    >
                      <div
                        className={spaceMono.className}
                        style={{
                          color: "#60A5FA",
                          fontSize: 10,
                          letterSpacing: "0.08em",
                          marginBottom: 6,
                        }}
                      >
                        COMPLIANCE VERIFICATION
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 12 }}>&#x2705;</span>
                        <span className={spaceMono.className} style={{ color: "#9A8060", fontSize: 11 }}>KYC Verified</span>
                      </div>

                      {complianceData?.jurisdiction && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 12 }}>&#x2705;</span>
                          <span className={spaceMono.className} style={{ color: "#9A8060", fontSize: 11 }}>
                            Jurisdiction: {complianceData.jurisdiction}
                          </span>
                        </div>
                      )}

                      {complianceData?.kyc_tier !== undefined && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 12 }}>&#x2705;</span>
                          <span className={spaceMono.className} style={{ color: "#9A8060", fontSize: 11 }}>
                            KYC Tier: Enhanced ({complianceData.kyc_tier})
                          </span>
                        </div>
                      )}

                      {adiPaymentId !== null && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 12 }}>&#x2705;</span>
                          <span className={spaceMono.className} style={{ color: "#9A8060", fontSize: 11 }}>
                            ADI Payment ID: #{adiPaymentId}
                          </span>
                        </div>
                      )}

                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                        <span style={{ fontSize: 12 }}>&#x2705;</span>
                        <span className={spaceMono.className} style={{ color: "#9A8060", fontSize: 11 }}>
                          FATF Travel Rule: Recorded
                        </span>
                      </div>

                      {adiHash && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 12 }}>&#x2705;</span>
                          <span className={spaceMono.className} style={{ color: "#9A8060", fontSize: 11 }}>ADI Receipt:</span>
                          <a
                            href={txExplorerUrl(adiHash, "compliant")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={spaceMono.className}
                            style={{ color: "#60A5FA", fontSize: 11, textDecoration: "underline" }}
                          >
                            {adiHash.slice(0, 10)}...{adiHash.slice(-6)}
                          </a>
                        </div>
                      )}

                      {complianceData?.adi_receipt_tx && (
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                          <span style={{ fontSize: 12 }}>&#x2705;</span>
                          <span className={spaceMono.className} style={{ color: "#9A8060", fontSize: 11 }}>Execution Receipt:</span>
                          <a
                            href={txExplorerUrl(complianceData.adi_receipt_tx, "compliant")}
                            target="_blank"
                            rel="noopener noreferrer"
                            className={spaceMono.className}
                            style={{ color: "#60A5FA", fontSize: 11, textDecoration: "underline" }}
                          >
                            {complianceData.adi_receipt_tx.slice(0, 10)}...{complianceData.adi_receipt_tx.slice(-6)}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Reset button */}
                  <button
                    onClick={() => {
                      setStep("idle");
                      setQuery("");
                      setCrossAgent(false);
                      setTxErrorLocal(null);
                      resetAgent();
                      resetHire();
                      resetADI();
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

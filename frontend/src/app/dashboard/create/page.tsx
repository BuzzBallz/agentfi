"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Space_Mono, DM_Sans } from "next/font/google"
import { useAccount } from "wagmi"
import { useMintAgent, useListAgent } from "@/hooks/useMintAgent"
import { registerAgent } from "@/lib/api"

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] })
const dmSans = DM_Sans({ subsets: ["latin"] })

// Public mint — any wallet can create agents

export default function CreateAgentPage() {
  const router = useRouter()
  const { address } = useAccount()

  const [name, setName] = useState("")
  const [description, setDescription] = useState("")
  const [systemPrompt, setSystemPrompt] = useState("")
  const [capabilities, setCapabilities] = useState("")
  const [price, setPrice] = useState("0.001")
  const [tokenURI, setTokenURI] = useState("")
  const [x402Enabled, setX402Enabled] = useState(false)
  const [mintedTokenId, setMintedTokenId] = useState<number | null>(null)
  const [step, setStep] = useState<"form" | "minting" | "registering" | "listing" | "done">("form")
  const [registerError, setRegisterError] = useState<string | null>(null)
  const [listErrorLocal, setListErrorLocal] = useState<string | null>(null)

  const {
    mint,
    mintHash,
    mintPending,
    mintConfirming,
    mintSuccess,
    mintError,
    mintErrorMsg,
    resetMint,
    mintedTokenId: parsedTokenId,
  } = useMintAgent()

  const {
    listAgent,
    listHash,
    listPending,
    listConfirming,
    listSuccess,
    listError,
    listErrorMsg,
    resetList,
  } = useListAgent()

  const handleMint = () => {
    if (!address || !name.trim()) return
    setStep("minting")
    const capsArray = capabilities.split(",").map(c => c.trim()).filter(Boolean)
    const capsJson = JSON.stringify(capsArray)

    // Use pasted tokenURI if provided, otherwise auto-generate a data URI with embedded SVG
    let finalTokenURI = tokenURI.trim()
    if (!finalTokenURI) {
      // Generate a simple branded SVG from the agent name initials
      const initials = name.trim().split(/\s+/).map(w => w[0]?.toUpperCase() || "").join("").slice(0, 2)
      const accentColors = ["#C9A84C", "#7A9E6E", "#C47A5A", "#60A5FA", "#A78BFA"]
      const accent = accentColors[name.length % accentColors.length]
      const agentSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><rect width="200" height="200" fill="#1a1208"/><circle cx="100" cy="80" r="40" fill="none" stroke="${accent}" stroke-width="2" opacity="0.6"/><circle cx="100" cy="80" r="20" fill="${accent}" opacity="0.15"/><circle cx="100" cy="80" r="5" fill="${accent}"/><text x="100" y="88" text-anchor="middle" fill="${accent}" font-family="monospace" font-size="24" font-weight="bold" letter-spacing="6">${initials}</text><text x="100" y="190" text-anchor="middle" fill="${accent}" font-family="monospace" font-size="9" opacity="0.5" letter-spacing="2">ERC-7857 iNFT</text></svg>`
      const svgBytes = new TextEncoder().encode(agentSvg)
      const svgBinary = Array.from(svgBytes, (b) => String.fromCharCode(b)).join("")
      const svgDataUri = `data:image/svg+xml;base64,${btoa(svgBinary)}`

      const metadata = {
        name,
        description,
        image: svgDataUri,
        attributes: [
          { trait_type: "Standard", value: "ERC-7857" },
          { trait_type: "Chain", value: "0G Galileo" },
          { trait_type: "Price", value: `${price} A0GI` },
          ...capsArray.map(c => ({ trait_type: "Capability", value: c })),
        ],
      }
      const metaBytes = new TextEncoder().encode(JSON.stringify(metadata))
      const metaBinary = Array.from(metaBytes, (b) => String.fromCharCode(b)).join("")
      finalTokenURI = `data:application/json;base64,${btoa(metaBinary)}`
    }

    mint(address as `0x${string}`, name, description, capsJson, price, finalTokenURI, systemPrompt || undefined)
  }

  // After mint succeeds, register on backend then move to listing
  useEffect(() => {
    if (!mintSuccess || step !== "minting") return
    if (mintedTokenId !== null) return
    if (parsedTokenId === null) return // Wait for receipt to be parsed

    let cancelled = false
    const tokenId = parsedTokenId
    setMintedTokenId(tokenId)

    // Always register on backend so the agent appears in token-map and is executable
    setStep("registering")
    // Include tokenId in agent_id to avoid collisions when same name is minted twice
    const baseName = name.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "")
    const agentId = `${baseName}_t${tokenId}`
    registerAgent({
      agent_id: agentId,
      name,
      description,
      system_prompt: systemPrompt || `You are ${name}, an AI agent on AgentFi. ${description}`,
      token_id: tokenId,
      price_per_call: parseFloat(price) || 0.001,
      x402_enabled: x402Enabled,
      allow_cross_agent: x402Enabled,
    })
      .then(() => { if (!cancelled) setStep("listing") })
      .catch((err) => {
        if (cancelled) return
        setRegisterError(err.message)
        setStep("listing") // Still allow listing even if registration fails
      })

    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mintSuccess, parsedTokenId])

  // Capture listing errors in persistent local state
  useEffect(() => {
    if (listError && listErrorMsg) {
      const msg = (listErrorMsg as Error)?.message || "Transaction rejected"
      // Extract revert reason if present
      const revertMatch = msg.match(/reason:\s*(.+?)(?:\n|$)/i)
        || msg.match(/reverted with.*?:\s*(.+?)(?:\n|$)/i)
        || msg.match(/execution reverted[:\s]*(.+?)(?:\n|$)/i)
      setListErrorLocal(revertMatch ? revertMatch[1].trim() : msg.slice(0, 200))
    }
  }, [listError, listErrorMsg])

  // Move to done step when listing succeeds
  useEffect(() => {
    if (listSuccess && step === "listing") {
      setStep("done")
    }
  }, [listSuccess, step])

  // After mint succeeds, user can list on marketplace
  const handleList = () => {
    if (mintedTokenId === null) return
    setListErrorLocal(null)
    resetList()
    listAgent(mintedTokenId, price)
  }

  const labelStyle = {
    color: "#5C4A32",
    fontSize: 10,
    letterSpacing: "0.08em",
    marginBottom: 6,
    display: "block" as const,
  }

  const inputStyle = {
    width: "100%",
    background: "#1A1208",
    border: "1px solid #3D2E1A",
    color: "#F5ECD7",
    borderRadius: 8,
    padding: "10px 14px",
    fontSize: 13,
    outline: "none",
    fontFamily: "inherit",
  }

  return (
    <div className={dmSans.className} style={{ maxWidth: 700, margin: "0 auto", padding: "40px 24px 80px" }}>

      {/* Back link */}
      <button
        onClick={() => router.push("/dashboard")}
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
        &larr; Back to Dashboard
      </button>

      <h1
        className={spaceMono.className}
        style={{ fontSize: 28, fontWeight: 700, color: "#F5ECD7", margin: "0 0 8px 0" }}
      >
        Create New Agent
      </h1>
      <p style={{ color: "#9A8060", fontSize: 14, marginBottom: 28 }}>
        Mint an ERC-7857 iNFT on 0G Chain — intelligence hashed on-chain, executable via AI backend
      </p>

      {step === "form" && (
        <div style={{
          background: "#241A0E",
          border: "1px solid #3D2E1A",
          borderRadius: 12,
          padding: 28,
        }}>
          {/* Name */}
          <div style={{ marginBottom: 18 }}>
            <label className={spaceMono.className} style={labelStyle}>NAME</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="e.g. Portfolio Rebalancer"
              className={spaceMono.className}
              style={inputStyle}
            />
          </div>

          {/* Description */}
          <div style={{ marginBottom: 18 }}>
            <label className={spaceMono.className} style={labelStyle}>DESCRIPTION</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="What does this agent do?"
              className={spaceMono.className}
              style={{ ...inputStyle, resize: "vertical" as const, minHeight: 80 }}
            />
          </div>

          {/* System Prompt — the agent's intelligence */}
          <div style={{ marginBottom: 18 }}>
            <label className={spaceMono.className} style={labelStyle}>SYSTEM PROMPT (AI INSTRUCTIONS)</label>
            <textarea
              value={systemPrompt}
              onChange={e => setSystemPrompt(e.target.value)}
              placeholder="You are an AI agent that specializes in..."
              className={spaceMono.className}
              style={{ ...inputStyle, resize: "vertical" as const, minHeight: 120 }}
            />
            <div style={{ color: "#5C4A32", fontSize: 10, marginTop: 4 }}>
              This is the agent&apos;s intelligence — hashed on-chain via metadataHash and stored in encryptedURI (ERC-7857)
            </div>
          </div>

          {/* Capabilities */}
          <div style={{ marginBottom: 18 }}>
            <label className={spaceMono.className} style={labelStyle}>CAPABILITIES (comma-separated)</label>
            <input
              type="text"
              value={capabilities}
              onChange={e => setCapabilities(e.target.value)}
              placeholder="e.g. portfolio analysis, rebalancing, risk assessment"
              className={spaceMono.className}
              style={inputStyle}
            />
          </div>

          {/* Price */}
          <div style={{ marginBottom: 18 }}>
            <label className={spaceMono.className} style={labelStyle}>PRICE PER HIRE (OG)</label>
            <input
              type="text"
              value={price}
              onChange={e => setPrice(e.target.value)}
              placeholder="0.001"
              className={spaceMono.className}
              style={inputStyle}
            />
          </div>

          {/* Token URI (optional — auto-generated if left empty) */}
          <div style={{ marginBottom: 24 }}>
            <label className={spaceMono.className} style={labelStyle}>TOKEN URI (optional)</label>
            <input
              type="text"
              value={tokenURI}
              onChange={e => setTokenURI(e.target.value)}
              placeholder="Leave empty to auto-generate, or paste a URL"
              className={spaceMono.className}
              style={inputStyle}
            />
            <div style={{ color: "#5C4A32", fontSize: 10, marginTop: 4 }}>
              Paste a 0G Storage / IPFS URL with image, or leave empty for auto-generated metadata
            </div>
          </div>

          {/* x402 Cross-Agent Toggle */}
          <div style={{ marginBottom: 24 }}>
            <label
              className={spaceMono.className}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                cursor: "pointer",
                padding: "12px 14px",
                background: x402Enabled ? "rgba(167,139,250,0.08)" : "transparent",
                border: `1px solid ${x402Enabled ? "#A78BFA" : "#3D2E1A"}`,
                borderRadius: 8,
                transition: "all 0.2s",
              }}
            >
              <input
                type="checkbox"
                checked={x402Enabled}
                onChange={e => setX402Enabled(e.target.checked)}
                style={{ display: "none" }}
              />
              <div style={{
                width: 36,
                height: 20,
                borderRadius: 10,
                background: x402Enabled ? "#A78BFA" : "#3D2E1A",
                position: "relative",
                transition: "background 0.2s",
                flexShrink: 0,
              }}>
                <div style={{
                  width: 16,
                  height: 16,
                  borderRadius: 8,
                  background: "#F5ECD7",
                  position: "absolute",
                  top: 2,
                  left: x402Enabled ? 18 : 2,
                  transition: "left 0.2s",
                }} />
              </div>
              <div>
                <div style={{ color: x402Enabled ? "#A78BFA" : "#9A8060", fontSize: 12, fontWeight: 700, letterSpacing: "0.05em" }}>
                  ENABLE x402 CROSS-AGENT
                </div>
                <div style={{ color: "#5C4A32", fontSize: 10, marginTop: 2 }}>
                  Allow other agents to hire this agent via AFC payments on Hedera
                </div>
              </div>
            </label>
          </div>

          {/* Mint button */}
          <button
            onClick={handleMint}
            disabled={!name.trim() || !address}
            className={spaceMono.className}
            style={{
              background: !name.trim() || !address ? "#5C4422" : "#C9A84C",
              color: "#1A1208",
              border: "none",
              borderRadius: 8,
              padding: "12px 28px",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.05em",
              cursor: !name.trim() || !address ? "not-allowed" : "pointer",
            }}
          >
            Mint iNFT &rarr;
          </button>
        </div>
      )}

      {/* Minting state */}
      {step === "minting" && (
        <div style={{
          background: "#241A0E",
          border: "1px solid #3D2E1A",
          borderRadius: 12,
          padding: 28,
          textAlign: "center" as const,
        }}>
          <div className={spaceMono.className} style={{ color: mintError ? "#C47A5A" : "#C9A84C", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            {mintPending ? "Confirm in wallet..." : mintConfirming ? "Confirming on-chain..." : mintError ? "Transaction Failed" : mintHash ? "Processing..." : "Confirm in wallet..."}
          </div>
          {mintHash && (
            <a
              href={`https://chainscan-galileo.0g.ai/tx/${mintHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={spaceMono.className}
              style={{ color: "#C9A84C", fontSize: 11, textDecoration: "underline" }}
            >
              tx: {mintHash.slice(0, 10)}...{mintHash.slice(-6)}
            </a>
          )}
          {mintError && (
            <>
              <div style={{ color: "#C47A5A", fontSize: 13, marginTop: 12 }}>
                Mint failed: {(mintErrorMsg as Error)?.message?.slice(0, 100) || "Transaction rejected"}
              </div>
              <button
                onClick={() => { resetMint(); setStep("form") }}
                className={spaceMono.className}
                style={{
                  background: "none",
                  border: "1px solid #3D2E1A",
                  color: "#9A8060",
                  borderRadius: 8,
                  padding: "10px 24px",
                  fontSize: 12,
                  cursor: "pointer",
                  marginTop: 16,
                }}
              >
                &larr; Try Again
              </button>
            </>
          )}
        </div>
      )}

      {/* Registering on backend */}
      {step === "registering" && (
        <div style={{
          background: "#241A0E",
          border: "1px solid #3D2E1A",
          borderRadius: 12,
          padding: 28,
          textAlign: "center" as const,
        }}>
          <div className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            Registering AI agent on backend...
          </div>
        </div>
      )}

      {/* Listing state */}
      {step === "listing" && (
        <div style={{
          background: "#241A0E",
          border: "1px solid #3D2E1A",
          borderRadius: 12,
          padding: 28,
        }}>
          <div className={spaceMono.className} style={{ color: "#7A9E6E", fontSize: 14, fontWeight: 700, marginBottom: 12 }}>
            iNFT Minted Successfully!
          </div>
          {registerError && (
            <div style={{ color: "#C47A5A", fontSize: 11, marginBottom: 12 }}>
              Backend registration warning: {registerError}
            </div>
          )}
          <div style={{ color: "#9A8060", fontSize: 13, marginBottom: 20 }}>
            Token ID: <span className={spaceMono.className} style={{ color: "#C9A84C" }}>#{mintedTokenId}</span>
            {" \u2014 "}Now list it on the marketplace.
          </div>

          {!listPending && !listConfirming && !listErrorLocal && (
            <button
              onClick={handleList}
              className={spaceMono.className}
              style={{
                background: "#C9A84C",
                color: "#1A1208",
                border: "none",
                borderRadius: 8,
                padding: "12px 28px",
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: "0.05em",
                cursor: "pointer",
              }}
            >
              List on Marketplace &rarr;
            </button>
          )}

          {(listPending || listConfirming) && (
            <div className={spaceMono.className} style={{ color: "#C9A84C", fontSize: 13 }}>
              {listPending ? "Confirm in wallet..." : "Confirming listing..."}
            </div>
          )}

          {listHash && (
            <a
              href={`https://chainscan-galileo.0g.ai/tx/${listHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className={spaceMono.className}
              style={{ color: "#C9A84C", fontSize: 11, textDecoration: "underline", display: "block", marginTop: 8 }}
            >
              tx: {listHash.slice(0, 10)}...{listHash.slice(-6)}
            </a>
          )}

          {listErrorLocal && (
            <div style={{ marginTop: 12 }}>
              <div style={{ color: "#C47A5A", fontSize: 13 }}>
                Listing failed: {listErrorLocal}
              </div>
              <button
                onClick={handleList}
                className={spaceMono.className}
                style={{
                  background: "none",
                  border: "1px solid #3D2E1A",
                  color: "#9A8060",
                  borderRadius: 8,
                  padding: "10px 24px",
                  fontSize: 12,
                  cursor: "pointer",
                  marginTop: 12,
                }}
              >
                &larr; Try Again
              </button>
              <button
                onClick={() => router.push(`/agent/${mintedTokenId}`)}
                className={spaceMono.className}
                style={{
                  background: "none",
                  border: "none",
                  color: "#5C4A32",
                  fontSize: 11,
                  cursor: "pointer",
                  marginTop: 8,
                  display: "block",
                  textDecoration: "underline",
                }}
              >
                Skip listing — view agent
              </button>
            </div>
          )}
        </div>
      )}

      {/* Done state */}
      {step === "done" && (
        <div style={{
          background: "#241A0E",
          border: "1px solid rgba(122,158,110,0.3)",
          borderRadius: 12,
          padding: 28,
          textAlign: "center" as const,
        }}>
          <div className={spaceMono.className} style={{ color: "#7A9E6E", fontSize: 18, fontWeight: 700, marginBottom: 8 }}>
            Agent Created & Listed!
          </div>
          <div style={{ color: "#9A8060", fontSize: 14, marginBottom: 20 }}>
            Your new agent &ldquo;{name}&rdquo; is now live on the marketplace.
          </div>
          <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
            <button
              onClick={() => router.push(`/agent/${mintedTokenId}`)}
              className={spaceMono.className}
              style={{
                background: "#C9A84C",
                color: "#1A1208",
                border: "none",
                borderRadius: 8,
                padding: "10px 24px",
                fontSize: 12,
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              View Agent &rarr;
            </button>
            <button
              onClick={() => router.push("/marketplace")}
              className={spaceMono.className}
              style={{
                background: "none",
                border: "1px solid #3D2E1A",
                color: "#9A8060",
                borderRadius: 8,
                padding: "10px 24px",
                fontSize: 12,
                cursor: "pointer",
              }}
            >
              Marketplace
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

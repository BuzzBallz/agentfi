"use client"
import { ConnectButton } from "@rainbow-me/rainbowkit"
import { useDisconnect } from "wagmi"
import { useState } from "react"
import GlitchText from "./GlitchText"

export default function WalletConnect() {
  const [hovered, setHovered] = useState(false)
  const [accountHovered, setAccountHovered] = useState(false)
  const { disconnect } = useDisconnect()

  return (
    <ConnectButton.Custom>
      {({ account, chain, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted
        if (!ready) return null

        // Connected state — show address button
        if (account && chain) {
          return (
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {/* Chain button */}
              <button
                onClick={openChainModal}
                style={{
                  background: "#241A0E",
                  border: "1px solid #3D2E1A",
                  borderRadius: 8,
                  padding: "6px 12px",
                  color: "#9A8060",
                  fontFamily: "monospace",
                  fontSize: 11,
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                  transition: "border-color 0.2s",
                }}
                onMouseOver={e => (e.currentTarget.style.borderColor = "#5C4422")}
                onMouseOut={e => (e.currentTarget.style.borderColor = "#3D2E1A")}
              >
                {chain.name}
              </button>

              {/* Account button — hover to see Disconnect, click to disconnect */}
              <button
                onClick={() => disconnect()}
                onMouseEnter={() => setAccountHovered(true)}
                onMouseLeave={() => setAccountHovered(false)}
                style={{
                  background: accountHovered ? "#2E1010" : "#241A0E",
                  border: `1px solid ${accountHovered ? "#C45A5A" : "#5C4422"}`,
                  borderRadius: 8,
                  padding: "6px 16px",
                  color: accountHovered ? "#C45A5A" : "#C9A84C",
                  fontFamily: "monospace",
                  fontSize: 12,
                  fontWeight: "bold",
                  cursor: "pointer",
                  letterSpacing: "0.08em",
                  transition: "background 0.2s, border-color 0.2s, color 0.2s",
                  minWidth: 120,
                  textAlign: "center",
                }}
              >
                {accountHovered
                  ? "Disconnect"
                  : `${account.address.slice(0, 4)}****${account.address.slice(-4)}`}
              </button>
            </div>
          )
        }

        // Disconnected state — Connect Wallet with GlitchText on hover
        return (
          <button
            onClick={openConnectModal}
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            style={{
              background: "transparent",
              border: "1px solid #5C4422",
              borderRadius: 8,
              padding: "6px 16px",
              color: "#C9A84C",
              fontFamily: "monospace",
              fontSize: 12,
              fontWeight: "bold",
              cursor: "pointer",
              letterSpacing: "0.08em",
              transition: "background 0.2s, border-color 0.2s",
              minWidth: 140,
            }}
            onMouseOver={e => {
              e.currentTarget.style.background = "rgba(201,168,76,0.06)"
              e.currentTarget.style.borderColor = "#C9A84C"
            }}
            onMouseOut={e => {
              e.currentTarget.style.background = "transparent"
              e.currentTarget.style.borderColor = "#5C4422"
            }}
          >
            {hovered ? (
              <GlitchText speed={0.3} enableOnHover={false}>
                Connect Wallet
              </GlitchText>
            ) : (
              "Connect Wallet"
            )}
          </button>
        )
      }}
    </ConnectButton.Custom>
  )
}

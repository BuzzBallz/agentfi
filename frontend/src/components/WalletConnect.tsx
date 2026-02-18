"use client"

import { useState, useEffect } from "react"
import { useAccount, useConnect, useDisconnect } from "wagmi"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

function shortenAddress(address: string): string {
  return `${address.slice(0, 4)}****${address.slice(-4)}`
}

export default function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // When connection succeeds, close modal and reset loading
  useEffect(() => {
    if (isConnected) {
      setShowModal(false)
      setIsLoading(false)
    }
  }, [isConnected])

  // Track loading state when connector is pending
  useEffect(() => {
    setIsLoading(isPending)
  }, [isPending])

  // Connected state — show shortened address
  if (isConnected && address) {
    return (
      <div className="flex items-center gap-3">
        <Button variant="ghost" className="font-mono text-sm tracking-wider">
          {shortenAddress(address)}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => disconnect()}
          className="text-xs"
        >
          Disconnect
        </Button>
      </div>
    )
  }

  // Loading state — spinner while modal is open or connector pending
  if (isLoading || (showModal && isPending)) {
    return (
      <Button variant="ghost" disabled>
        <Spinner />
        Connecting...
      </Button>
    )
  }

  return (
    <>
      {/* Connect Wallet Button */}
      <Button
        variant="ghost"
        onClick={() => setShowModal(true)}
      >
        Connect Wallet
      </Button>

      {/* Modal overlay */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center"
          style={{ background: "rgba(10, 6, 2, 0.85)" }}
          onClick={(e) => {
            // Close on backdrop click
            if (e.target === e.currentTarget) {
              setShowModal(false)
              setIsLoading(false)
            }
          }}
        >
          <div
            className="relative rounded-xl p-6 w-80"
            style={{
              background: "#241A0E",
              border: "1px solid #5C4422",
            }}
          >
            {/* Close button */}
            <button
              onClick={() => {
                setShowModal(false)
                setIsLoading(false)
              }}
              className="absolute top-4 right-4 text-sm transition-colors"
              style={{ color: "#9A8060" }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#F5ECD7")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#9A8060")}
              aria-label="Close"
            >
              ✕
            </button>

            <h2
              className="text-lg font-semibold mb-1"
              style={{ color: "#F5ECD7", fontFamily: "monospace" }}
            >
              Connect Wallet
            </h2>
            <p className="text-sm mb-5" style={{ color: "#9A8060" }}>
              Choose your wallet to connect to AgentFi
            </p>

            <div className="flex flex-col gap-3">
              {connectors.map((connector) => (
                <Button
                  key={connector.uid}
                  variant="outline"
                  className="w-full justify-start gap-3 py-3 h-auto"
                  onClick={() => {
                    setIsLoading(true)
                    connect({ connector })
                  }}
                >
                  <span className="text-base">
                    {connector.name === "MetaMask" ? "🦊" :
                     connector.name === "Coinbase Wallet" ? "🔵" :
                     connector.name === "WalletConnect" ? "🔗" : "👛"}
                  </span>
                  <span>{connector.name}</span>
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

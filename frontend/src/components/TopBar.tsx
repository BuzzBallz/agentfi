"use client"
import { useSidebar } from "@/components/ui/sidebar"
import Link from "next/link"
import WalletConnect from "./WalletConnect"
import { useAppMode } from "@/context/AppModeContext"

export default function TopBar() {
  const { open, setOpen } = useSidebar()
  const { mode, setMode } = useAppMode()

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, height: 60, zIndex: 100,
      background: "#1A1208", borderBottom: "1px solid #3D2E1A",
      display: "flex", alignItems: "center",
      padding: "0 24px",
    }}>
      {/* Hamburger */}
      <button
        onClick={() => setOpen(!open)}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: 6, padding: 4 }}
        aria-label="Toggle menu"
      >
        <div style={{ width: 24, height: 2, background: "#C9A84C", transition: "all 0.3s", transform: open ? "translateY(4px) rotate(45deg)" : "none" }} />
        <div style={{ width: 24, height: 2, background: "#C9A84C", transition: "all 0.3s", transform: open ? "translateY(-4px) rotate(-45deg)" : "none" }} />
      </button>

      {/* Logo — centered, links to home */}
      <Link href="/" style={{ textDecoration: "none", position: "absolute", left: "50%", transform: "translateX(-50%)" }}>
        <span
          style={{
            fontFamily: "monospace",
            fontSize: 18,
            fontWeight: "bold",
            color: "#C9A84C",
            letterSpacing: "0.05em",
            cursor: "pointer",
            transition: "opacity 0.2s",
          }}
          onMouseOver={(e) => (e.currentTarget.style.opacity = "0.7")}
          onMouseOut={(e) => (e.currentTarget.style.opacity = "1")}
        >
          AgentFi
        </span>
      </Link>

      {/* Right side: mode toggle + wallet */}
      <div style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 12 }}>
        {/* Mode toggle */}
        <div style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          background: "#1A1208",
          border: "1px solid #3D2E1A",
          borderRadius: 8,
          padding: "6px 8px",
        }}>
          <button
            onClick={() => setMode("compliant")}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.12em",
              padding: "5px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: mode === "compliant" ? "#C9A84C" : "transparent",
              color: mode === "compliant" ? "#0D0802" : "#5C4422",
              fontWeight: 700,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {mode === "compliant" && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#7A9E6E", flexShrink: 0 }} />
            )}
            COMPLIANT
          </button>
          <button
            onClick={() => setMode("permissionless")}
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: 9,
              letterSpacing: "0.12em",
              padding: "5px 12px",
              borderRadius: 6,
              border: "none",
              cursor: "pointer",
              background: mode === "permissionless" ? "#C9A84C" : "transparent",
              color: mode === "permissionless" ? "#0D0802" : "#5C4422",
              fontWeight: 700,
              transition: "all 0.2s",
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {mode === "permissionless" && (
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#C9A84C", flexShrink: 0 }} />
            )}
            PERMISSIONLESS
          </button>
        </div>

        <WalletConnect />
      </div>
    </div>
  )
}

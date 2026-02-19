"use client"
import { useSidebar } from "@/components/ui/sidebar"
import GlitchText from "./GlitchText"
import Link from "next/link"

export default function TopBar() {
  const { open, setOpen } = useSidebar()
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, height: 60, zIndex: 100,
      background: "#1A1208", borderBottom: "1px solid #3D2E1A",
      display: "flex", alignItems: "center", justifyContent: "space-between",
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

      {/* Logo */}
      <Link href="/" style={{ textDecoration: "none" }}>
        <GlitchText speed={0.4} enableOnHover>AgentFi</GlitchText>
      </Link>

      {/* Spacer for balance */}
      <div style={{ width: 32 }} />
    </div>
  )
}

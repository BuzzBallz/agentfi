"use client"
import { useSidebar } from "@/components/ui/sidebar"
import Link from "next/link"

export default function TopBar() {
  const { open, setOpen } = useSidebar()
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
    </div>
  )
}

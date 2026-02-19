"use client";

import Link from "next/link";
import WalletConnect from "./WalletConnect";

export default function Navbar() {
  return (
    <nav
      className="flex items-center justify-between px-6 py-4"
      style={{ background: "#1A1208", borderBottom: "1px solid #3D2E1A" }}
    >
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold" style={{ color: "#C9A84C" }}>
          AgentFi
        </Link>
        <div className="flex gap-6 text-sm">
          <Link
            href="/marketplace"
            className="transition-colors"
            style={{ color: "#9A8060" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#F5ECD7")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9A8060")}
          >
            Marketplace
          </Link>
          <Link
            href="/my-agents"
            className="transition-colors"
            style={{ color: "#9A8060" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#F5ECD7")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9A8060")}
          >
            My Agents
          </Link>
          <Link
            href="/dashboard"
            className="transition-colors"
            style={{ color: "#9A8060" }}
            onMouseEnter={(e) => (e.currentTarget.style.color = "#F5ECD7")}
            onMouseLeave={(e) => (e.currentTarget.style.color = "#9A8060")}
          >
            Dashboard
          </Link>
        </div>
      </div>
      <WalletConnect />
    </nav>
  );
}

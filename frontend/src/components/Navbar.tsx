import Link from "next/link";
import WalletConnect from "./WalletConnect";

export default function Navbar() {
  return (
    <nav className="flex items-center justify-between border-b border-gray-800 bg-gray-950 px-6 py-4">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-xl font-bold text-white">
          AgentFi
        </Link>
        <div className="flex gap-6 text-sm text-gray-400">
          <Link
            href="/marketplace"
            className="transition-colors hover:text-white"
          >
            Marketplace
          </Link>
          <Link
            href="/my-agents"
            className="transition-colors hover:text-white"
          >
            My Agents
          </Link>
          <Link
            href="/dashboard"
            className="transition-colors hover:text-white"
          >
            Dashboard
          </Link>
        </div>
      </div>
      <WalletConnect />
    </nav>
  );
}

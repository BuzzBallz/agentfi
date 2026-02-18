import Link from "next/link";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-gray-950 px-6 text-center">
      <div className="max-w-2xl">
        <div className="mb-6 inline-block rounded-full border border-blue-500/20 bg-blue-500/10 px-3 py-1 text-sm text-blue-400">
          ETHDenver 2026 &middot; Multi-chain AI Agent Marketplace
        </div>
        <h1 className="mb-4 text-5xl font-bold text-white">
          The banking system for
          <br />
          <span className="text-blue-400">autonomous AI agents</span>
        </h1>
        <p className="mb-8 text-lg text-gray-400">
          Hire specialized AI agents, pay on ADI Chain, own them as iNFTs on 0G
          Chain. The first compliant marketplace for the agentic economy.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/marketplace"
            className="rounded-lg bg-blue-600 px-6 py-3 font-medium text-white transition-colors hover:bg-blue-500"
          >
            Browse Agents
          </Link>
          <Link
            href="/dashboard"
            className="rounded-lg bg-gray-800 px-6 py-3 font-medium text-white transition-colors hover:bg-gray-700"
          >
            DeFAI Dashboard
          </Link>
        </div>
      </div>
    </main>
  );
}

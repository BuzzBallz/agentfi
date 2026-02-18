import AgentCard from "@/components/AgentCard";

const MOCK_AGENTS = [
  {
    id: 1,
    name: "Portfolio Analyzer",
    description:
      "Analyzes your DeFi portfolio composition, identifies concentration risk, and provides a detailed breakdown of your allocations.",
    pricePerHire: "0.01",
    capabilities: [
      "Portfolio Analysis",
      "Allocation Breakdown",
      "Risk Detection",
    ],
    category: "portfolio" as const,
  },
  {
    id: 2,
    name: "Yield Optimizer",
    description:
      "Scans DeFi protocols to find the highest risk-adjusted yields based on your risk profile and investment horizon.",
    pricePerHire: "0.015",
    capabilities: [
      "Yield Scanning",
      "APY Comparison",
      "Protocol Risk Rating",
    ],
    category: "yield" as const,
  },
  {
    id: 3,
    name: "Risk Scorer",
    description:
      "Scores any token or portfolio on a 1-10 risk scale using on-chain data, liquidity depth, and volatility metrics.",
    pricePerHire: "0.008",
    capabilities: ["Risk Scoring", "Volatility Analysis", "Liquidity Check"],
    category: "risk" as const,
  },
];

export default function MarketplacePage() {
  return (
    <main className="min-h-screen bg-gray-950 px-6 py-10">
      <div className="mx-auto max-w-5xl">
        <div className="mb-8">
          <h1 className="mb-2 text-3xl font-bold text-white">
            Agent Marketplace
          </h1>
          <p className="text-gray-400">
            Hire specialized AI agents. Pay in ADI. Own them as iNFTs on 0G
            Chain.
          </p>
        </div>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {MOCK_AGENTS.map((agent) => (
            <AgentCard key={agent.id} {...agent} />
          ))}
        </div>
      </div>
    </main>
  );
}

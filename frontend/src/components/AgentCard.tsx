import Link from "next/link";

interface AgentCardProps {
  id: number;
  name: string;
  description: string;
  pricePerHire: string;
  capabilities: string[];
  category: "portfolio" | "yield" | "risk";
}

const CATEGORY_COLORS = {
  portfolio: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  yield: "bg-green-500/10 text-green-400 border-green-500/20",
  risk: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export default function AgentCard({
  id,
  name,
  description,
  pricePerHire,
  capabilities,
  category,
}: AgentCardProps) {
  return (
    <div className="rounded-xl border border-gray-800 bg-gray-900 p-6 transition-colors hover:border-gray-600">
      <div className="mb-3 flex items-start justify-between">
        <h3 className="text-lg font-semibold text-white">{name}</h3>
        <span
          className={`rounded-full border px-2 py-1 text-xs ${CATEGORY_COLORS[category]}`}
        >
          {category}
        </span>
      </div>
      <p className="mb-4 line-clamp-2 text-sm text-gray-400">{description}</p>
      <div className="mb-4 flex flex-wrap gap-2">
        {capabilities.map((cap) => (
          <span
            key={cap}
            className="rounded bg-gray-800 px-2 py-1 text-xs text-gray-300"
          >
            {cap}
          </span>
        ))}
      </div>
      <div className="flex items-center justify-between">
        <span className="font-medium text-white">
          {pricePerHire} <span className="text-sm text-gray-400">ADI</span>
        </span>
        <Link
          href={`/agent/${id}`}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white transition-colors hover:bg-blue-500"
        >
          View Agent
        </Link>
      </div>
    </div>
  );
}

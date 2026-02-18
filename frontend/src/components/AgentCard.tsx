"use client";

interface AgentCardProps {
  id: number;
  name: string;
  description: string;
  pricePerHire: string;
  capabilities: string[];
}

export default function AgentCard({
  id,
  name,
  description,
  pricePerHire,
  capabilities,
}: AgentCardProps) {
  return (
    <div className="rounded-xl border p-6 shadow-sm">
      <h3 className="text-lg font-semibold">
        #{id} — {name}
      </h3>
      <p className="mt-2 text-gray-500">{description}</p>
      <p className="mt-2 font-mono text-sm">{pricePerHire} per hire</p>
      <div className="mt-3 flex flex-wrap gap-2">
        {capabilities.map((cap) => (
          <span
            key={cap}
            className="rounded bg-gray-100 px-2 py-1 text-xs text-gray-700"
          >
            {cap}
          </span>
        ))}
      </div>
    </div>
  );
}

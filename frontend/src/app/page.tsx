import Link from "next/link";

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-6">
      <h1 className="text-5xl font-bold">AgentFi</h1>
      <p className="text-xl text-gray-500">
        The banking system for autonomous AI agents.
      </p>
      <Link
        href="/marketplace"
        className="rounded-lg bg-blue-600 px-6 py-3 text-white hover:bg-blue-700"
      >
        Enter Marketplace
      </Link>
    </div>
  );
}

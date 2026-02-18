export default function AgentPage({ params }: { params: { id: string } }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold">Agent #{params.id}</h1>
      {/* TODO: Fetch agent data using useAgentData hook */}
      {/* TODO: Display agent metadata, capabilities, and pricing */}
      {/* TODO: Integrate HireButton with payment flow */}
    </div>
  );
}

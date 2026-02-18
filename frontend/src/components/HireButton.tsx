"use client";

interface HireButtonProps {
  agentId: number;
  price: string;
  onSuccess?: () => void;
}

export default function HireButton({ agentId, price, onSuccess }: HireButtonProps) {
  // TODO: Integrate wagmi useWriteContract to call AgentMarketplace.hireAgent()
  // TODO: Use useWaitForTransactionReceipt to confirm the transaction
  // TODO: Call onSuccess() after successful hire

  const handleHire = () => {
    void agentId;
    void price;
    onSuccess?.();
  };

  return (
    <button
      onClick={handleHire}
      className="rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700"
    >
      Hire Agent
    </button>
  );
}

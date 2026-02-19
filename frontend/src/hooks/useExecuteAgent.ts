import { useState } from "react";
import { executeAgent } from "@/lib/api";

export function useExecuteAgent() {
  const [result, setResult] = useState<string | null>(null);
  const [hederaProof, setHederaProof] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (tokenId: number, query: string) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setHederaProof(null);
    try {
      const res = await executeAgent(tokenId, query);
      if (res.success) {
        setResult(typeof res.data === "string" ? res.data : JSON.stringify(res.data));
        setHederaProof(res.hedera_proof || null);
      } else {
        setError(res.error || "Agent execution failed");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  return { execute, result, hederaProof, isLoading, error };
}

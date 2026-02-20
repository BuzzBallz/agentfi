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
        // Backend returns { data: { result: "...", hedera_proof: {...} } }
        // or { data: "plain string" } for simple responses
        if (typeof res.data === "string") {
          setResult(res.data);
        } else if (res.data && typeof res.data === "object") {
          setResult(res.data.result || JSON.stringify(res.data));
          setHederaProof(res.data.hedera_proof || null);
        }
        // Fallback: check top-level hedera_proof
        if (res.hedera_proof) {
          setHederaProof(res.hedera_proof);
        }
      } else {
        setError(res.error || "Agent execution failed");
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setResult(null);
    setHederaProof(null);
    setIsLoading(false);
    setError(null);
  };

  return { execute, result, hederaProof, isLoading, error, reset };
}

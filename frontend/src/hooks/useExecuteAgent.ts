import { useState } from "react";
import { executeAgent } from "@/lib/api";

export function useExecuteAgent() {
  const [result, setResult] = useState<string | null>(null);
  const [hederaProof, setHederaProof] = useState<any>(null);
  const [afcReward, setAfcReward] = useState<any>(null);
  const [crossAgentReport, setCrossAgentReport] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const execute = async (
    tokenId: number,
    query: string,
    walletAddress?: string,
    crossAgent?: boolean,
  ) => {
    setIsLoading(true);
    setError(null);
    setResult(null);
    setHederaProof(null);
    setAfcReward(null);
    setCrossAgentReport(null);
    try {
      const res = await executeAgent(tokenId, query, walletAddress, crossAgent);
      if (res.success) {
        // Backend returns { data: { result: "...", hedera_proof: {...}, afc_reward: {...}, cross_agent: {...} } }
        // or { data: "plain string" } for simple responses
        if (typeof res.data === "string") {
          setResult(res.data);
        } else if (res.data && typeof res.data === "object") {
          setResult(res.data.result || JSON.stringify(res.data));
          setHederaProof(res.data.hedera_proof || null);
          setAfcReward(res.data.afc_reward || null);
          setCrossAgentReport(res.data.cross_agent || null);
        }
        // Fallback: check top-level fields
        if (res.hedera_proof) {
          setHederaProof(res.hedera_proof);
        }
        if (res.afc_reward) {
          setAfcReward(res.afc_reward);
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
    setAfcReward(null);
    setCrossAgentReport(null);
    setIsLoading(false);
    setError(null);
  };

  return { execute, result, hederaProof, afcReward, crossAgentReport, isLoading, error, reset };
}

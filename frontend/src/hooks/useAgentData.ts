import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import AgentNFTAbi from '@/abi/AgentNFT.json';

export function useAgentData(tokenId: number) {
  const { data, isLoading, isError } = useReadContract({
    address: CONTRACT_ADDRESSES.AgentNFT as `0x${string}`,
    abi: AgentNFTAbi,
    functionName: 'getAgentData',
    args: [BigInt(tokenId)],
    chainId: 16600,
  });

  // viem decodes struct as object with named fields
  const agentData = data
    ? {
        modelHash: (data as any).modelHash ?? (data as any)[0],
        systemPrompt: (data as any).systemPrompt ?? (data as any)[1],
        capabilities: JSON.parse(
          (data as any).capabilities ?? (data as any)[2] ?? '[]',
        ),
        pricePerCall: (data as any).pricePerCall ?? (data as any)[3],
        priceDisplay:
          Number((data as any).pricePerCall ?? (data as any)[3]) / 1e18,
      }
    : null;

  return { agentData, isLoading, isError };
}

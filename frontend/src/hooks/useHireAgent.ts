import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import AgentMarketplaceAbi from '@/abi/AgentMarketplace.json';

export function useHireAgent() {
  const { writeContract, data: hash, isPending, isError, error } =
    useWriteContract();

  const { isLoading: isConfirming, isSuccess } =
    useWaitForTransactionReceipt({ hash });

  const hireAgent = (tokenId: number, priceInWei: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.AgentMarketplace as `0x${string}`,
      abi: AgentMarketplaceAbi,
      functionName: 'hireAgent',
      args: [BigInt(tokenId)],
      value: priceInWei,
      chainId: 16600,
    });
  };

  return { hireAgent, isPending, isConfirming, isSuccess, hash, isError, error };
}

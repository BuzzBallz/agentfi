import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import AgentMarketplacev2Abi from '@/abi/AgentMarketplacev2.json';

export function useHireAgent() {
  const { writeContract, data: hash, isPending, isError, error, reset } =
    useWriteContract();

  const { isLoading: isConfirming, isSuccess, isError: receiptError, error: receiptErrorMsg } =
    useWaitForTransactionReceipt({ hash });

  const hireAgent = (tokenId: number, priceInWei: bigint) => {
    writeContract({
      address: CONTRACT_ADDRESSES.AgentMarketplace as `0x${string}`,
      abi: AgentMarketplacev2Abi,
      functionName: 'hireAgent',
      args: [BigInt(tokenId)],
      value: priceInWei,
      chainId: 16602,
    });
  };

  // Owner can call hire with 0 value (free bypass)
  const hireAsOwner = (tokenId: number) => {
    writeContract({
      address: CONTRACT_ADDRESSES.AgentMarketplace as `0x${string}`,
      abi: AgentMarketplacev2Abi,
      functionName: 'hireAgent',
      args: [BigInt(tokenId)],
      value: BigInt(0),
      chainId: 16602,
    });
  };

  return {
    hireAgent,
    hireAsOwner,
    isPending,
    isConfirming,
    isSuccess,
    hash,
    isError: isError || receiptError,
    error: error || receiptErrorMsg,
    reset,
  };
}

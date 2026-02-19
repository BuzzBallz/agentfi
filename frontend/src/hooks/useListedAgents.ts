import { useReadContract } from 'wagmi';
import { CONTRACT_ADDRESSES } from '@/config/contracts';
import AgentMarketplaceAbi from '@/abi/AgentMarketplace.json';

export function useListedAgents() {
  const { data, isLoading, isError, refetch } = useReadContract({
    address: CONTRACT_ADDRESSES.AgentMarketplace as `0x${string}`,
    abi: AgentMarketplaceAbi,
    functionName: 'getListedAgents',
    chainId: 16600,
  });

  // viem decodes tuple[] with named components as an array of objects
  const agents = data
    ? (data as any[])
        .map((listing: any) => ({
          tokenId: Number(listing.tokenId ?? listing[0]),
          owner: (listing.owner ?? listing[1]) as string,
          pricePerHire: listing.pricePerHire ?? listing[2], // keep as bigint for tx
          priceDisplay: Number(listing.pricePerHire ?? listing[2]) / 1e18,
          active: listing.active ?? listing[3],
        }))
        .filter((a) => a.active)
    : [];

  return { agents, isLoading, isError, refetch };
}

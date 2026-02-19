import { useAccount, useReadContract } from "wagmi";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import AgentMarketplaceAbi from "@/abi/AgentMarketplace.json";

export function useMyAgents() {
  const { address } = useAccount();

  // Get all listed agents, then filter by owner === connected wallet
  const { data: listings, isLoading, isError } = useReadContract({
    address: CONTRACT_ADDRESSES.AgentMarketplace as `0x${string}`,
    abi: AgentMarketplaceAbi,
    functionName: "getListedAgents",
    chainId: 16600,
  });

  const myAgents =
    listings && address
      ? (listings as any[])
          .filter((l: any) => {
            const owner = (l.owner ?? l[1]) as string;
            return owner.toLowerCase() === address.toLowerCase();
          })
          .map((l: any) => ({
            tokenId: Number(l.tokenId ?? l[0]),
            pricePerHire: l.pricePerHire ?? l[2],
            active: l.active ?? l[3],
          }))
      : [];

  return { myAgents, isConnected: !!address, address, isLoading, isError };
}

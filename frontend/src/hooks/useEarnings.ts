import { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem, formatEther } from "viem";
import { CONTRACT_ADDRESSES } from "@/config/contracts";
import { useMyAgents } from "@/hooks/useMyAgents";

interface Earnings {
  totalEarned: bigint;
  totalHires: number;
  loading: boolean;
}

const AGENT_HIRED_EVENT = parseAbiItem(
  "event AgentHired(uint256 indexed tokenId, address indexed hirer, uint256 totalPaid, uint256 ownerPayment, uint256 platformFee)"
);

export function useEarnings(): Earnings {
  const { address } = useAccount();
  const { myAgents } = useMyAgents();
  const publicClient = usePublicClient({ chainId: 16602 });
  const [totalEarned, setTotalEarned] = useState<bigint>(BigInt(0));
  const [totalHires, setTotalHires] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address || !publicClient || myAgents.length === 0) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchEarnings() {
      try {
        const marketplaceAddress = CONTRACT_ADDRESSES.AgentMarketplace as `0x${string}`;
        if (!marketplaceAddress) { setLoading(false); return; }

        // Fetch AgentHired events for each owned tokenId
        let earned = BigInt(0);
        let hires = 0;

        for (const agent of myAgents) {
          try {
            const logs = await publicClient!.getLogs({
              address: marketplaceAddress,
              event: AGENT_HIRED_EVENT,
              args: { tokenId: BigInt(agent.tokenId) },
              fromBlock: BigInt(0),
              toBlock: "latest",
            });

            for (const log of logs) {
              const ownerPayment = log.args.ownerPayment;
              if (ownerPayment) {
                earned += ownerPayment;
              }
              hires++;
            }
          } catch {
            // Individual token query failed — continue with others
          }
        }

        if (cancelled) return;
        setTotalEarned(earned);
        setTotalHires(hires);
      } catch {
        // Non-fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchEarnings();

    // Refresh every 60 seconds
    const interval = setInterval(fetchEarnings, 60_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [address, publicClient, myAgents]);

  return { totalEarned, totalHires, loading };
}

/** Format bigint wei to display string */
export function formatEarnings(wei: bigint): string {
  return formatEther(wei);
}

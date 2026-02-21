import { useState, useEffect } from "react";
import { useAccount, usePublicClient } from "wagmi";
import { parseAbiItem, formatEther } from "viem";
import { CONTRACT_ADDRESSES } from "@/config/contracts";

export interface ActivityLine {
  time: string;
  agent: string;
  msg: string;
  ok: boolean;
  blockNumber: bigint;
}

const AGENT_HIRED_EVENT = parseAbiItem(
  "event AgentHired(uint256 indexed tokenId, address indexed hirer, uint256 totalPaid, uint256 ownerPayment, uint256 platformFee)"
);

const AGENT_USED_BY_OWNER_EVENT = parseAbiItem(
  "event AgentUsedByOwner(uint256 indexed tokenId, address indexed owner)"
);

const FALLBACK_NAMES: Record<number, string> = {
  0: "Portfolio Analyzer",
  1: "Yield Optimizer",
  2: "Risk Scorer",
};

function shortenAddr(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

function relativeTime(blockTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = now - blockTimestamp;
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function useLiveActivity(): { lines: ActivityLine[]; loading: boolean } {
  const { address } = useAccount();
  const publicClient = usePublicClient({ chainId: 16602 });
  const [lines, setLines] = useState<ActivityLine[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!address || !publicClient) {
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchActivity() {
      try {
        const marketplace = CONTRACT_ADDRESSES.AgentMarketplace as `0x${string}`;
        if (!marketplace) { setLoading(false); return; }

        // Fetch hire events and owner-use events in parallel
        const [hireLogs, ownerLogs] = await Promise.all([
          publicClient!.getLogs({
            address: marketplace,
            event: AGENT_HIRED_EVENT,
            fromBlock: BigInt(0),
            toBlock: "latest",
          }),
          publicClient!.getLogs({
            address: marketplace,
            event: AGENT_USED_BY_OWNER_EVENT,
            fromBlock: BigInt(0),
            toBlock: "latest",
          }),
        ]);

        if (cancelled) return;

        // Collect unique block numbers to fetch timestamps
        const blockNums = new Set<bigint>();
        for (const log of [...hireLogs, ...ownerLogs]) {
          if (log.blockNumber) blockNums.add(log.blockNumber);
        }

        // Fetch block timestamps (limit to last 20 blocks to avoid overload)
        const sortedBlocks = [...blockNums].sort((a, b) => Number(b - a)).slice(0, 20);
        const blockTimestamps: Record<string, number> = {};
        await Promise.all(
          sortedBlocks.map(async (bn) => {
            try {
              const block = await publicClient!.getBlock({ blockNumber: bn });
              blockTimestamps[bn.toString()] = Number(block.timestamp);
            } catch {
              // ignore individual block fetch failures
            }
          })
        );

        if (cancelled) return;

        // Build activity lines from hire events
        const activity: ActivityLine[] = [];

        for (const log of hireLogs) {
          const bn = log.blockNumber;
          if (!bn || !blockTimestamps[bn.toString()]) continue;
          const tokenId = Number(log.args.tokenId ?? 0);
          const hirer = log.args.hirer as string;
          const paid = log.args.totalPaid as bigint;
          const agentName = FALLBACK_NAMES[tokenId] || `Agent #${tokenId}`;
          activity.push({
            time: relativeTime(blockTimestamps[bn.toString()]),
            agent: agentName,
            msg: `hired by ${shortenAddr(hirer)} for ${formatEther(paid)} A0GI`,
            ok: true,
            blockNumber: bn,
          });
        }

        for (const log of ownerLogs) {
          const bn = log.blockNumber;
          if (!bn || !blockTimestamps[bn.toString()]) continue;
          const tokenId = Number(log.args.tokenId ?? 0);
          const owner = log.args.owner as string;
          const agentName = FALLBACK_NAMES[tokenId] || `Agent #${tokenId}`;
          activity.push({
            time: relativeTime(blockTimestamps[bn.toString()]),
            agent: agentName,
            msg: `executed by owner ${shortenAddr(owner)}`,
            ok: true,
            blockNumber: bn,
          });
        }

        // Sort by block number descending (most recent first), limit to 10
        activity.sort((a, b) => Number(b.blockNumber - a.blockNumber));
        setLines(activity.slice(0, 10));
      } catch {
        // Non-fatal
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchActivity();

    // Refresh every 30 seconds
    const interval = setInterval(fetchActivity, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [address, publicClient]);

  return { lines, loading };
}

import { formatEther } from "viem";

type AppMode = "permissionless" | "compliant";

export function formatPrice(weiAmount: bigint, mode: AppMode): string {
  const eth = formatEther(weiAmount);
  const symbol = mode === "compliant" ? "ADI" : "OG";
  return `${eth} ${symbol}`;
}

export function txExplorerUrl(hash: string, mode: AppMode): string {
  return mode === "compliant"
    ? `https://explorer.ab.testnet.adifoundation.ai/tx/${hash}`
    : `https://chainscan-galileo.0g.ai/tx/${hash}`;
}

export function addressExplorerUrl(address: string, mode: AppMode): string {
  return mode === "compliant"
    ? `https://explorer.ab.testnet.adifoundation.ai/address/${address}`
    : `https://chainscan-galileo.0g.ai/address/${address}`;
}

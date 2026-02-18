import deployments from "../../../deployments.json";
import { ogTestnet, adiTestnet } from "./chains";

type DeploymentMap = typeof deployments;
type ChainId = keyof DeploymentMap;

function getAddress(
  chainId: number,
  contractName: string,
): `0x${string}` | undefined {
  const chain = deployments[chainId.toString() as ChainId];
  if (!chain) return undefined;
  const address = (chain as Record<string, string>)[contractName];
  if (!address || address === "") return undefined;
  return address as `0x${string}`;
}

export const CONTRACT_ADDRESSES = {
  AgentNFT: getAddress(ogTestnet.id, "AgentNFT"),
  AgentMarketplace: getAddress(ogTestnet.id, "AgentMarketplace"),
  AgentPayment: getAddress(adiTestnet.id, "AgentPayment"),
} as const;

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

// V2 contracts (ERC-7857) — AgentNFT key maps to AgentNFTv2, AgentMarketplace maps to AgentMarketplacev2
export const CONTRACT_ADDRESSES = {
  AgentNFT: getAddress(ogTestnet.id, "AgentNFT"),
  AgentMarketplace: getAddress(ogTestnet.id, "AgentMarketplace"),
  AgentRegistry: getAddress(ogTestnet.id, "AgentRegistry"),
  AgentPayment: getAddress(adiTestnet.id, "AgentPayment"),
  ADIAgentPayments: getAddress(adiTestnet.id, "ADIAgentPayments"),
} as const;

// Platform fee: 2.5% (250 basis points)
export const PLATFORM_FEE_BPS = 250;
export const PLATFORM_FEE_PCT = "2.5%";

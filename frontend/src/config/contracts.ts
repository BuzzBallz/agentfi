import deployments from "../../../deployments.json";

type Address = `0x${string}`;

const og = deployments["16600"];
const adi = deployments["0"];

function toAddress(value: string): Address | undefined {
  if (!value) return undefined;
  return value as Address;
}

export const CONTRACT_ADDRESSES = {
  AgentNFT: toAddress(og.AgentNFT),
  AgentMarketplace: toAddress(og.AgentMarketplace),
  AgentPayment: toAddress(adi.AgentPayment),
} as const;

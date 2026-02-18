import { defineChain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const ogTestnet = defineChain({
  id: 16600,
  name: "0G Testnet",
  nativeCurrency: { name: "0G", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://evmrpc-testnet.0g.ai"] },
  },
});

export const adiTestnet = defineChain({
  id: Number(process.env.NEXT_PUBLIC_ADI_CHAIN_ID ?? "0"),
  name: "ADI Testnet",
  nativeCurrency: { name: "ADI", symbol: "ADI", decimals: 18 },
  rpcUrls: {
    default: { http: [process.env.NEXT_PUBLIC_ADI_RPC ?? ""] },
  },
});

export const wagmiConfig = getDefaultConfig({
  appName: "AgentFi",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "PLACEHOLDER",
  chains: [ogTestnet, adiTestnet],
  ssr: true,
});

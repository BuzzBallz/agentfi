import { defineChain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const ogTestnet = defineChain({
  id: 16602,
  name: "0G-Galileo-Testnet",
  nativeCurrency: { name: "0G", symbol: "OG", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_OG_RPC ?? "https://evmrpc-testnet.0g.ai",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "0G Explorer",
      url: "https://chainscan-galileo.0g.ai",
    },
  },
  testnet: true,
});

export const adiTestnet = defineChain({
  id: Number(process.env.NEXT_PUBLIC_ADI_CHAIN_ID ?? "99999"),
  name: "ADI Network AB Testnet",
  nativeCurrency: { name: "ADI", symbol: "ADI", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ADI_RPC ??
          "https://rpc.ab.testnet.adifoundation.ai/",
      ],
    },
  },
  blockExplorers: {
    default: {
      name: "ADI Explorer",
      url: "https://explorer.ab.testnet.adifoundation.ai/",
    },
  },
  testnet: true,
});

export const wagmiConfig = getDefaultConfig({
  appName: "AgentFi",
  projectId:
    process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID ?? "agentfi-dev",
  chains: [ogTestnet, adiTestnet],
  ssr: true,
});

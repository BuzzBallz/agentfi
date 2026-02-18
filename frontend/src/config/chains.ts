import { defineChain } from "viem";
import { getDefaultConfig } from "@rainbow-me/rainbowkit";

export const ogTestnet = defineChain({
  id: 16600,
  name: "0G Testnet",
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
      url: "https://chainscan-newton.0g.ai",
    },
  },
  testnet: true,
});

export const adiTestnet = defineChain({
  id: Number(process.env.NEXT_PUBLIC_ADI_CHAIN_ID ?? "2648"),
  name: "ADI Testnet",
  nativeCurrency: { name: "ADI", symbol: "ADI", decimals: 18 },
  rpcUrls: {
    default: {
      http: [
        process.env.NEXT_PUBLIC_ADI_RPC ??
          "https://testnet-rpc.adi.foundation",
      ],
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

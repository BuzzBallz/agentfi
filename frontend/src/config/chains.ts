import { defineChain } from "viem";
import { http, createConfig } from "wagmi";
import { connectorsForWallets } from "@rainbow-me/rainbowkit";
import { injectedWallet, metaMaskWallet } from "@rainbow-me/rainbowkit/wallets";

export const ogTestnet = defineChain({
  id: 16602,
  name: "0G-Galileo-Testnet",
  nativeCurrency: { name: "OG", symbol: "OG", decimals: 18 },
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
  nativeCurrency: { name: "ADI Token", symbol: "ADI", decimals: 18 },
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

const connectors = connectorsForWallets(
  [{ groupName: "Wallets", wallets: [injectedWallet, metaMaskWallet] }],
  { appName: "AgentFi", projectId: "00000000000000000000000000000000" }
);

export const wagmiConfig = createConfig({
  connectors,
  chains: [ogTestnet, adiTestnet],
  transports: {
    [ogTestnet.id]: http(process.env.NEXT_PUBLIC_OG_RPC ?? "https://evmrpc-testnet.0g.ai"),
    [adiTestnet.id]: http(process.env.NEXT_PUBLIC_ADI_RPC ?? "https://rpc.ab.testnet.adifoundation.ai/"),
  },
  ssr: true,
});

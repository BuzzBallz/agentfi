"use client";

import { useEffect } from "react";
import { RainbowKitProvider, darkTheme } from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { wagmiConfig, ogTestnet, adiTestnet } from "@/config/chains";
import { AppModeProvider, useAppMode } from "@/context/AppModeContext";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient({
  defaultOptions: { queries: { retry: false } },
});

function InnerProviders({ children }: { children: React.ReactNode }) {
  const { isCompliant } = useAppMode();

  useEffect(() => {
    const onError = (e: ErrorEvent) => {
      if (e.message?.includes("Connection interrupted")) e.preventDefault();
    };
    const onRejection = (e: PromiseRejectionEvent) => {
      if (e.reason?.message?.includes("Connection interrupted")) e.preventDefault();
    };
    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onRejection);
    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onRejection);
    };
  }, []);

  return (
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={isCompliant ? adiTestnet : ogTestnet}
          theme={darkTheme({
            accentColor: "#C9A84C",
            accentColorForeground: "#0D0802",
            borderRadius: "medium",
            fontStack: "system",
            overlayBlur: "small",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AppModeProvider>
      <InnerProviders>{children}</InnerProviders>
    </AppModeProvider>
  );
}

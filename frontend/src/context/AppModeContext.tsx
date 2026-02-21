"use client";

import { createContext, useContext, useState, useCallback } from "react";
import { Space_Mono, DM_Sans } from "next/font/google";

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] });
const dmSans = DM_Sans({ subsets: ["latin"] });

type AppMode = "permissionless" | "compliant";

interface AppModeContextType {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  resetMode: () => void;
  chainId: number;
  chainName: string;
  currencySymbol: string;
  explorerUrl: string;
  isCompliant: boolean;
}

const AppModeContext = createContext<AppModeContextType | null>(null);

function ModeSelector({ onSelect }: { onSelect: (mode: AppMode) => void }) {
  return (
    <div
      className={dmSans.className}
      style={{
        position: "fixed",
        inset: 0,
        background: "#1A1208",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 9999,
      }}
    >
      <div style={{ textAlign: "center", marginBottom: 48 }}>
        <h1
          className={spaceMono.className}
          style={{
            color: "#F5ECD7",
            fontSize: 36,
            fontWeight: 700,
            margin: 0,
            letterSpacing: "0.02em",
          }}
        >
          AgentFi
        </h1>
        <p style={{ color: "#9A8060", fontSize: 16, marginTop: 8 }}>
          The banking system for autonomous AI agents
        </p>
      </div>

      <div style={{ display: "flex", gap: 24 }}>
        {/* Permissionless card */}
        <button
          onClick={() => onSelect("permissionless")}
          className={spaceMono.className}
          style={{
            background: "#241A0E",
            border: "2px solid #3D2E1A",
            borderRadius: 16,
            padding: "32px 36px",
            cursor: "pointer",
            width: 260,
            textAlign: "left",
            transition: "border-color 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.borderColor = "#C9A84C")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.borderColor = "#3D2E1A")
          }
        >
          <div
            style={{
              color: "#C9A84C",
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            Permissionless
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ color: "#9A8060", fontSize: 12 }}>
              <span style={{ color: "#5C4A32" }}>Chain</span>{" "}
              0G Galileo
            </div>
            <div style={{ color: "#9A8060", fontSize: 12 }}>
              <span style={{ color: "#5C4A32" }}>Pay in</span>{" "}
              OG
            </div>
            <div style={{ color: "#9A8060", fontSize: 12 }}>
              <span style={{ color: "#5C4A32" }}>KYC</span>{" "}
              Not required
            </div>
          </div>
          <div
            style={{
              marginTop: 20,
              background: "#C9A84C",
              color: "#1A1208",
              borderRadius: 8,
              padding: "10px 0",
              textAlign: "center",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            Select
          </div>
        </button>

        {/* Compliant card */}
        <button
          onClick={() => onSelect("compliant")}
          className={spaceMono.className}
          style={{
            background: "#241A0E",
            border: "2px solid #3D2E1A",
            borderRadius: 16,
            padding: "32px 36px",
            cursor: "pointer",
            width: 260,
            textAlign: "left",
            transition: "border-color 0.2s",
          }}
          onMouseOver={(e) =>
            (e.currentTarget.style.borderColor = "#818CF8")
          }
          onMouseOut={(e) =>
            (e.currentTarget.style.borderColor = "#3D2E1A")
          }
        >
          <div
            style={{
              color: "#818CF8",
              fontSize: 18,
              fontWeight: 700,
              marginBottom: 16,
            }}
          >
            Compliant
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <div style={{ color: "#9A8060", fontSize: 12 }}>
              <span style={{ color: "#5C4A32" }}>Chain</span>{" "}
              ADI Testnet
            </div>
            <div style={{ color: "#9A8060", fontSize: 12 }}>
              <span style={{ color: "#5C4A32" }}>Pay in</span>{" "}
              ADI
            </div>
            <div style={{ color: "#9A8060", fontSize: 12 }}>
              <span style={{ color: "#5C4A32" }}>KYC</span>{" "}
              Required
            </div>
          </div>
          <div
            style={{
              marginTop: 20,
              background: "#818CF8",
              color: "#1A1208",
              borderRadius: 8,
              padding: "10px 0",
              textAlign: "center",
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: "0.05em",
            }}
          >
            Select
          </div>
        </button>
      </div>

      <p
        className={spaceMono.className}
        style={{ color: "#5C4A32", fontSize: 11, marginTop: 32 }}
      >
        ETHDenver 2026
      </p>
    </div>
  );
}

export function AppModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<AppMode | null>(() => {
    if (typeof window === "undefined") return null;
    const saved = localStorage.getItem("agentfi-mode");
    return saved === "permissionless" || saved === "compliant" ? saved : null;
  });

  const setMode = useCallback((m: AppMode) => {
    setModeState(m);
    localStorage.setItem("agentfi-mode", m);
  }, []);

  const resetMode = useCallback(() => {
    setModeState(null);
    localStorage.removeItem("agentfi-mode");
  }, []);

  const value: AppModeContextType = {
    mode: mode ?? "permissionless",
    setMode,
    resetMode,
    chainId: mode === "compliant" ? 99999 : 16602,
    chainName: mode === "compliant" ? "ADI Testnet" : "0G Galileo",
    currencySymbol: mode === "compliant" ? "ADI" : "OG",
    explorerUrl:
      mode === "compliant"
        ? "https://explorer.ab.testnet.adifoundation.ai"
        : "https://chainscan-galileo.0g.ai",
    isCompliant: mode === "compliant",
  };

  if (mode === null) {
    return (
      <AppModeContext.Provider value={{ ...value, mode: "permissionless" }}>
        <ModeSelector onSelect={setMode} />
      </AppModeContext.Provider>
    );
  }

  return (
    <AppModeContext.Provider value={value}>{children}</AppModeContext.Provider>
  );
}

export function useAppMode() {
  const ctx = useContext(AppModeContext);
  if (!ctx) throw new Error("useAppMode must be used within AppModeProvider");
  return ctx;
}

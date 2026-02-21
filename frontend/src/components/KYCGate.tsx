"use client";

import { useState, useEffect } from "react";
import { Space_Mono } from "next/font/google";
import { useAccount } from "wagmi";
import { checkADIKYC, mockVerifyKYC } from "@/lib/api";
import { useAppMode } from "@/context/AppModeContext";

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] });

export default function KYCGate({ children }: { children: React.ReactNode }) {
  const { isCompliant } = useAppMode();
  const { address } = useAccount();
  const [kycVerified, setKycVerified] = useState<boolean | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    if (!isCompliant || !address) {
      setChecking(false);
      return;
    }
    setChecking(true);
    checkADIKYC(address)
      .then((res) => setKycVerified(res.data?.kyc_verified ?? false))
      .catch(() => setKycVerified(false))
      .finally(() => setChecking(false));
  }, [isCompliant, address]);

  // Permissionless mode: pass through
  if (!isCompliant) return <>{children}</>;

  // No wallet connected: pass through (wallet connect will handle it)
  if (!address) return <>{children}</>;

  // Still checking KYC
  if (checking) {
    return (
      <div style={{ textAlign: "center", padding: 48 }}>
        <div
          className={spaceMono.className}
          style={{ color: "#818CF8", fontSize: 13 }}
        >
          Checking KYC status on ADI Chain...
        </div>
      </div>
    );
  }

  // KYC verified: render children
  if (kycVerified) return <>{children}</>;

  // Not verified: show KYC gate
  return (
    <div style={{ maxWidth: 500, margin: "60px auto", padding: "0 24px" }}>
      <div
        style={{
          background: "#241A0E",
          border: "1px solid rgba(129,140,248,0.3)",
          borderRadius: 12,
          padding: 32,
          textAlign: "center",
        }}
      >
        <div
          className={spaceMono.className}
          style={{
            color: "#818CF8",
            fontSize: 18,
            fontWeight: 700,
            marginBottom: 12,
          }}
        >
          KYC Verification Required
        </div>
        <div
          style={{ color: "#9A8060", fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}
        >
          Compliant mode requires KYC verification on ADI Chain before you can
          hire agents. Your jurisdiction and compliance tier will be recorded
          on-chain.
        </div>

        <button
          onClick={async () => {
            if (!address) return;
            setVerifying(true);
            try {
              await mockVerifyKYC(address);
              setKycVerified(true);
            } catch {
              // ignore
            } finally {
              setVerifying(false);
            }
          }}
          disabled={verifying}
          className={spaceMono.className}
          style={{
            background: verifying ? "#3D2E1A" : "#818CF8",
            color: "#1A1208",
            border: "none",
            borderRadius: 8,
            padding: "12px 28px",
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: "0.05em",
            cursor: verifying ? "not-allowed" : "pointer",
            marginBottom: 16,
          }}
        >
          {verifying ? "Verifying..." : "Complete KYC Verification"}
        </button>

        <div
          className={spaceMono.className}
          style={{ color: "#5C4A32", fontSize: 10, marginTop: 12 }}
        >
          Demo: mock verification for hackathon
        </div>
      </div>
    </div>
  );
}

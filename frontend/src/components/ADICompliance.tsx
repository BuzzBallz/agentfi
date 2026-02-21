"use client";

import { useState, useEffect } from "react";
import { Space_Mono } from "next/font/google";
import { useAccount } from "wagmi";
import { getADIStatus, checkADIKYC, mockVerifyKYC } from "@/lib/api";

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] });

export default function ADICompliance() {
  const { address } = useAccount();
  const [stats, setStats] = useState<any>(null);
  const [kycStatus, setKycStatus] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    getADIStatus()
      .then((res) => setStats(res.data))
      .catch(() => setStats(null))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (address) {
      checkADIKYC(address)
        .then((res) => setKycStatus(res.data?.kyc_verified ?? false))
        .catch(() => setKycStatus(false));
    }
  }, [address]);

  if (loading) return null;
  if (!stats?.enabled) return null;

  return (
    <div
      style={{
        background: "rgba(99,102,241,0.06)",
        border: "1px solid rgba(99,102,241,0.2)",
        borderRadius: 12,
        padding: 20,
        marginBottom: 24,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          className={spaceMono.className}
          style={{
            color: "#818CF8",
            fontSize: 10,
            letterSpacing: "0.08em",
          }}
        >
          ADI CHAIN COMPLIANCE (MODE B)
        </span>
        {stats?.mock && (
          <span
            className={spaceMono.className}
            style={{
              background: "rgba(196,122,90,0.15)",
              color: "#C47A5A",
              fontSize: 9,
              padding: "2px 6px",
              borderRadius: 4,
            }}
          >
            Mock
          </span>
        )}
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap: 12,
          marginBottom: 12,
        }}
      >
        <div>
          <div className={spaceMono.className} style={{ color: "#5C4A32", fontSize: 9, letterSpacing: "0.05em" }}>
            KYC USERS
          </div>
          <div className={spaceMono.className} style={{ color: "#818CF8", fontSize: 14, fontWeight: 700 }}>
            {stats.total_kyc_users ?? 0}
          </div>
        </div>
        <div>
          <div className={spaceMono.className} style={{ color: "#5C4A32", fontSize: 9, letterSpacing: "0.05em" }}>
            PAYMENTS
          </div>
          <div className={spaceMono.className} style={{ color: "#818CF8", fontSize: 14, fontWeight: 700 }}>
            {stats.total_payments ?? 0}
          </div>
        </div>
        <div>
          <div className={spaceMono.className} style={{ color: "#5C4A32", fontSize: 9, letterSpacing: "0.05em" }}>
            VOLUME
          </div>
          <div className={spaceMono.className} style={{ color: "#818CF8", fontSize: 14, fontWeight: 700 }}>
            {stats.total_volume_adi ?? "0"} ADI
          </div>
        </div>
        <div>
          <div className={spaceMono.className} style={{ color: "#5C4A32", fontSize: 9, letterSpacing: "0.05em" }}>
            SERVICES
          </div>
          <div className={spaceMono.className} style={{ color: "#818CF8", fontSize: 14, fontWeight: 700 }}>
            {stats.service_count ?? 0}
          </div>
        </div>
      </div>

      {/* KYC status for connected wallet */}
      {address && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8, flexWrap: "wrap" }}>
          <div
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: kycStatus ? "#7A9E6E" : "#5C4A32",
            }}
          />
          <span className={spaceMono.className} style={{ color: kycStatus ? "#7A9E6E" : "#9A8060", fontSize: 11 }}>
            {kycStatus
              ? "KYC Verified on ADI Chain"
              : "Not KYC-verified (permissionless mode active)"}
          </span>
          {!kycStatus && (
            <button
              onClick={async () => {
                setVerifying(true);
                try {
                  await mockVerifyKYC(address);
                  setKycStatus(true);
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
                borderRadius: 6,
                padding: "4px 12px",
                fontSize: 10,
                fontWeight: 700,
                cursor: verifying ? "not-allowed" : "pointer",
                letterSpacing: "0.03em",
              }}
            >
              {verifying ? "Verifying..." : "Complete Mock KYC"}
            </button>
          )}
        </div>
      )}

      {/* Explorer link */}
      {stats.explorer_url && (
        <a
          href={stats.explorer_url}
          target="_blank"
          rel="noopener noreferrer"
          className={spaceMono.className}
          style={{ color: "#818CF8", fontSize: 10, textDecoration: "underline" }}
        >
          View on ADI Explorer
        </a>
      )}
    </div>
  );
}

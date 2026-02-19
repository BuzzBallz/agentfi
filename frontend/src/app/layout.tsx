import "./globals.css";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import dynamic from "next/dynamic";
import { Providers } from "@/components/Providers";
import CardNav from "@/components/CardNav";

const DotGrid = dynamic(() => import("@/components/DotGrid"), { ssr: false });

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "AgentFi",
  description: "The banking system for autonomous AI agents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className} style={{ background: "#1A1208", margin: 0, padding: 0 }}>
        <Providers>
          <DotGrid
            dotSize={4}
            gap={28}
            baseColor="#3D2E1A"
            activeColor="#C9A84C"
            proximity={120}
            shockRadius={200}
            shockStrength={4}
            returnDuration={1.5}
            style={{ position: "fixed", inset: 0, zIndex: 0 }}
          />
          <div style={{ position: "relative", zIndex: 1 }}>
            <CardNav />
            <div style={{ paddingTop: 60 }}>
              {children}
            </div>
          </div>
        </Providers>
      </body>
    </html>
  );
}

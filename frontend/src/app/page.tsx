import Link from "next/link";
import dynamic from "next/dynamic";
import { Space_Mono, DM_Sans } from "next/font/google";

const LogoCarousel = dynamic(() => import("@/components/LogoCarousel"), { ssr: false });
const CurvedLoop = dynamic(() => import("@/components/CurvedLoop"), { ssr: false });

const spaceMono = Space_Mono({ subsets: ["latin"], weight: ["400", "700"] });
const dmSans = DM_Sans({ subsets: ["latin"] });

const TERMINAL_TEXT = `AgentFi v1.0.0
Connecting to ADI Chain... ✓
Loading agent registry... ✓
Agent: Portfolio Analyzer
Query: "Analyze my DeFi positions"
Running on Hedera via Agent Kit...
─────────────────────────────
RESULT: High ETH concentration
Risk Score: 7.2/10
Recommendation: Rebalance →
yield_optimizer executing...
APY found: 12.4% (Aave v3)
─────────────────────────────
Payment: 0.01 ADI ✓ settled
iNFT #0042 minted on 0G ✓`;


export default function HomePage() {
  const charCount = TERMINAL_TEXT.length;

  return (
    <>
      <style
        dangerouslySetInnerHTML={{
          __html: `
            :root {
              --bg-base: #1A1208;
              --bg-surface: #241A0E;
              --bg-surface-hover: #2E2010;
              --border: #3D2E1A;
              --border-bright: #5C4422;
              --gold: #C9A84C;
              --gold-light: #E8C97A;
              --gold-dim: #8A6E2E;
              --text-primary: #F5ECD7;
              --text-secondary: #9A8060;
              --text-muted: #5C4A32;
              --green-muted: #7A9E6E;
              --terracotta: #C47A5A;
            }
            @keyframes fadeInUp {
              from { opacity: 0; transform: translateY(24px); }
              to { opacity: 1; transform: translateY(0); }
            }
            @keyframes typing {
              from { max-height: 0; }
              to { max-height: 600px; }
            }
            @keyframes blink {
              0%, 100% { opacity: 1; }
              50% { opacity: 0; }
            }
            @keyframes scanline {
              0% { transform: translateY(-100%); }
              100% { transform: translateY(100vh); }
            }
            @keyframes glow {
              0%, 100% { box-shadow: 0 0 20px rgba(201,168,76,0.15); }
              50% { box-shadow: 0 0 40px rgba(201,168,76,0.3); }
            }
            .fade-in-up {
              opacity: 0;
              animation: fadeInUp 0.7s ease-out forwards;
            }
            .terminal-text {
              overflow: hidden;
              animation: typing 6s steps(${charCount}, end) infinite;
              animation-delay: 0.5s;
            }
            .terminal-cursor::after {
              content: "█";
              animation: blink 1s step-end infinite;
              color: var(--gold);
            }
            .glow-card {
              animation: glow 3s ease-in-out infinite;
            }
            .grid-bg {
              background-image:
                repeating-linear-gradient(0deg, rgba(201,168,76,0.04) 0px, rgba(201,168,76,0.04) 1px, transparent 1px, transparent 60px),
                repeating-linear-gradient(90deg, rgba(201,168,76,0.04) 0px, rgba(201,168,76,0.04) 1px, transparent 1px, transparent 60px);
            }
            .scanline-overlay::before {
              content: "";
              position: absolute;
              top: 0;
              left: 0;
              right: 0;
              height: 2px;
              background: linear-gradient(90deg, transparent, rgba(201,168,76,0.08), transparent);
              animation: scanline 8s linear infinite;
              pointer-events: none;
            }
            .cta-secondary { transition: all 0.2s; }
            .cta-secondary:hover { background: rgba(201,168,76,0.1); }
          `,
        }}
      />

      <main className={`${dmSans.className} relative min-h-screen`} style={{ background: "var(--bg-base)" }}>
        {/* Grid background */}
        <div className="grid-bg pointer-events-none fixed inset-0" />
        <div className="scanline-overlay pointer-events-none fixed inset-0" />

        {/* ── Section 1: Hero ── */}
        <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6" style={{ paddingTop: "40px", paddingBottom: "80px" }}>
          <div className="grid w-full gap-12 lg:grid-cols-5">
            {/* Left */}
            <div className="flex flex-col justify-center lg:col-span-3">
              <h1
                className={`${spaceMono.className} fade-in-up mb-6 text-4xl font-bold leading-tight lg:text-5xl xl:text-6xl`}
                style={{ animationDelay: "100ms", color: "var(--text-primary)", letterSpacing: "0.02em" }}
              >
                The Banking System
                <br />
                For Autonomous
                <br />
                <span style={{ color: "var(--gold)" }}>AI Agents</span>
              </h1>

              <p
                className="fade-in-up mb-8 max-w-lg text-lg leading-relaxed"
                style={{ animationDelay: "200ms", color: "var(--text-secondary)" }}
              >
                Hire specialized AI agents. Pay on ADI Chain.
                <br />
                Own them as iNFTs on 0G Chain. Built for the agentic economy.
              </p>

              <div
                className="fade-in-up mb-8 flex gap-4"
                style={{ animationDelay: "300ms" }}
              >
                <Link
                  href="/marketplace"
                  className="rounded-lg px-6 py-3 font-medium transition-all hover:opacity-90"
                  style={{ backgroundColor: "var(--gold)", color: "var(--bg-base)" }}
                >
                  Enter Marketplace
                </Link>
                <Link
                  href="/dashboard"
                  className="cta-secondary rounded-lg px-6 py-3 font-medium"
                  style={{ border: "1px solid var(--gold)", color: "var(--gold)" }}
                >
                  View Dashboard
                </Link>
              </div>

              <div style={{ width: "100%", marginTop: 24, overflow: "hidden" }}>
                <CurvedLoop marqueeText="✦ ETHDenver 2026 ✦ ETHDenver 2026 ✦ ETHDenver 2026 ✦ " speed={0.4} curveAmount={60} direction="left" className="curved-text-gold"/>
                <CurvedLoop marqueeText="✦ Marketplace Agents ✦ Marketplace Agents ✦ Marketplace Agents ✦ " speed={0.5} curveAmount={80} direction="right" className="curved-text-gold"/>
                <CurvedLoop marqueeText="✦ Multi-Chain ✦ Multi-Chain ✦ Multi-Chain ✦ Multi-Chain ✦ " speed={0.3} curveAmount={50} direction="left" className="curved-text-gold"/>
              </div>
            </div>

            {/* Right — Terminal */}
            <div className="flex items-center lg:col-span-2">
              <div
                className="glow-card w-full overflow-hidden rounded-xl backdrop-blur"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border-bright)" }}
              >
                <div className="flex items-center gap-2 px-4 py-3" style={{ borderBottom: "1px solid var(--border-bright)" }}>
                  <span className="h-3 w-3 rounded-full" style={{ background: "#5C4A32" }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: "#8A6E2E" }} />
                  <span className="h-3 w-3 rounded-full" style={{ background: "#C9A84C" }} />
                  <span className={`${spaceMono.className} ml-2 text-xs`} style={{ color: "var(--text-muted)" }}>
                    agentfi-terminal
                  </span>
                </div>
                <div className="p-5">
                  <pre
                    className={`${spaceMono.className} terminal-text terminal-cursor whitespace-pre-wrap text-xs leading-relaxed`}
                    style={{ color: "var(--gold)" }}
                  >
                    {TERMINAL_TEXT}
                  </pre>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Section 2: Multi-Chain by Design ── */}
        <section className="px-6 py-20" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="mx-auto flex max-w-5xl flex-col items-center gap-12">
            <div className="text-center">
              <h2
                className={`${spaceMono.className} mb-3 text-3xl font-bold`}
                style={{ color: "var(--text-primary)", letterSpacing: "0.02em" }}
              >
                Multi-Chain by Design
              </h2>
              <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                Each chain plays a specific role in the agent economy
              </p>
            </div>
            <LogoCarousel />
          </div>
        </section>
      </main>
    </>
  );
}

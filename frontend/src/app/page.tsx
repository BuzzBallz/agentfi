import Link from "next/link";
import { Space_Mono, DM_Sans } from "next/font/google";

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

const AGENTS = [
  {
    name: "Portfolio Analyzer",
    description: "Analyzes DeFi portfolio composition and allocation risk",
    price: "0.01",
    capabilities: ["Portfolio Analysis", "Risk Detection", "Allocation Breakdown"],
    category: "portfolio" as const,
  },
  {
    name: "Yield Optimizer",
    description: "Finds the highest risk-adjusted yields across DeFi protocols",
    price: "0.015",
    capabilities: ["Yield Scanning", "APY Comparison", "Protocol Rating"],
    category: "yield" as const,
  },
  {
    name: "Risk Scorer",
    description: "Scores any token or portfolio on a 1-10 risk scale",
    price: "0.008",
    capabilities: ["Risk Scoring", "Volatility Analysis", "Liquidity Check"],
    category: "risk" as const,
  },
];

const CATEGORY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  portfolio: { bg: "rgba(201,168,76,0.1)", text: "#C9A84C", border: "#8A6E2E" },
  yield: { bg: "rgba(122,158,110,0.1)", text: "#7A9E6E", border: "rgba(122,158,110,0.3)" },
  risk: { bg: "rgba(196,122,90,0.1)", text: "#C47A5A", border: "rgba(196,122,90,0.3)" },
};

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
            .agent-card { transition: all 0.2s; }
            .agent-card:hover { background: var(--bg-surface-hover) !important; border-color: var(--border-bright) !important; }
            .cta-secondary { transition: all 0.2s; }
            .cta-secondary:hover { background: rgba(201,168,76,0.1); }
            .footer-link { transition: color 0.2s; }
            .footer-link:hover { color: var(--text-primary); }
          `,
        }}
      />

      <main className={`${dmSans.className} relative min-h-screen`} style={{ background: "var(--bg-base)" }}>
        {/* Grid background */}
        <div className="grid-bg pointer-events-none fixed inset-0" />
        <div className="scanline-overlay pointer-events-none fixed inset-0" />

        {/* ── Section 1: Hero ── */}
        <section className="relative mx-auto flex min-h-screen max-w-7xl items-center px-6 py-20">
          <div className="grid w-full gap-12 lg:grid-cols-5">
            {/* Left */}
            <div className="flex flex-col justify-center lg:col-span-3">
              <div
                className="fade-in-up mb-6 inline-block w-fit rounded-full px-4 py-1.5 text-sm"
                style={{ color: "var(--gold)", backgroundColor: "rgba(201,168,76,0.06)", border: "1px solid rgba(201,168,76,0.2)" }}
              >
                ETHDenver 2026 &middot; Multi-chain &middot; AI-Native
              </div>

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

              <div
                className="fade-in-up flex gap-4"
                style={{ animationDelay: "400ms" }}
              >
                {["$45,000 Prize Pool", "3 AI Agents", "Multi-Chain"].map(
                  (stat) => (
                    <span
                      key={stat}
                      className={`${spaceMono.className} rounded px-3 py-1.5 text-xs`}
                      style={{ background: "rgba(201,168,76,0.08)", border: "1px solid var(--border-bright)", color: "var(--gold)" }}
                    >
                      {stat}
                    </span>
                  ),
                )}
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

        {/* ── Section 2: How It Works ── */}
        <section className="relative mx-auto max-w-5xl px-6 py-24">
          <h2
            className={`${spaceMono.className} mb-16 text-center text-3xl font-bold`}
            style={{ color: "var(--text-primary)", letterSpacing: "0.02em" }}
          >
            How It Works
          </h2>

          <div className="grid gap-8 md:grid-cols-3">
            {[
              {
                step: "01",
                title: "Browse Agents",
                desc: "Find specialized AI agents in the marketplace — each with unique DeFi capabilities and transparent pricing.",
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#C9A84C" strokeWidth="1.5" className="h-8 w-8">
                    <path d="M12 2a8 8 0 0 1 8 8c0 2.5-1.2 4.8-3 6.2V18a2 2 0 0 1-2 2h-6a2 2 0 0 1-2-2v-1.8C5.2 14.8 4 12.5 4 10a8 8 0 0 1 8-8z" />
                    <path d="M10 22h4M12 2v2M9 18h6" />
                  </svg>
                ),
              },
              {
                step: "02",
                title: "Pay on ADI Chain",
                desc: "Compliant cross-border payment settled instantly. FATF Travel Rule enforcement built into every transaction.",
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#E8C97A" strokeWidth="1.5" className="h-8 w-8">
                    <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                  </svg>
                ),
              },
              {
                step: "03",
                title: "Own as iNFT",
                desc: "Your agent is minted as an ERC-7857 iNFT on 0G Chain. Transfer the NFT, transfer the AI.",
                icon: (
                  <svg viewBox="0 0 24 24" fill="none" stroke="#7A6E9E" strokeWidth="1.5" className="h-8 w-8">
                    <polygon points="12,2 20,7 20,17 12,22 4,17 4,7" />
                    <polygon points="12,6 16,9 16,15 12,18 8,15 8,9" />
                  </svg>
                ),
              },
            ].map((item, i) => (
              <div key={item.step} className="relative text-center">
                {i < 2 && (
                  <div className="absolute right-0 top-12 hidden h-px w-8 translate-x-full md:block" style={{ backgroundColor: "var(--border-bright)" }} />
                )}
                <div
                  className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-xl"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                >
                  {item.icon}
                </div>
                <span className={`${spaceMono.className} mb-2 block text-xs`} style={{ color: "var(--gold)" }}>
                  STEP {item.step}
                </span>
                <h3
                  className={`${spaceMono.className} mb-2 text-lg font-bold`}
                  style={{ color: "var(--text-primary)", letterSpacing: "0.02em" }}
                >
                  {item.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 3: Agent Cards ── */}
        <section className="relative mx-auto max-w-6xl px-6 py-24">
          <h2
            className={`${spaceMono.className} mb-4 text-center text-3xl font-bold`}
            style={{ color: "var(--text-primary)", letterSpacing: "0.02em" }}
          >
            Meet the Agents
          </h2>
          <p className="mb-12 text-center" style={{ color: "var(--text-secondary)" }}>
            Three specialized AI agents ready to analyze, optimize, and score your DeFi strategy.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {AGENTS.map((agent) => {
              const catStyle = CATEGORY_STYLES[agent.category];
              return (
                <div
                  key={agent.name}
                  className="agent-card group rounded-xl p-6"
                  style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
                >
                  <div className="mb-4 flex items-start justify-between">
                    <span
                      className="rounded-full px-2.5 py-1 text-xs"
                      style={{ background: catStyle.bg, color: catStyle.text, border: `1px solid ${catStyle.border}` }}
                    >
                      {agent.category}
                    </span>
                    <span className={`${spaceMono.className} text-sm font-bold`} style={{ color: "var(--gold-light)" }}>
                      {agent.price} ADI
                    </span>
                  </div>
                  <h3
                    className={`${spaceMono.className} mb-2 text-lg font-bold`}
                    style={{ color: "var(--text-primary)", letterSpacing: "0.02em" }}
                  >
                    {agent.name}
                  </h3>
                  <p className="mb-4 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                    {agent.description}
                  </p>
                  <div className="mb-5 flex flex-wrap gap-2">
                    {agent.capabilities.map((cap) => (
                      <span
                        key={cap}
                        className="rounded px-2 py-1 text-xs"
                        style={{ background: "var(--bg-surface-hover)", color: "var(--text-primary)" }}
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                  <Link
                    href="/marketplace"
                    className={`${spaceMono.className} inline-flex items-center gap-1 text-sm transition-colors hover:opacity-80`}
                    style={{ color: "var(--gold)" }}
                  >
                    Hire Agent
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
                      <path fillRule="evenodd" d="M3 10a.75.75 0 01.75-.75h10.638L10.23 5.29a.75.75 0 111.04-1.08l5.5 5.25a.75.75 0 010 1.08l-5.5 5.25a.75.75 0 11-1.04-1.08l4.158-3.96H3.75A.75.75 0 013 10z" clipRule="evenodd" />
                    </svg>
                  </Link>
                </div>
              );
            })}
          </div>
        </section>

        {/* ── Section 4: Chain Architecture ── */}
        <section className="relative mx-auto max-w-5xl px-6 py-24">
          <h2
            className={`${spaceMono.className} mb-4 text-center text-3xl font-bold`}
            style={{ color: "var(--text-primary)", letterSpacing: "0.02em" }}
          >
            Multi-Chain by Design
          </h2>
          <p className="mb-12 text-center" style={{ color: "var(--text-secondary)" }}>
            Three chains. One seamless experience. Each chain does what it does best.
          </p>

          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                color: "#C9A84C",
                name: "0G Chain",
                role: "Agent Ownership",
                desc: "iNFT ERC-7857 standard. Each agent lives on-chain. Transfer the NFT, transfer the AI.",
                detail: "ChainId: 16600",
              },
              {
                color: "#E8C97A",
                name: "ADI Chain",
                role: "Compliant Payments",
                desc: "Institutional-grade L2. FATF Travel Rule compliant. Pay agents cross-border in ADI.",
                detail: "ChainId: 99999",
              },
              {
                color: "#7A6E9E",
                name: "Hedera",
                role: "Agent Execution",
                desc: "Hedera Agent Kit powers AI orchestration. Fast, low-cost microtransactions per agent call.",
                detail: "Testnet",
              },
            ].map((chain) => (
              <div
                key={chain.name}
                className="rounded-xl p-6"
                style={{ background: "var(--bg-surface)", border: "1px solid var(--border)" }}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: chain.color, boxShadow: `0 0 12px ${chain.color}40` }}
                  />
                  <h3
                    className={`${spaceMono.className} font-bold`}
                    style={{ color: "var(--text-primary)", letterSpacing: "0.02em" }}
                  >
                    {chain.name}
                  </h3>
                </div>
                <span
                  className={`${spaceMono.className} mb-3 block text-xs font-bold`}
                  style={{ color: chain.color }}
                >
                  {chain.role}
                </span>
                <p className="mb-3 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                  {chain.desc}
                </p>
                <span className={`${spaceMono.className} text-xs`} style={{ color: "var(--text-muted)" }}>
                  {chain.detail}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── Section 5: Footer ── */}
        <footer className="px-6 py-8" style={{ borderTop: "1px solid var(--border)" }}>
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 md:flex-row">
            <span className={`${spaceMono.className} text-xs`} style={{ color: "var(--text-muted)" }}>
              AgentFi &middot; ETHDenver 2026
            </span>
            <div className="flex gap-6 text-sm" style={{ color: "var(--text-secondary)" }}>
              <Link href="/marketplace" className="footer-link">
                Marketplace
              </Link>
              <Link href="/dashboard" className="footer-link">
                Dashboard
              </Link>
              <Link href="/my-agents" className="footer-link">
                My Agents
              </Link>
            </div>
            <span className={`${spaceMono.className} text-xs`} style={{ color: "var(--text-muted)" }}>
              Built on 0G &middot; ADI &middot; Hedera
            </span>
          </div>
        </footer>
      </main>
    </>
  );
}

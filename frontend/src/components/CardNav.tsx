"use client"
import React, { useLayoutEffect, useRef, useState } from "react"
import Link from "next/link"
import { gsap } from "gsap"
import { GoArrowUpRight } from "react-icons/go"
import "./CardNav.css"
import WalletConnect from "./WalletConnect"
import SplitText from "./SplitText"
import FadeContent from "./FadeContent"

const NAV_ITEMS = [
  {
    label: "Marketplace",
    bgColor: "#241A0E",
    textColor: "#F5ECD7",
    links: [
      { label: "Browse Agents",     href: "/marketplace", ariaLabel: "Browse AI agents" },
      { label: "Agent Dashboard",   href: "/dashboard",   ariaLabel: "View DeFAI dashboard" },
    ],
  },
  {
    label: "My Portfolio",
    bgColor: "#2E2010",
    textColor: "#F5ECD7",
    links: [
      { label: "My Agents (iNFTs)", href: "/dashboard",   ariaLabel: "View owned iNFTs" },
      { label: "Transaction History",href: "/dashboard",  ariaLabel: "View transactions" },
    ],
  },
  {
    label: "Learn",
    bgColor: "#1A1208",
    textColor: "#F5ECD7",
    links: [
      { label: "0G Chain",  href: "https://0g.ai",           ariaLabel: "Learn about 0G Chain" },
      { label: "ADI Chain", href: "https://adi.foundation",   ariaLabel: "Learn about ADI Chain" },
      { label: "Hedera",    href: "https://hedera.com",       ariaLabel: "Learn about Hedera" },
    ],
  },
]

const CardNav: React.FC = () => {
  const [isHamburgerOpen, setIsHamburgerOpen] = useState(false)
  const [isExpanded, setIsExpanded] = useState(false)
  const navRef = useRef<HTMLDivElement | null>(null)
  const cardsRef = useRef<HTMLDivElement[]>([])
  const tlRef = useRef<gsap.core.Timeline | null>(null)

  const createTimeline = () => {
    const navEl = navRef.current
    if (!navEl) return null
    gsap.set(navEl, { height: 60, overflow: "hidden" })
    gsap.set(cardsRef.current, { y: 50, opacity: 0 })
    const tl = gsap.timeline({ paused: true })
    tl.to(navEl, { height: 260, duration: 0.4, ease: "power3.out" })
    tl.to(cardsRef.current, { y: 0, opacity: 1, duration: 0.4, ease: "power3.out", stagger: 0.08 }, "-=0.1")
    return tl
  }

  useLayoutEffect(() => {
    const tl = createTimeline()
    tlRef.current = tl
    return () => { tl?.kill(); tlRef.current = null }
  }, [])

  const toggleMenu = () => {
    const tl = tlRef.current
    if (!tl) return
    if (!isExpanded) {
      setIsHamburgerOpen(true)
      setIsExpanded(true)
      tl.play(0)
    } else {
      setIsHamburgerOpen(false)
      tl.eventCallback("onReverseComplete", () => setIsExpanded(false))
      tl.reverse()
    }
  }

  const setCardRef = (i: number) => (el: HTMLDivElement | null) => {
    if (el) cardsRef.current[i] = el
  }

  return (
    <div className="card-nav-container">
      <nav
        ref={navRef}
        className={`card-nav ${isExpanded ? "open" : ""}`}
        style={{ backgroundColor: "#1A1208" }}
      >
        {/* Top bar */}
        <div className="card-nav-top">
          <div
            className={`hamburger-menu ${isHamburgerOpen ? "open" : ""}`}
            onClick={toggleMenu}
            role="button"
            aria-label={isExpanded ? "Close menu" : "Open menu"}
            tabIndex={0}
          >
            <div className="hamburger-line" />
            <div className="hamburger-line" />
          </div>

          <Link href="/" className="logo-container" style={{ textDecoration: "none", color: "#C9A84C", fontFamily: "monospace", fontSize: 20, fontWeight: "bold", letterSpacing: "0.05em" }}>
            AgentFi
          </Link>

          <WalletConnect />
        </div>

        {/* Dropdown cards */}
        <div className="card-nav-content" aria-hidden={!isExpanded}>
          {NAV_ITEMS.map((item, idx) => (
            <div
              key={item.label}
              className="nav-card"
              ref={setCardRef(idx)}
              style={{
                backgroundColor: item.bgColor,
                color: item.textColor,
                border: "1px solid #3D2E1A",
              }}
            >
              <div className="nav-card-label" style={{ color: "#C9A84C", marginBottom: 16 }}>
                {isExpanded && (
                  <SplitText
                    text={item.label}
                    tag="span"
                    delay={40}
                    duration={0.5}
                    ease="power3.out"
                    from={{ opacity: 0, y: 15 }}
                    to={{ opacity: 1, y: 0 }}
                  />
                )}
              </div>
              <div className="nav-card-links">
                {item.links.map((lnk, i) => (
                  <FadeContent key={lnk.label} delay={100 + i * 80} duration={300} blur>
                    <a
                      className="nav-card-link"
                      href={lnk.href}
                      aria-label={lnk.ariaLabel}
                      style={{ color: "#F5ECD7" }}
                    >
                      <GoArrowUpRight className="nav-card-link-icon" aria-hidden="true" />
                      {lnk.label}
                    </a>
                  </FadeContent>
                ))}
              </div>
            </div>
          ))}
        </div>
      </nav>
    </div>
  )
}

export default CardNav

"use client"
import { Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupItem, SidebarFooter, useSidebar } from "@/components/ui/sidebar"
import WalletConnect from "./WalletConnect"
import FadeContent from "./FadeContent"
import SplitText from "./SplitText"
import { useState, useEffect } from "react"

const NAV = [
  {
    label: "Navigate",
    links: [
      { href: "/",            icon: "\u2B21", label: "Home" },
      { href: "/marketplace", icon: "\u25C8", label: "Marketplace" },
      { href: "/dashboard",   icon: "\u25CE", label: "Agents Dashboard" },
      { href: "/my-agents",   icon: "\u25C6", label: "My Agents" },
    ]
  },
  {
    label: "Chains",
    links: [
      { href: "https://0g.ai",          icon: "\u25CB", label: "0G Chain" },
      { href: "https://hedera.com",     icon: "\u2B21", label: "Hedera" },
      { href: "https://adi.foundation", icon: "\u25C7", label: "ADI Chain" },
    ]
  },
]

export default function AppSidebar() {
  const { open } = useSidebar()
  const [wasOpen, setWasOpen] = useState(false)

  useEffect(() => {
    if (open) setWasOpen(true)
    else {
      const timeout = setTimeout(() => setWasOpen(false), 350)
      return () => clearTimeout(timeout)
    }
  }, [open])

  return (
    <Sidebar>
      <SidebarHeader>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          {(open || wasOpen) && (
            <SplitText
              text="AgentFi"
              tag="span"
              delay={40}
              duration={0.5}
              ease="power3.out"
              from={{ opacity: 0, y: 10 }}
              to={{ opacity: 1, y: 0 }}
              className=""
            />
          )}
        </div>
      </SidebarHeader>

      <SidebarContent>
        {NAV.map((group, gi) => (
          <SidebarGroup key={group.label} label={group.label}>
            {group.links.map((link, li) => (
              <FadeContent key={link.href} delay={100 + gi * 80 + li * 60} duration={300} blur>
                <SidebarGroupItem href={link.href}>
                  <span style={{ color: "#C9A84C", fontSize: 14, width: 20, textAlign: "center" }}>{link.icon}</span>
                  {link.label}
                </SidebarGroupItem>
              </FadeContent>
            ))}
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <FadeContent delay={400} duration={300}>
          <WalletConnect />
        </FadeContent>
      </SidebarFooter>
    </Sidebar>
  )
}

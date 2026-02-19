"use client"
import { Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupItem, SidebarFooter } from "@/components/ui/sidebar"
import WalletConnect from "./WalletConnect"
import FadeContent from "./FadeContent"

const NAV = [
  {
    label: "Navigate",
    links: [
      { href: "/",            icon: "\u2B21", label: "Home" },
      { href: "/marketplace", icon: "\u25C8", label: "Marketplace" },
      { href: "/dashboard",   icon: "\u25CE", label: "Agent Creation" },
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
  return (
    <Sidebar>
      <SidebarHeader>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }} />
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

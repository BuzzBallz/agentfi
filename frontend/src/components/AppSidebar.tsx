"use client"
import { Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupItem, SidebarFooter, useSidebar } from "@/components/ui/sidebar"
import WalletConnect from "./WalletConnect"

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
  const { open } = useSidebar()

  return (
    <Sidebar>
      <SidebarHeader>
      </SidebarHeader>

      <SidebarContent>
        {NAV.map((group, gi) => (
          <SidebarGroup key={group.label} label={group.label}>
            {group.links.map((link, li) => (
              <div
                key={link.href}
                style={{
                  animation: open ? "fadeSlideIn 0.3s ease forwards" : "none",
                  animationDelay: `${(gi * 4 + li) * 50}ms`,
                  opacity: 0,
                }}
              >
                <SidebarGroupItem href={link.href}>
                  <span style={{ color: "#C9A84C", fontSize: 14, width: 20, textAlign: "center" }}>{link.icon}</span>
                  {link.label}
                </SidebarGroupItem>
              </div>
            ))}
          </SidebarGroup>
        ))}
      </SidebarContent>

      <SidebarFooter>
        <div style={{ animation: open ? "fadeSlideIn 0.3s ease 0.3s forwards" : "none", opacity: 0 }}>
          <WalletConnect />
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}

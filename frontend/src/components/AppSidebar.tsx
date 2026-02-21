"use client"
import { Sidebar, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupItem, useSidebar } from "@/components/ui/sidebar"
import { useAppMode } from "@/context/AppModeContext"

const NAV = [
  {
    label: "Navigate",
    links: [
      { href: "/",            icon: "\u2B21", label: "Home" },
      { href: "/marketplace", icon: "\u25C8", label: "Marketplace" },
      { href: "/dashboard",        icon: "\u25CE", label: "Dashboard" },
      { href: "/dashboard/create", icon: "\u25C6", label: "Create Agent" },
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
  const { isCompliant, chainName, currencySymbol, resetMode } = useAppMode()

  return (
    <Sidebar>
      <SidebarHeader>
        {/* Mode indicator */}
        <div style={{
          padding: "10px 16px",
          borderBottom: "1px solid #3D2E1A",
        }}>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            marginBottom: 6,
          }}>
            <div style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: isCompliant ? "#60A5FA" : "#7A9E6E",
            }} />
            <span style={{
              color: isCompliant ? "#60A5FA" : "#7A9E6E",
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: "0.05em",
              fontFamily: "monospace",
            }}>
              {isCompliant ? "COMPLIANT" : "PERMISSIONLESS"}
            </span>
          </div>
          <div style={{ color: "#5C4A32", fontSize: 10, fontFamily: "monospace" }}>
            {chainName} · {currencySymbol}
          </div>
          <button
            onClick={() => resetMode()}
            style={{
              background: "none",
              border: "1px solid #3D2E1A",
              color: "#9A8060",
              fontSize: 10,
              padding: "3px 8px",
              borderRadius: 4,
              cursor: "pointer",
              marginTop: 6,
              fontFamily: "monospace",
            }}
          >
            Switch Mode
          </button>
        </div>
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
    </Sidebar>
  )
}

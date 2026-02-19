"use client"
import * as React from "react"
import { cn } from "@/lib/utils"

const SidebarContext = React.createContext<{ open: boolean; setOpen: (v: boolean) => void }>({ open: false, setOpen: () => {} })

export function SidebarProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <SidebarContext.Provider value={{ open, setOpen }}>
      {children}
    </SidebarContext.Provider>
  )
}

export function useSidebar() {
  return React.useContext(SidebarContext)
}

export function Sidebar({ children, className }: { children: React.ReactNode; className?: string }) {
  const { open } = useSidebar()
  return (
    <>
      {open && <SidebarOverlay />}
      <aside
        className={cn(className)}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          height: "100vh",
          width: open ? 280 : 0,
          background: "#1A1208",
          borderRight: open ? "1px solid #3D2E1A" : "none",
          zIndex: 200,
          overflow: "hidden",
          transition: "width 0.35s cubic-bezier(0.4,0,0.2,1)",
          display: "flex",
          flexDirection: "column",
        }}
      >
        {children}
      </aside>
    </>
  )
}

function SidebarOverlay() {
  const { setOpen } = useSidebar()
  return (
    <div
      onClick={() => setOpen(false)}
      style={{ position: "fixed", inset: 0, zIndex: 199, background: "rgba(10,6,2,0.6)" }}
    />
  )
}

export function SidebarHeader({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ padding: "24px 20px 16px", borderBottom: "1px solid #3D2E1A" }}>
      {children}
    </div>
  )
}

export function SidebarContent({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ flex: 1, overflowY: "auto", padding: "16px 0" }}>
      {children}
    </div>
  )
}

export function SidebarGroup({ children, label }: { children?: React.ReactNode; label?: string }) {
  return (
    <div style={{ padding: "8px 0 16px" }}>
      {label && (
        <p style={{ color: "#5C4A32", fontFamily: "monospace", fontSize: 10, letterSpacing: "0.15em", textTransform: "uppercase", padding: "0 20px", marginBottom: 8 }}>
          {label}
        </p>
      )}
      {children}
    </div>
  )
}

export function SidebarGroupItem({ href, children }: { href: string; children: React.ReactNode }) {
  const { setOpen } = useSidebar()
  return (
    <a
      href={href}
      onClick={() => setOpen(false)}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 20px",
        color: "#F5ECD7",
        textDecoration: "none",
        fontSize: 14,
        fontFamily: "'DM Sans', sans-serif",
        transition: "background 0.15s, color 0.15s",
        borderRadius: 0,
      }}
      onMouseOver={(e) => {
        e.currentTarget.style.background = "#241A0E"
        e.currentTarget.style.color = "#C9A84C"
      }}
      onMouseOut={(e) => {
        e.currentTarget.style.background = "transparent"
        e.currentTarget.style.color = "#F5ECD7"
      }}
    >
      {children}
    </a>
  )
}

export function SidebarFooter({ children }: { children?: React.ReactNode }) {
  return (
    <div style={{ padding: "16px 20px", borderTop: "1px solid #3D2E1A" }}>
      {children}
    </div>
  )
}

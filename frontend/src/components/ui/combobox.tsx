"use client"

import * as React from "react"
import { Command as CommandPrimitive } from "cmdk"
import { Search } from "lucide-react"
import { cn } from "@/lib/utils"

const Combobox = CommandPrimitive

const ComboboxInput = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Input>
>(({ className, ...props }, ref) => (
  <div style={{ display: "flex", alignItems: "center", borderBottom: "1px solid #3D2E1A", padding: "8px 12px", gap: 8 }}>
    <Search size={14} color="#5C4422" />
    <CommandPrimitive.Input
      ref={ref}
      className={cn("combobox-input", className)}
      style={{
        background: "none", border: "none", outline: "none",
        fontFamily: "'Space Mono', monospace", fontSize: 12,
        color: "#F5ECD7", letterSpacing: "0.05em", width: "100%",
      }}
      {...props}
    />
  </div>
))
ComboboxInput.displayName = "ComboboxInput"

const ComboboxList = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.List>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.List ref={ref} className={cn(className)} {...props} />
))
ComboboxList.displayName = "ComboboxList"

const ComboboxEmpty = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Empty>
>((props, ref) => (
  <CommandPrimitive.Empty
    ref={ref}
    style={{ padding: "12px 16px", fontFamily: "'Space Mono', monospace", fontSize: 11, color: "#5C4422", textAlign: "center" }}
    {...props}
  />
))
ComboboxEmpty.displayName = "ComboboxEmpty"

const ComboboxItem = React.forwardRef<
  React.ElementRef<typeof CommandPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof CommandPrimitive.Item>
>(({ className, ...props }, ref) => (
  <CommandPrimitive.Item
    ref={ref}
    style={{
      padding: "10px 16px",
      fontFamily: "'Space Mono', monospace", fontSize: 11,
      color: "#9A8060", cursor: "pointer", letterSpacing: "0.05em",
    }}
    className={cn("combobox-item", className)}
    {...props}
  />
))
ComboboxItem.displayName = "ComboboxItem"

const ComboboxContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    style={{
      position: "absolute", top: "calc(100% + 6px)", left: 0, zIndex: 50,
      minWidth: 200,
      background: "#1A1208", border: "1px solid #3D2E1A",
      borderRadius: 10, overflow: "hidden",
      boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
    }}
    className={cn(className)}
    {...props}
  />
))
ComboboxContent.displayName = "ComboboxContent"

export { Combobox, ComboboxInput, ComboboxList, ComboboxEmpty, ComboboxItem, ComboboxContent }

"use client"

import React, { useState, useRef, useCallback } from "react"
import "./Folder.css"

interface FolderProps {
  color?: string
  size?: number
  items?: React.ReactNode[]
}

function hexToRgb(hex: string) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  return result
    ? { r: parseInt(result[1], 16), g: parseInt(result[2], 16), b: parseInt(result[3], 16) }
    : { r: 201, g: 168, b: 76 }
}

const Folder: React.FC<FolderProps> = ({
  color = "#C9A84C",
  size = 1,
  items = [],
}) => {
  const [open, setOpen] = useState(false)
  const folderRef = useRef<HTMLDivElement>(null)

  const rgb = hexToRgb(color)

  const folderColor = `rgb(${rgb.r}, ${rgb.g}, ${rgb.b})`
  const folderBackColor = `rgb(${Math.max(0, rgb.r - 40)}, ${Math.max(0, rgb.g - 40)}, ${Math.max(0, rgb.b - 40)})`
  const paper1 = `rgb(${Math.min(255, rgb.r + 60)}, ${Math.min(255, rgb.g + 60)}, ${Math.min(255, rgb.b + 60)})`
  const paper2 = `rgb(${Math.min(255, rgb.r + 40)}, ${Math.min(255, rgb.g + 40)}, ${Math.min(255, rgb.b + 40)})`
  const paper3 = `rgb(${Math.min(255, rgb.r + 20)}, ${Math.min(255, rgb.g + 20)}, ${Math.min(255, rgb.b + 20)})`

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!folderRef.current || !open) return
    const rect = folderRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left - rect.width / 2
    const y = e.clientY - rect.top - rect.height / 2
    folderRef.current.style.setProperty("--magnet-x", `${x * 0.1}px`)
    folderRef.current.style.setProperty("--magnet-y", `${y * 0.1}px`)
  }, [open])

  const handleMouseLeave = useCallback(() => {
    if (!folderRef.current) return
    folderRef.current.style.setProperty("--magnet-x", "0px")
    folderRef.current.style.setProperty("--magnet-y", "0px")
  }, [])

  return (
    <div
      ref={folderRef}
      className={`folder${open ? " open" : ""}`}
      onClick={() => setOpen(!open)}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        "--folder-color": folderColor,
        "--folder-back-color": folderBackColor,
        "--paper-1": paper1,
        "--paper-2": paper2,
        "--paper-3": paper3,
        transform: `scale(${size})`,
        transformOrigin: "bottom center",
      } as React.CSSProperties}
    >
      <div className="folder__back" />
      <div className="paper paper-1">{items[0] ?? null}</div>
      <div className="paper paper-2">{items[1] ?? null}</div>
      <div className="paper paper-3">{items[2] ?? null}</div>
      <div className="folder__front" />
      <div className="folder__front right" />
    </div>
  )
}

export default Folder

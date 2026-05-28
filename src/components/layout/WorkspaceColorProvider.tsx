'use client'

import { useEffect } from 'react'
import { useWorkspaceStore } from '@/lib/stores/workspace.store'

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '')
  const r = parseInt(clean.slice(0, 2), 16)
  const g = parseInt(clean.slice(2, 4), 16)
  const b = parseInt(clean.slice(4, 6), 16)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '99 102 241'
  return `${r} ${g} ${b}`
}

function lighten(hex: string): string {
  const clean = hex.replace('#', '')
  const r = Math.min(255, parseInt(clean.slice(0, 2), 16) + 20)
  const g = Math.min(255, parseInt(clean.slice(2, 4), 16) + 20)
  const b = Math.min(255, parseInt(clean.slice(4, 6), 16) + 20)
  if (isNaN(r) || isNaN(g) || isNaN(b)) return '129 140 248'
  return `${r} ${g} ${b}`
}

export function WorkspaceColorProvider() {
  const color = useWorkspaceStore((s) => s.currentWorkspace?.color)

  useEffect(() => {
    if (!color) return
    const root = document.documentElement
    root.style.setProperty('--accent', hexToRgb(color))
    root.style.setProperty('--accent-hover', lighten(color))
  }, [color])

  return null
}

'use client'

import { useEffect } from 'react'
import { useWorkspaceStore } from '@/lib/stores/workspace.store'

export function WorkspaceColorProvider() {
  const color = useWorkspaceStore((s) => s.currentWorkspace?.color)

  useEffect(() => {
    if (!color) return
    const root = document.documentElement
    root.style.setProperty('--primary', color)
    root.style.setProperty('--ring', color)
  }, [color])

  return null
}

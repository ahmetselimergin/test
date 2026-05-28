'use client'

import { useEffect, useState } from 'react'
import { useTheme } from 'next-themes'
import { Sun, Moon, Monitor } from 'lucide-react'
import { cn } from '@/lib/utils'

const themes = [
  { value: 'light', label: 'Açık', icon: Sun },
  { value: 'dark', label: 'Koyu', icon: Moon },
  { value: 'system', label: 'Sistem', icon: Monitor },
] as const

export function ThemeSettings() {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => setMounted(true), [])

  return (
    <div className="flex gap-2">
      {themes.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          onClick={() => setTheme(value)}
          className={cn(
            'flex-1 flex flex-col items-center gap-2 p-3 rounded-xl border transition-all text-[12px] font-medium',
            mounted && theme === value
              ? 'border-accent bg-accent/8 text-accent'
              : 'border-subtle text-muted hover:text-foreground hover:border-foreground/20 hover:bg-subtle/60'
          )}
        >
          <Icon size={16} />
          {label}
        </button>
      ))}
    </div>
  )
}

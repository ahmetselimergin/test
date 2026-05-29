'use client'

import { PATTERNS } from '@/lib/patterns'
import { cn } from '@/lib/utils'

interface Props {
  color: string
  selected: string
  onChange: (id: string) => void
}

export function PatternPicker({ color, selected, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2">
      {PATTERNS.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onChange(p.id)}
          title={p.label}
          className={cn(
            'relative size-10 rounded-lg overflow-hidden border-2 transition-all hover:scale-110 shrink-0',
            selected === p.id ? 'border-white shadow-lg scale-110' : 'border-transparent opacity-70 hover:opacity-100'
          )}
          style={{ backgroundColor: color }}
        >
          {p.backgroundImage !== 'none' && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: p.backgroundImage,
                backgroundSize: p.backgroundSize,
                backgroundPosition: p.backgroundPosition ?? '0 0',
                opacity: p.opacity,
              }}
            />
          )}
          <span className="absolute bottom-0.5 left-0 right-0 text-center text-white/80 text-[8px] font-medium leading-none">
            {p.label}
          </span>
        </button>
      ))}
    </div>
  )
}

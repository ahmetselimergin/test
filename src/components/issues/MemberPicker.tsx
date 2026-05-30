'use client'

import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, UserCircle2 } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import type { MemberSummary } from '@/lib/supabase/types'

interface Props {
  members: MemberSummary[]
  value: string | null
  onChange: (id: string | null) => void
}

function initials(name: string | null, email: string | null): string {
  if (name) return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
  return (email?.[0] ?? '?').toUpperCase()
}

export function MemberPicker({ members, value, onChange }: Props) {
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const ref = useRef<HTMLDivElement>(null)

  const selected = members.find((m) => m.id === value) ?? null

  const filtered = members.filter((m) => {
    const q = search.toLowerCase()
    return (
      m.full_name?.toLowerCase().includes(q) ||
      m.email?.toLowerCase().includes(q) ||
      m.job_title?.toLowerCase().includes(q)
    )
  })

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [])

  function handleSelect(id: string) {
    onChange(value === id ? null : id)
    setOpen(false)
    setSearch('')
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'flex items-center gap-2 h-7 px-2.5 rounded-md border text-[12px] transition-all max-w-full overflow-hidden',
          open
            ? 'border-primary/50 bg-primary/10 text-primary'
            : 'border-border bg-transparent text-muted-foreground hover:border-foreground/20 hover:text-foreground'
        )}
      >
        {selected ? (
          <>
            <Avatar className="size-4 shrink-0">
              <AvatarFallback className="text-[9px] bg-primary/20 text-primary font-medium">
                {initials(selected.full_name, selected.email)}
              </AvatarFallback>
            </Avatar>
            <span className="font-medium text-foreground truncate min-w-0">
              {selected.full_name ?? selected.email}
            </span>
            <span
              role="button"
              tabIndex={-1}
              onClick={(e) => { e.stopPropagation(); onChange(null) }}
              className="ml-auto shrink-0 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={10} />
            </span>
          </>
        ) : (
          <>
            <UserCircle2 size={13} />
            <span>Ata...</span>
          </>
        )}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.97 }}
            transition={{ duration: 0.14, ease: [0.16, 1, 0.3, 1] as const }}
            className="absolute top-full right-0 mt-1.5 z-50 w-64 rounded-xl border border-border bg-background shadow-xl overflow-hidden"
          >
            <div className="flex items-center gap-2 px-3 py-2.5 border-b border-border">
              <Search size={12} className="text-muted-foreground shrink-0" />
              <input
                autoFocus
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="İsim veya rol ara..."
                className="flex-1 text-[12px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground/50"
              />
            </div>

            <div className="max-h-52 overflow-y-auto py-1">
              {members.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-5">Ekip üyesi bulunamadı</p>
              ) : filtered.length === 0 ? (
                <p className="text-[11px] text-muted-foreground text-center py-5">Eşleşen üye yok</p>
              ) : (
                <div className="flex flex-col gap-1.5 p-2">
                  {filtered.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSelect(m.id)}
                      className={cn(
                        'w-full flex items-center gap-3 px-3 py-2.5 rounded-lg border text-left transition-all',
                        value === m.id
                          ? 'border-primary/40 bg-primary/10'
                          : 'border-border bg-card hover:border-foreground/20 hover:bg-muted'
                      )}
                    >
                      <Avatar className="size-8 shrink-0">
                        <AvatarFallback className="text-[11px] bg-primary/20 text-primary font-semibold">
                          {initials(m.full_name, m.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-semibold text-foreground truncate leading-tight">
                          {m.full_name ?? m.email}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate leading-tight mt-0.5">
                          {m.email}
                        </p>
                      </div>
                      {value === m.id && (
                        <span className="size-[6px] rounded-full bg-primary shrink-0" />
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

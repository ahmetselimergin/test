'use client'

import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X } from 'lucide-react'
import { useIssueStore } from '@/lib/stores/issue.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { TypeIcon } from '@/components/issues/TypeIcon'
import { formatIssueId, statusConfig, cn } from '@/lib/utils'

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

const STATUS_DOT: Record<string, string> = {
  todo:        'bg-slate-400',
  in_progress: 'bg-blue-500',
  review:      'bg-amber-400',
  done:        'bg-emerald-500',
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)
  const issues = useIssueStore((s) => s.issues)
  const setSelectedIssue = useIssueStore((s) => s.setSelectedIssue)
  const project = useProjectStore((s) => s.currentProject)

  useEffect(() => {
    if (open) {
      setQuery('')
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const filtered = issues
    .filter((i) => {
      if (!query.trim()) return true
      const q = query.toLowerCase()
      const key = project ? formatIssueId(project.key, i.issue_number).toLowerCase() : ''
      return i.title.toLowerCase().includes(q) || key.includes(q)
    })
    .slice(0, 8)

  function handleSelect(issueId: string) {
    const issue = issues.find((i) => i.id === issueId)
    if (issue) setSelectedIssue(issue)
    onClose()
  }

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh]"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose() }}
    >
      <div className="absolute inset-0 bg-black/30 backdrop-blur-xs" />
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-lg rounded-2xl border border-border bg-popover shadow-2xl overflow-hidden"
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border">
          <Search size={15} className="text-muted-foreground shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Issue ara..."
            className="flex-1 bg-transparent text-[14px] text-foreground placeholder:text-muted-foreground/60 outline-none"
          />
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors shrink-0"
          >
            <X size={14} />
          </button>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-1.5">
          {filtered.length === 0 ? (
            <p className="text-center text-[13px] text-muted-foreground py-8">
              {query ? 'Sonuç bulunamadı' : 'Henüz issue yok'}
            </p>
          ) : (
            filtered.map((issue) => (
              <button
                key={issue.id}
                onClick={() => handleSelect(issue.id)}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-muted transition-colors group"
              >
                <TypeIcon type={issue.type} size={13} className="shrink-0 text-muted-foreground" />
                <span className="flex-1 text-[13px] text-foreground truncate">{issue.title}</span>
                <div className="flex items-center gap-2 shrink-0">
                  <span
                    className={cn('size-[6px] rounded-full shrink-0', STATUS_DOT[issue.status] ?? 'bg-slate-400')}
                  />
                  {project && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {formatIssueId(project.key, issue.issue_number)}
                    </span>
                  )}
                </div>
              </button>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-border flex items-center gap-3 text-[11px] text-muted-foreground">
          <span><kbd className="bg-muted border border-border rounded px-1 py-0.5 font-mono text-[10px]">↵</kbd> aç</span>
          <span><kbd className="bg-muted border border-border rounded px-1 py-0.5 font-mono text-[10px]">Esc</kbd> kapat</span>
        </div>
      </motion.div>
    </div>
  )
}

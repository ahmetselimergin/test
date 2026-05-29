'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { TypeIcon } from '@/components/issues/TypeIcon'
import { cn, priorityConfig, typeConfig } from '@/lib/utils'
import type { Issue, MemberSummary, Priority, IssueType } from '@/lib/supabase/types'

export interface BoardFilters {
  assignees: string[]
  priorities: Priority[]
  types: IssueType[]
  labels: string[]
}

export function isFilterActive(f: BoardFilters): boolean {
  return f.assignees.length > 0 || f.priorities.length > 0 || f.types.length > 0 || f.labels.length > 0
}

export function matchesFilters(issue: Issue, f: BoardFilters): boolean {
  if (f.assignees.length > 0 && (issue.assignee_id === null || !f.assignees.includes(issue.assignee_id))) return false
  if (f.priorities.length > 0 && !f.priorities.includes(issue.priority)) return false
  if (f.types.length > 0 && !f.types.includes(issue.type)) return false
  if (f.labels.length > 0 && !f.labels.some(l => issue.labels.includes(l))) return false
  return true
}

const PRIORITY_DOT: Record<Priority, string> = {
  critical: 'bg-rose-400',
  high: 'bg-orange-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
}

const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low']
const TYPES: IssueType[] = ['task', 'story', 'bug', 'feature']

interface Props {
  filters: BoardFilters
  onChange: (filters: BoardFilters) => void
  members: MemberSummary[]
  allLabels: string[]
}

function toggle<T>(arr: T[], val: T): T[] {
  return arr.includes(val) ? arr.filter(v => v !== val) : [...arr, val]
}

const EMPTY: BoardFilters = { assignees: [], priorities: [], types: [], labels: [] }

const chip = (active: boolean) => cn(
  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all shrink-0',
  active
    ? 'border-primary/40 bg-primary/10 text-primary'
    : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'
)

const row = (active: boolean) => cn(
  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors',
  active ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
)

export function FilterBar({ filters, onChange, members, allLabels }: Props) {
  return (
    <div className="flex items-center gap-2 px-6 py-2.5 border-b border-border bg-card/30 overflow-x-auto shrink-0">

      {/* Assignee */}
      <Popover>
        <PopoverTrigger className={chip(filters.assignees.length > 0)}>
            Atanan
            {filters.assignees.length > 0 && (
              <span className="size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {filters.assignees.length}
              </span>
            )}
        </PopoverTrigger>
        <PopoverContent className="w-52 p-1" align="start">
          {members.map(m => (
            <button key={m.id} onClick={() => onChange({ ...filters, assignees: toggle(filters.assignees, m.id) })}
              className={row(filters.assignees.includes(m.id))}>
              <Avatar className="size-5 shrink-0">
                {m.avatar_url
                  ? <img src={m.avatar_url} alt={m.full_name ?? ''} className="size-full object-cover rounded-full" />
                  : <AvatarFallback className="text-[8px] bg-primary/20 text-primary font-bold">
                      {(m.full_name ?? m.email ?? '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                }
              </Avatar>
              <span className="truncate">{m.full_name ?? m.email ?? 'Unknown'}</span>
              {filters.assignees.includes(m.id) && <span className="ml-auto">✓</span>}
            </button>
          ))}
          {members.length === 0 && <p className="px-2.5 py-2 text-[12px] text-muted">Üye yok</p>}
        </PopoverContent>
      </Popover>

      {/* Priority */}
      <Popover>
        <PopoverTrigger className={chip(filters.priorities.length > 0)}>
            Öncelik
            {filters.priorities.length > 0 && (
              <span className="size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {filters.priorities.length}
              </span>
            )}
        </PopoverTrigger>
        <PopoverContent className="w-44 p-1" align="start">
          {PRIORITIES.map(p => (
            <button key={p} onClick={() => onChange({ ...filters, priorities: toggle(filters.priorities, p) })}
              className={row(filters.priorities.includes(p))}>
              <span className={cn('size-2 rounded-full shrink-0', PRIORITY_DOT[p])} />
              {priorityConfig[p].label}
              {filters.priorities.includes(p) && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Type */}
      <Popover>
        <PopoverTrigger className={chip(filters.types.length > 0)}>
            Tür
            {filters.types.length > 0 && (
              <span className="size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                {filters.types.length}
              </span>
            )}
        </PopoverTrigger>
        <PopoverContent className="w-40 p-1" align="start">
          {TYPES.map(t => (
            <button key={t} onClick={() => onChange({ ...filters, types: toggle(filters.types, t) })}
              className={row(filters.types.includes(t))}>
              <TypeIcon type={t} size={13} />
              {typeConfig[t].label}
              {filters.types.includes(t) && <span className="ml-auto">✓</span>}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Label */}
      {allLabels.length > 0 && (
        <Popover>
          <PopoverTrigger className={chip(filters.labels.length > 0)}>
              Etiket
              {filters.labels.length > 0 && (
                <span className="size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
                  {filters.labels.length}
                </span>
              )}
          </PopoverTrigger>
          <PopoverContent className="w-48 p-1 max-h-60 overflow-y-auto" align="start">
            {allLabels.map(l => (
              <button key={l} onClick={() => onChange({ ...filters, labels: toggle(filters.labels, l) })}
                className={row(filters.labels.includes(l))}>
                <span className="truncate">{l}</span>
                {filters.labels.includes(l) && <span className="ml-auto">✓</span>}
              </button>
            ))}
          </PopoverContent>
        </Popover>
      )}

      {/* Active chips */}
      <AnimatePresence>
        {filters.assignees.map(id => {
          const m = members.find(x => x.id === id)
          return (
            <motion.span key={`a-${id}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.12 }}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium shrink-0">
              {m?.full_name ?? m?.email ?? id}
              <button onClick={() => onChange({ ...filters, assignees: filters.assignees.filter(a => a !== id) })} className="hover:opacity-60 transition-opacity"><X size={10} /></button>
            </motion.span>
          )
        })}
        {filters.priorities.map(p => (
          <motion.span key={`p-${p}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.12 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent text-[11px] font-medium shrink-0">
            <span className={cn('size-[6px] rounded-full', PRIORITY_DOT[p])} />
            {priorityConfig[p].label}
            <button onClick={() => onChange({ ...filters, priorities: filters.priorities.filter(x => x !== p) })} className="hover:opacity-60 transition-opacity"><X size={10} /></button>
          </motion.span>
        ))}
        {filters.types.map(t => (
          <motion.span key={`t-${t}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.12 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent text-[11px] font-medium shrink-0">
            <TypeIcon type={t} size={11} />
            {typeConfig[t].label}
            <button onClick={() => onChange({ ...filters, types: filters.types.filter(x => x !== t) })} className="hover:opacity-60 transition-opacity"><X size={10} /></button>
          </motion.span>
        ))}
        {filters.labels.map(l => (
          <motion.span key={`l-${l}`} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.12 }}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/20 text-accent text-[11px] font-medium shrink-0">
            {l}
            <button onClick={() => onChange({ ...filters, labels: filters.labels.filter(x => x !== l) })} className="hover:opacity-60 transition-opacity"><X size={10} /></button>
          </motion.span>
        ))}
        {isFilterActive(filters) && (
          <motion.button key="clear" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.12 }}
            onClick={() => onChange(EMPTY)}
            className="ml-auto text-[11px] text-muted hover:text-foreground transition-colors shrink-0 px-2">
            Tümünü temizle
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}

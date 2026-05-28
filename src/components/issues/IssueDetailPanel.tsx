'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Link2, Check, ChevronDown } from 'lucide-react'
import { useIssueStore } from '@/lib/stores/issue.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { TypeIcon } from './TypeIcon'
import { IssueEditor } from './IssueEditor'
import { MemberPicker } from './MemberPicker'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { formatIssueId, statusConfig, priorityConfig, typeConfig, cn } from '@/lib/utils'
import type { Issue, IssueStatus, Priority, IssueType, MemberSummary } from '@/lib/supabase/types'
import { toast } from 'sonner'

const STATUS_COLORS: Record<IssueStatus, string> = {
  todo:        'bg-slate-500/15 text-slate-300 border-slate-500/25 hover:bg-slate-500/25',
  in_progress: 'bg-blue-500/15 text-blue-300 border-blue-500/25 hover:bg-blue-500/25',
  review:      'bg-amber-500/15 text-amber-300 border-amber-500/25 hover:bg-amber-500/25',
  done:        'bg-emerald-500/15 text-emerald-300 border-emerald-500/25 hover:bg-emerald-500/25',
}

const PRIORITY_COLORS: Record<Priority, string> = {
  critical: 'text-rose-400',
  high:     'text-orange-400',
  medium:   'text-amber-400',
  low:      'text-slate-400',
}

const PRIORITY_DOT: Record<Priority, string> = {
  critical: 'bg-rose-400',
  high:     'bg-orange-400',
  medium:   'bg-amber-400',
  low:      'bg-slate-400',
}

function PropRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="py-3 border-b border-subtle/40 last:border-0 flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold text-muted uppercase tracking-widest">
        {label}
      </span>
      <div>{children}</div>
    </div>
  )
}

function IssueDetailContent({
  issue,
  issueKey,
  onClose,
  members,
}: {
  issue: Issue
  issueKey: string | null
  onClose: () => void
  members: MemberSummary[]
}) {
  const { updateIssue, removeIssue } = useIssueStore()
  const assignee = members.find((m) => m.id === issue.assignee_id)

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('issues').delete().eq('id', issue.id)
    removeIssue(issue.id)
    onClose()
    toast.success('Issue silindi')
  }

  async function handleStatusChange(status: IssueStatus) {
    updateIssue(issue.id, { status })
    const supabase = createClient()
    await supabase.from('issues').update({ status }).eq('id', issue.id)
  }

  async function handlePriorityChange(priority: Priority) {
    updateIssue(issue.id, { priority })
    const supabase = createClient()
    await supabase.from('issues').update({ priority }).eq('id', issue.id)
  }

  async function handleTypeChange(type: IssueType) {
    updateIssue(issue.id, { type })
    const supabase = createClient()
    await supabase.from('issues').update({ type }).eq('id', issue.id)
  }

  async function handleAssigneeChange(id: string | null) {
    updateIssue(issue.id, { assignee_id: id })
    const supabase = createClient()
    await supabase.from('issues').update({ assignee_id: id }).eq('id', issue.id)
  }

  function copyKey() {
    if (issueKey) {
      navigator.clipboard.writeText(issueKey)
      toast.success('Kopyalandı')
    }
  }

  const statuses = Object.keys(statusConfig) as IssueStatus[]
  const priorities = Object.keys(priorityConfig) as Priority[]
  const types = Object.keys(typeConfig) as IssueType[]

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-subtle shrink-0">
        <div className="flex items-center gap-2 text-[12px] text-muted min-w-0">
          <TypeIcon type={issue.type} size={14} />
          <button
            type="button"
            onClick={copyKey}
            className="font-mono text-accent hover:underline cursor-pointer"
          >
            {issueKey}
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-7 text-muted hover:text-foreground" onClick={copyKey}>
            <Link2 size={13} />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-muted hover:text-rose-400" onClick={handleDelete}>
            <Trash2 size={13} />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-muted hover:text-foreground" onClick={onClose}>
            <X size={15} />
          </Button>
        </div>
      </div>

      {/* ── Body: main + sidebar ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0 px-5 py-4 gap-4">
          {/* Title */}
          <h2 className="text-[17px] font-semibold leading-snug tracking-tight text-foreground">
            {issue.title}
          </h2>

          {/* Status + Priority chips */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Status dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className={cn(
                  'flex items-center gap-1.5 px-2.5 py-1 rounded-md border text-[11px] font-semibold uppercase tracking-wider outline-none transition-colors cursor-pointer',
                  STATUS_COLORS[issue.status]
                )}
              >
                {statusConfig[issue.status].label}
                <ChevronDown size={10} />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {statuses.map((s) => (
                  <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)} className="text-xs">
                    <span className={cn('flex-1', s === issue.status && 'font-medium')}>
                      {statusConfig[s].label}
                    </span>
                    {s === issue.status && <Check size={11} className="text-accent" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Priority badge */}
            <DropdownMenu>
              <DropdownMenuTrigger
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-subtle bg-transparent text-[11px] font-medium outline-none hover:bg-subtle transition-colors cursor-pointer"
              >
                <span className={cn('size-[6px] rounded-full shrink-0', PRIORITY_DOT[issue.priority])} />
                <span className={cn(PRIORITY_COLORS[issue.priority])}>
                  {priorityConfig[issue.priority].label}
                </span>
                <ChevronDown size={10} className="text-muted" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                {priorities.map((p) => (
                  <DropdownMenuItem key={p} onClick={() => handlePriorityChange(p)} className="text-xs">
                    <span className={cn('size-[6px] rounded-full shrink-0', PRIORITY_DOT[p])} />
                    <span className={cn('flex-1', PRIORITY_COLORS[p])}>{priorityConfig[p].label}</span>
                    {p === issue.priority && <Check size={11} className="text-accent" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Description */}
          <div>
            <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Açıklama</p>
            <IssueEditor mode="edit" issueId={issue.id} initialContent={issue.description ?? ''} />
          </div>

          {/* Labels */}
          {issue.labels.length > 0 && (
            <div>
              <p className="text-[11px] font-medium text-muted uppercase tracking-wider mb-2">Etiketler</p>
              <div className="flex flex-wrap gap-1.5">
                {issue.labels.map((label) => (
                  <span key={label} className="text-[11px] bg-subtle border border-subtle rounded px-2 py-0.5 text-foreground">
                    {label}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-[240px] shrink-0 border-l border-subtle px-4 py-2 overflow-y-auto flex flex-col gap-0">

          <PropRow label="Atanan">
            {assignee ? (
              <div className="flex items-center gap-1.5">
                <Avatar className="size-5 border border-subtle shrink-0">
                  {assignee.avatar_url ? (
                    <img src={assignee.avatar_url} alt={assignee.full_name ?? ''} className="size-full object-cover rounded-full" />
                  ) : (
                    <AvatarFallback className="text-[9px] bg-accent/20 text-accent font-semibold">
                      {(assignee.full_name ?? assignee.email ?? '?').slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                  )}
                </Avatar>
                <span className="text-[12px] text-foreground truncate">{assignee.full_name ?? assignee.email}</span>
              </div>
            ) : (
              <MemberPicker members={members} value={issue.assignee_id} onChange={handleAssigneeChange} />
            )}
            {assignee && (
              <button
                type="button"
                onClick={() => handleAssigneeChange(null)}
                className="text-[10px] text-muted hover:text-foreground mt-0.5 block"
              >
                Kaldır
              </button>
            )}
          </PropRow>

          <PropRow label="Tür">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 outline-none hover:opacity-75 transition-opacity cursor-pointer">
                <TypeIcon type={issue.type} size={12} />
                <span className="text-[12px] text-foreground">{typeConfig[issue.type].label}</span>
                <ChevronDown size={9} className="text-muted" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                {types.map((t) => (
                  <DropdownMenuItem key={t} onClick={() => handleTypeChange(t)} className="text-xs gap-2">
                    <TypeIcon type={t} size={12} />
                    <span className="flex-1">{typeConfig[t].label}</span>
                    {t === issue.type && <Check size={11} className="text-accent" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </PropRow>

          {issue.estimate !== null && (
            <PropRow label="Tahmin">
              <span className="text-[12px] text-foreground font-medium tabular-nums">{issue.estimate} pts</span>
            </PropRow>
          )}

          <PropRow label="Oluşturulma">
            <span className="text-[11px] text-muted">
              {new Date(issue.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </PropRow>

          <PropRow label="Güncelleme">
            <span className="text-[11px] text-muted">
              {new Date(issue.updated_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </PropRow>
        </div>
      </div>
    </div>
  )
}

export function IssueDetailPanel() {
  const { selectedIssue, setSelectedIssue } = useIssueStore()
  const currentProject = useProjectStore((s) => s.currentProject)
  const members = useProjectStore((s) => s.members)

  const issueKey =
    selectedIssue && currentProject
      ? formatIssueId(currentProject.key, selectedIssue.issue_number)
      : null

  return (
    <AnimatePresence>
      {selectedIssue && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setSelectedIssue(null)}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 36, stiffness: 420 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[640px] z-50 surface-elevated border-l border-subtle shadow-panel"
          >
            <IssueDetailContent
              key={selectedIssue.id}
              issue={selectedIssue}
              issueKey={issueKey}
              onClose={() => setSelectedIssue(null)}
              members={members}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

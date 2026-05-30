'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Link2, Check, ChevronDown, Pencil } from 'lucide-react'
import { useIssueStore } from '@/lib/stores/issue.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { TypeIcon } from './TypeIcon'
import { IssueEditor } from './IssueEditor'
import { IssueDetailTabs } from './IssueDetailTabs'
import { MemberPicker } from './MemberPicker'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import { formatIssueId, statusConfig, priorityConfig, typeConfig, cn, formatEstimate, parseEstimate } from '@/lib/utils'
import type { Issue, IssueStatus, Priority, IssueType, MemberSummary } from '@/lib/supabase/types'
import { toast } from 'sonner'

const STATUS_COLORS: Record<IssueStatus, string> = {
  todo:        'bg-slate-100 text-slate-600 border-slate-300 hover:bg-slate-200',
  in_progress: 'bg-blue-100 text-blue-700 border-blue-300 hover:bg-blue-200',
  review:      'bg-amber-100 text-amber-700 border-amber-300 hover:bg-amber-200',
  done:        'bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-200',
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
    <div className="py-3 border-b border-border/40 last:border-0 flex flex-col gap-1.5">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
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

  // Inline title editing
  const [editingTitle, setEditingTitle] = useState(false)
  const [titleDraft, setTitleDraft] = useState(issue.title)

  // Label editing
  const [labelInput, setLabelInput] = useState('')
  const [showLabelInput, setShowLabelInput] = useState(false)

  // Estimate editing
  const [editingEstimate, setEditingEstimate] = useState(false)
  const [estimateDraft, setEstimateDraft] = useState(formatEstimate(issue.estimate))

  // Clear stale data when panel opens a new issue
  useEffect(() => {
    useIssueStore.getState().setComments([])
    useIssueStore.getState().setActivityLogs([])
  }, [])

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('issues').delete().eq('id', issue.id)
    removeIssue(issue.id)
    onClose()
    toast.success('Issue silindi')
  }

  async function handleStatusChange(status: IssueStatus) {
    const oldStatus = issue.status
    updateIssue(issue.id, { status })
    const supabase = createClient()
    await supabase.from('issues').update({ status }).eq('id', issue.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (user && oldStatus !== status) {
      await supabase.from('activity_logs').insert({
        issue_id: issue.id,
        actor_id: user.id,
        action: 'status_changed',
        old_value: oldStatus,
        new_value: status,
      })
      useIssueStore.getState().setActivityLogs([
        { id: crypto.randomUUID(), issue_id: issue.id, actor_id: user.id, action: 'status_changed', old_value: oldStatus, new_value: status, created_at: new Date().toISOString() },
        ...useIssueStore.getState().activityLogs,
      ])
    }
  }

  async function handlePriorityChange(priority: Priority) {
    const oldPriority = issue.priority
    updateIssue(issue.id, { priority })
    const supabase = createClient()
    await supabase.from('issues').update({ priority }).eq('id', issue.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (user && oldPriority !== priority) {
      await supabase.from('activity_logs').insert({
        issue_id: issue.id,
        actor_id: user.id,
        action: 'priority_changed',
        old_value: oldPriority,
        new_value: priority,
      })
      useIssueStore.getState().setActivityLogs([
        { id: crypto.randomUUID(), issue_id: issue.id, actor_id: user.id, action: 'priority_changed', old_value: oldPriority, new_value: priority, created_at: new Date().toISOString() },
        ...useIssueStore.getState().activityLogs,
      ])
    }
  }

  async function handleTypeChange(type: IssueType) {
    updateIssue(issue.id, { type })
    const supabase = createClient()
    await supabase.from('issues').update({ type }).eq('id', issue.id)
  }

  async function handleAssigneeChange(id: string | null) {
    const oldAssigneeId = issue.assignee_id
    updateIssue(issue.id, { assignee_id: id })
    const supabase = createClient()
    await supabase.from('issues').update({ assignee_id: id }).eq('id', issue.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (user && oldAssigneeId !== id) {
      await supabase.from('activity_logs').insert({
        issue_id: issue.id,
        actor_id: user.id,
        action: 'assignee_changed',
        old_value: oldAssigneeId ?? null,
        new_value: id ?? null,
      })
      useIssueStore.getState().setActivityLogs([
        { id: crypto.randomUUID(), issue_id: issue.id, actor_id: user.id, action: 'assignee_changed', old_value: oldAssigneeId ?? null, new_value: id ?? null, created_at: new Date().toISOString() },
        ...useIssueStore.getState().activityLogs,
      ])
    }
  }

  function copyKey() {
    if (issueKey) {
      navigator.clipboard.writeText(issueKey)
      toast.success('Kopyalandı')
    }
  }

  async function handleTitleSave() {
    const trimmed = titleDraft.trim()
    if (!trimmed || trimmed === issue.title) { setTitleDraft(issue.title); setEditingTitle(false); return }
    const oldTitle = issue.title
    updateIssue(issue.id, { title: trimmed })
    setEditingTitle(false)
    const supabase = createClient()
    await supabase.from('issues').update({ title: trimmed }).eq('id', issue.id)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase.from('activity_logs').insert({
        issue_id: issue.id,
        actor_id: user.id,
        action: 'title_changed',
        old_value: oldTitle,
        new_value: trimmed,
      })
      useIssueStore.getState().setActivityLogs([
        { id: crypto.randomUUID(), issue_id: issue.id, actor_id: user.id, action: 'title_changed', old_value: oldTitle, new_value: trimmed, created_at: new Date().toISOString() },
        ...useIssueStore.getState().activityLogs,
      ])
    }
  }

  async function addLabel(label: string) {
    const trimmed = label.trim()
    if (!trimmed || issue.labels.includes(trimmed)) return
    const updated = [...issue.labels, trimmed]
    updateIssue(issue.id, { labels: updated })
    const supabase = createClient()
    await supabase.from('issues').update({ labels: updated }).eq('id', issue.id)
  }

  async function removeLabel(label: string) {
    const updated = issue.labels.filter((l) => l !== label)
    updateIssue(issue.id, { labels: updated })
    const supabase = createClient()
    await supabase.from('issues').update({ labels: updated }).eq('id', issue.id)
  }

  async function handleEstimateSave() {
    setEditingEstimate(false)
    const value = estimateDraft.trim() === '—' || estimateDraft.trim() === '' ? null : parseEstimate(estimateDraft)
    if (value === issue.estimate) return
    updateIssue(issue.id, { estimate: value })
    const supabase = createClient()
    await supabase.from('issues').update({ estimate: value }).eq('id', issue.id)
  }

  const statuses = Object.keys(statusConfig) as IssueStatus[]
  const priorities = Object.keys(priorityConfig) as Priority[]
  const types = Object.keys(typeConfig) as IssueType[]

  return (
    <div className="flex flex-col h-full">
      {/* ── Top bar ── */}
      <div className="flex items-center justify-between px-4 h-11 border-b border-border shrink-0">
        <div className="flex items-center gap-2 text-[12px] text-muted-foreground min-w-0">
          <TypeIcon type={issue.type} size={14} />
          <button
            type="button"
            onClick={copyKey}
            className="font-mono text-primary hover:underline cursor-pointer"
          >
            {issueKey}
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" onClick={copyKey}>
            <Link2 size={13} />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-rose-400" onClick={handleDelete}>
            <Trash2 size={13} />
          </Button>
          <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" onClick={onClose}>
            <X size={15} />
          </Button>
        </div>
      </div>

      {/* ── Body: main + sidebar ── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* ── Main content ── */}
        <div className="flex-1 flex flex-col overflow-y-auto min-w-0 px-5 py-4 gap-4">
          {/* Title */}
          {editingTitle ? (
            <textarea
              autoFocus
              value={titleDraft}
              onChange={(e) => setTitleDraft(e.target.value)}
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); e.currentTarget.blur() }
                if (e.key === 'Escape') { setTitleDraft(issue.title); setEditingTitle(false) }
              }}
              rows={2}
              className="w-full text-[17px] font-semibold leading-snug tracking-tight bg-muted border border-primary/30 rounded-lg px-2 py-1 outline-none resize-none text-foreground"
            />
          ) : (
            <div className="flex items-start gap-2 group/title">
              <h2 className="text-[17px] font-semibold leading-snug tracking-tight text-foreground flex-1">
                {issue.title}
              </h2>
              <button
                type="button"
                onClick={() => { setTitleDraft(issue.title); setEditingTitle(true) }}
                className="opacity-0 group-hover/title:opacity-100 transition-opacity text-muted-foreground hover:text-foreground shrink-0 mt-0.5"
              >
                <Pencil size={13} />
              </button>
            </div>
          )}

          {/* Description */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Açıklama</p>
            <IssueEditor mode="edit" issueId={issue.id} initialContent={issue.description ?? ''} />
          </div>

          {/* Labels */}
          <div>
            <p className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider mb-2">Etiketler</p>
            <div className="flex flex-wrap gap-1.5 items-center">
              {issue.labels.map((label) => (
                <span key={label} className="flex items-center gap-1 text-[11px] bg-muted border border-border rounded px-2 py-0.5">
                  {label}
                  <button
                    type="button"
                    onClick={() => removeLabel(label)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <X size={9} />
                  </button>
                </span>
              ))}
              {showLabelInput ? (
                <input
                  autoFocus
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') { addLabel(labelInput); setLabelInput(''); setShowLabelInput(false) }
                    if (e.key === 'Escape') { setLabelInput(''); setShowLabelInput(false) }
                  }}
                  onBlur={() => { setLabelInput(''); setShowLabelInput(false) }}
                  placeholder="Etiket ekle..."
                  className="text-[11px] bg-muted border border-primary/30 rounded px-2 py-0.5 outline-none w-28"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setShowLabelInput(true)}
                  className="text-[11px] text-muted-foreground hover:text-foreground border border-dashed border-border rounded px-2 py-0.5"
                >
                  + Ekle
                </button>
              )}
            </div>
          </div>

          <IssueDetailTabs issueId={issue.id} />
        </div>

        {/* ── Right sidebar ── */}
        <div className="w-[300px] shrink-0 border-l border-border px-5 py-2 overflow-y-auto flex flex-col gap-0">

          <PropRow label="Durum">
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
                    <span className={cn('flex-1', s === issue.status && 'font-medium')}>{statusConfig[s].label}</span>
                    {s === issue.status && <Check size={11} className="text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </PropRow>

          <PropRow label="Öncelik">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-transparent text-[11px] font-medium outline-none hover:bg-muted transition-colors cursor-pointer">
                <span className={cn('size-[6px] rounded-full shrink-0', PRIORITY_DOT[issue.priority])} />
                <span className={cn(PRIORITY_COLORS[issue.priority])}>{priorityConfig[issue.priority].label}</span>
                <ChevronDown size={10} className="text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                {priorities.map((p) => (
                  <DropdownMenuItem key={p} onClick={() => handlePriorityChange(p)} className="text-xs">
                    <span className={cn('size-[6px] rounded-full shrink-0', PRIORITY_DOT[p])} />
                    <span className={cn('flex-1', PRIORITY_COLORS[p])}>{priorityConfig[p].label}</span>
                    {p === issue.priority && <Check size={11} className="text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </PropRow>

          <PropRow label="Atanan">
            <MemberPicker members={members} value={issue.assignee_id} onChange={handleAssigneeChange} />
          </PropRow>

          <PropRow label="Oluşturan">
            {(() => {
              const reporter = members.find((m) => m.id === issue.reporter_id)
              if (!reporter) return <span className="text-[12px] text-muted-foreground">—</span>
              return (
                <div className="flex items-center gap-2">
                  <div className="size-5 rounded-full bg-primary/20 flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                    {(reporter.full_name ?? reporter.email ?? '?').slice(0, 2).toUpperCase()}
                  </div>
                  <span className="text-[12px] text-foreground">{reporter.full_name ?? reporter.email}</span>
                </div>
              )
            })()}
          </PropRow>

          <PropRow label="Tür">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 outline-none hover:opacity-75 transition-opacity cursor-pointer">
                <TypeIcon type={issue.type} size={12} />
                <span className="text-[12px] text-foreground">{typeConfig[issue.type].label}</span>
                <ChevronDown size={9} className="text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                {types.map((t) => (
                  <DropdownMenuItem key={t} onClick={() => handleTypeChange(t)} className="text-xs gap-2">
                    <TypeIcon type={t} size={12} />
                    <span className="flex-1">{typeConfig[t].label}</span>
                    {t === issue.type && <Check size={11} className="text-primary" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </PropRow>

          <PropRow label="Tahmin">
            {editingEstimate ? (
              <input
                autoFocus
                type="text"
                value={estimateDraft === '—' ? '' : estimateDraft}
                onChange={(e) => setEstimateDraft(e.target.value)}
                onBlur={handleEstimateSave}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur()
                  if (e.key === 'Escape') { setEstimateDraft(formatEstimate(issue.estimate)); setEditingEstimate(false) }
                }}
                placeholder="1h 2g 4s"
                className="w-28 text-[12px] bg-muted border border-primary/30 rounded px-1.5 py-0.5 outline-none"
              />
            ) : (
              <button
                type="button"
                onClick={() => { setEstimateDraft(formatEstimate(issue.estimate)); setEditingEstimate(true) }}
                className="text-[12px] text-foreground font-medium hover:text-primary transition-colors"
              >
                {formatEstimate(issue.estimate)}
              </button>
            )}
          </PropRow>

          <PropRow label="Oluşturulma">
            <span className="text-[11px] text-muted-foreground">
              {new Date(issue.created_at).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short', year: 'numeric' })}
            </span>
          </PropRow>

          <PropRow label="Güncelleme">
            <span className="text-[11px] text-muted-foreground">
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
          <motion.aside
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] as const }}
            className="fixed inset-0 z-50 bg-background overflow-hidden"
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

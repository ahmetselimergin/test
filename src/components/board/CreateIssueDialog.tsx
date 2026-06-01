'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { X, ChevronDown } from 'lucide-react'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TypeIcon } from '@/components/issues/TypeIcon'
import { IssueEditor } from '@/components/issues/IssueEditor'
import { MemberPicker } from '@/components/issues/MemberPicker'
import { createIssue } from '@/app/actions/board'
import { useIssueStore } from '@/lib/stores/issue.store'
import { cn, priorityConfig, typeConfig, parseEstimate, formatEstimate } from '@/lib/utils'
import type { BoardColumn, Project, IssueType, Priority, MemberSummary } from '@/lib/supabase/types'

const ISSUE_TYPES: IssueType[] = ['task', 'story', 'bug', 'feature']
const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low']

const PRIORITY_DOT: Record<Priority, string> = {
  critical: 'bg-rose-400',
  high: 'bg-orange-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
}

interface Props {
  project: Project
  column: BoardColumn
  workspaceSlug: string
  members: MemberSummary[]
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultEpicId?: string
}

function PropSelect({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest w-20 shrink-0">
        {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  )
}

export function CreateIssueDialog({
  project,
  column,
  workspaceSlug,
  members,
  open,
  onOpenChange,
  defaultEpicId,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<IssueType>('task')
  const [priority, setPriority] = useState<Priority>('medium')
  const [assigneeId, setAssigneeId] = useState<string | null>(null)
  const [labelInput, setLabelInput] = useState('')
  const [labels, setLabels] = useState<string[]>([])
  const [estimateInput, setEstimateInput] = useState('')
  const titleRef = useRef<HTMLTextAreaElement>(null)
  const router = useRouter()
  const addIssue = useIssueStore((s) => s.addIssue)

  useEffect(() => {
    if (open) {
      const t = setTimeout(() => titleRef.current?.focus(), 80)
      return () => clearTimeout(t)
    } else {
      setTitle('')
      setDescription('')
      setType('task')
      setPriority('medium')
      setAssigneeId(null)
      setLabelInput('')
      setLabels([])
      setEstimateInput('')
    }
  }, [open])

  function addLabel(val: string) {
    const t = val.trim()
    if (t && !labels.includes(t)) setLabels((p) => [...p, t])
    setLabelInput('')
  }

  function handleLabelKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault()
      addLabel(labelInput)
    } else if (e.key === 'Backspace' && !labelInput && labels.length > 0) {
      setLabels((p) => p.slice(0, -1))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)

    const formData = new FormData()
    formData.set('project_id', project.id)
    if (defaultEpicId) formData.set('epic_id', defaultEpicId)
    formData.set('board_column_id', column.id)
    formData.set('workspace_slug', workspaceSlug)
    formData.set('title', title.trim())
    formData.set('description', description.trim())
    formData.set('type', type)
    formData.set('priority', priority)
    formData.set('labels', JSON.stringify(labels))
    const estimateHours = parseEstimate(estimateInput)
    if (estimateHours !== null) formData.set('estimate', String(estimateHours))
    if (assigneeId) formData.set('assignee_id', assigneeId)

    const result = await createIssue(formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }
    if (result.issue) addIssue(result.issue)
    toast.success('Issue oluşturuldu')
    onOpenChange(false)
    router.refresh()
  }

  const selectCls = cn(
    'h-8 w-full rounded-lg border border-border bg-card px-2.5 text-[12px] text-foreground',
    'focus:outline-none focus:border-primary/50 transition-colors appearance-none cursor-pointer',
  )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[960px] p-0 gap-0 overflow-hidden">
        <motion.div
          initial={{ opacity: 0, scale: 0.97, y: 8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 8 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <form onSubmit={handleSubmit}>
            {/* Title row */}
            <div className="flex items-start gap-3 px-6 pt-5 pb-3 border-b border-border">
              <div className="mt-[3px] shrink-0">
                <TypeIcon type={type} size={18} />
              </div>
              <textarea
                ref={titleRef}
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value)
                  e.target.style.height = 'auto'
                  e.target.style.height = e.target.scrollHeight + 'px'
                }}
                placeholder="Issue başlığı..."
                rows={1}
                className="flex-1 resize-none bg-transparent text-[17px] font-semibold placeholder:text-muted-foreground/40 outline-none leading-snug overflow-hidden tracking-tight"
                style={{ height: 'auto' }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) e.preventDefault()
                }}
              />
            </div>

            {/* Body: 2 columns */}
            <div className="flex min-h-[320px]">
              {/* Left: description */}
              <div className="flex-1 px-6 py-4 border-r border-border overflow-y-auto">
                <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">Açıklama</p>
                <IssueEditor
                  mode="create"
                  value={description}
                  onChange={setDescription}
                />
              </div>

              {/* Right: properties */}
              <div className="w-[320px] shrink-0 px-6 py-4 flex flex-col justify-start">
                {/* Type */}
                <PropSelect label="Tür">
                  <div className="relative">
                    <select
                      value={type}
                      onChange={(e) => setType(e.target.value as IssueType)}
                      className={selectCls}
                    >
                      {ISSUE_TYPES.map((t) => (
                        <option key={t} value={t}>{typeConfig[t].label}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </PropSelect>

                {/* Priority */}
                <PropSelect label="Öncelik">
                  <div className="relative">
                    <select
                      value={priority}
                      onChange={(e) => setPriority(e.target.value as Priority)}
                      className={selectCls}
                    >
                      {PRIORITIES.map((p) => (
                        <option key={p} value={p}>{priorityConfig[p].label}</option>
                      ))}
                    </select>
                    <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                  </div>
                </PropSelect>

                {/* Assignee */}
                <PropSelect label="Atanan">
                  <MemberPicker members={members} value={assigneeId} onChange={setAssigneeId} />
                </PropSelect>

                {/* Labels */}
                <PropSelect label="Etiketler">
                  <div className="flex flex-wrap gap-1 min-h-[28px] items-center">
                    <AnimatePresence>
                      {labels.map((l) => (
                        <motion.span
                          key={l}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          exit={{ opacity: 0, scale: 0.8 }}
                          transition={{ duration: 0.12 }}
                          className="flex items-center gap-1 text-[11px] bg-muted border border-border rounded px-2 py-0.5 text-foreground"
                        >
                          {l}
                          <button
                            type="button"
                            onClick={() => setLabels((p) => p.filter((x) => x !== l))}
                            className="text-muted-foreground hover:text-foreground transition-colors"
                          >
                            <X size={9} />
                          </button>
                        </motion.span>
                      ))}
                    </AnimatePresence>
                    <input
                      value={labelInput}
                      onChange={(e) => setLabelInput(e.target.value)}
                      onKeyDown={handleLabelKey}
                      onBlur={() => labelInput && addLabel(labelInput)}
                      placeholder={labels.length === 0 ? 'Ekle...' : '+'}
                      className="text-[12px] bg-transparent outline-none text-foreground placeholder:text-muted-foreground/40 min-w-[56px] flex-1"
                    />
                  </div>
                </PropSelect>

                {/* Estimate */}
                <PropSelect label="Tahmin">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={estimateInput}
                      onChange={(e) => setEstimateInput(e.target.value)}
                      placeholder="örn: 1h 2g 4s"
                      className="h-8 w-full rounded-lg border border-border bg-card px-2.5 text-[12px] text-foreground placeholder:text-muted-foreground/50 outline-none focus:border-primary/50 transition-colors"
                    />
                  </div>
                  {estimateInput && (
                    <p className="text-[10px] text-muted-foreground mt-1">
                      = {formatEstimate(parseEstimate(estimateInput))}
                    </p>
                  )}
                </PropSelect>
              </div>
            </div>

            {/* Footer */}
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span>Kolon:</span>
                <span
                  className="font-semibold px-2 py-0.5 rounded text-[10px] uppercase tracking-wider"
                  style={{ backgroundColor: column.color + '22', color: column.color }}
                >
                  {column.name}
                </span>
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="ghost" size="sm" onClick={() => onOpenChange(false)} className="h-8 text-sm px-4">
                  İptal
                </Button>
                <Button
                  type="submit"
                  disabled={loading || !title.trim()}
                  size="sm"
                  className="h-8 text-sm px-4 disabled:opacity-40"
                >
                  {loading ? 'Oluşturuluyor...' : 'Issue Oluştur'}
                </Button>
              </div>
            </div>
          </form>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}

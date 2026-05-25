'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { X } from 'lucide-react'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { TypeIcon } from '@/components/issues/TypeIcon'
import { createIssue } from '@/app/actions/board'
import { useIssueStore } from '@/lib/stores/issue.store'
import { cn, priorityConfig, typeConfig } from '@/lib/utils'
import type { BoardColumn, Project, IssueType, Priority } from '@/lib/supabase/types'

const ISSUE_TYPES: IssueType[] = ['task', 'story', 'bug', 'feature']
const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low']

const priorityDotColor: Record<Priority, string> = {
  critical: 'bg-rose-400',
  high: 'bg-orange-400',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
}

interface Props {
  project: Project
  column: BoardColumn
  workspaceSlug: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateIssueDialog({
  project,
  column,
  workspaceSlug,
  open,
  onOpenChange,
}: Props) {
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState<IssueType>('task')
  const [priority, setPriority] = useState<Priority>('medium')
  const [labelInput, setLabelInput] = useState('')
  const [labels, setLabels] = useState<string[]>([])
  const [estimate, setEstimate] = useState('')
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
      setLabelInput('')
      setLabels([])
      setEstimate('')
    }
  }, [open])

  function addLabel(val: string) {
    const trimmed = val.trim()
    if (trimmed && !labels.includes(trimmed)) setLabels((p) => [...p, trimmed])
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
    formData.set('board_column_id', column.id)
    formData.set('workspace_slug', workspaceSlug)
    formData.set('title', title.trim())
    formData.set('description', description.trim())
    formData.set('type', type)
    formData.set('priority', priority)
    formData.set('labels', JSON.stringify(labels))
    if (estimate) formData.set('estimate', estimate)

    const result = await createIssue(formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }
    if (result.issue) addIssue(result.issue)
    toast.success('Issue created')
    onOpenChange(false)
    router.refresh()
  }

  const pill = (active: boolean) =>
    cn(
      'flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[12px] font-medium border transition-all cursor-pointer select-none',
      active
        ? 'border-accent/40 bg-accent/10 text-accent'
        : 'border-subtle bg-transparent text-muted hover:border-strong hover:text-foreground'
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-0 gap-0 overflow-hidden">
        <form onSubmit={handleSubmit}>
          {/* Title row */}
          <div className="flex items-start gap-3 px-5 pt-5 pb-2">
            <div className="mt-[3px] shrink-0">
              <TypeIcon type={type} size={17} />
            </div>
            <textarea
              ref={titleRef}
              value={title}
              onChange={(e) => {
                setTitle(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              placeholder="Issue title..."
              rows={1}
              className="flex-1 resize-none bg-transparent text-[15px] font-semibold placeholder:text-muted/40 outline-none leading-snug overflow-hidden tracking-tight"
              style={{ height: 'auto' }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) e.preventDefault()
              }}
            />
          </div>

          {/* Description */}
          <div className="px-5 pb-4 pl-[52px]">
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add a description..."
              rows={3}
              className="w-full resize-none bg-transparent text-sm text-muted placeholder:text-muted/35 outline-none leading-relaxed"
            />
          </div>

          <div className="h-px bg-border mx-5" />

          {/* Properties */}
          <div className="px-5 py-4 space-y-3">
            {/* Type */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted w-[72px] shrink-0 font-medium uppercase tracking-wider">
                Type
              </span>
              <motion.div
                className="flex flex-wrap gap-1.5"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.04 } },
                }}
              >
                {ISSUE_TYPES.map((t) => (
                  <motion.button
                    key={t}
                    type="button"
                    onClick={() => setType(t)}
                    whileTap={{ scale: 0.93 }}
                    variants={{
                      hidden: { opacity: 0, y: 4 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className={pill(type === t)}
                  >
                    <TypeIcon type={t} size={12} />
                    {typeConfig[t].label}
                  </motion.button>
                ))}
              </motion.div>
            </div>

            {/* Priority */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted w-[72px] shrink-0 font-medium uppercase tracking-wider">
                Priority
              </span>
              <motion.div
                className="flex flex-wrap gap-1.5"
                initial="hidden"
                animate="show"
                variants={{
                  hidden: {},
                  show: { transition: { staggerChildren: 0.04, delayChildren: 0.08 } },
                }}
              >
                {PRIORITIES.map((p) => (
                  <motion.button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    whileTap={{ scale: 0.93 }}
                    variants={{
                      hidden: { opacity: 0, y: 4 },
                      show: { opacity: 1, y: 0 },
                    }}
                    className={pill(priority === p)}
                  >
                    <span className={cn('size-[7px] rounded-full shrink-0', priorityDotColor[p])} />
                    {priorityConfig[p].label}
                  </motion.button>
                ))}
              </motion.div>
            </div>

            {/* Labels */}
            <div className="flex items-start gap-3">
              <span className="text-[11px] text-muted w-[72px] shrink-0 font-medium uppercase tracking-wider pt-1">
                Labels
              </span>
              <div className="flex flex-wrap gap-1.5 flex-1 min-w-0">
                <AnimatePresence>
                  {labels.map((l) => (
                    <motion.span
                      key={l}
                      initial={{ opacity: 0, scale: 0.85 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.85 }}
                      transition={{ duration: 0.12 }}
                      className="flex items-center gap-1 text-[11px] bg-subtle border border-subtle rounded px-2 py-0.5 text-foreground"
                    >
                      {l}
                      <button
                        type="button"
                        onClick={() => setLabels((p) => p.filter((x) => x !== l))}
                        className="text-muted hover:text-foreground transition-colors"
                      >
                        <X size={10} />
                      </button>
                    </motion.span>
                  ))}
                </AnimatePresence>
                <input
                  value={labelInput}
                  onChange={(e) => setLabelInput(e.target.value)}
                  onKeyDown={handleLabelKey}
                  onBlur={() => labelInput && addLabel(labelInput)}
                  placeholder={labels.length === 0 ? 'Add labels...' : '+'}
                  className="text-[12px] bg-transparent outline-none text-foreground placeholder:text-muted/40 min-w-[72px] flex-1 py-0.5"
                />
              </div>
            </div>

            {/* Estimate */}
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-muted w-[72px] shrink-0 font-medium uppercase tracking-wider">
                Estimate
              </span>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  value={estimate}
                  onChange={(e) => setEstimate(e.target.value)}
                  placeholder="—"
                  className="w-14 h-7 text-[12px] bg-subtle border border-subtle rounded-md px-2 outline-none focus:border-accent/50 transition-colors text-center tabular-nums"
                />
                <span className="text-[11px] text-muted">story points</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-border mx-5" />

          {/* Footer */}
          <div className="flex items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2 text-[11px] text-muted">
              <span>In</span>
              <span
                className="font-medium px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider"
                style={{ backgroundColor: column.color + '22', color: column.color }}
              >
                {column.name}
              </span>
            </div>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-7 text-xs px-3"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading || !title.trim()}
                size="sm"
                className="h-7 text-xs px-3 bg-accent text-white hover:opacity-90 disabled:opacity-40 transition-opacity"
              >
                {loading ? 'Creating...' : 'Create issue'}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

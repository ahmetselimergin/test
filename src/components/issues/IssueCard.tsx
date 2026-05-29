'use client'

import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Issue, Project } from '@/lib/supabase/types'
import { TypeIcon } from './TypeIcon'
import { formatIssueId, cn } from '@/lib/utils'
import { useIssueStore } from '@/lib/stores/issue.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { IssueCardQuickActions } from './IssueCardQuickActions'

interface IssueCardProps {
  issue: Issue
  project: Project
  overlay?: boolean
}

const LABEL_PALETTES = [
  { bg: 'bg-rose-500/15',    text: 'text-rose-300',    border: 'border-rose-500/20' },
  { bg: 'bg-blue-500/15',    text: 'text-blue-300',    border: 'border-blue-500/20' },
  { bg: 'bg-violet-500/15',  text: 'text-violet-300',  border: 'border-violet-500/20' },
  { bg: 'bg-amber-500/15',   text: 'text-amber-300',   border: 'border-amber-500/20' },
  { bg: 'bg-emerald-500/15', text: 'text-emerald-300', border: 'border-emerald-500/20' },
  { bg: 'bg-cyan-500/15',    text: 'text-cyan-300',    border: 'border-cyan-500/20' },
  { bg: 'bg-orange-500/15',  text: 'text-orange-300',  border: 'border-orange-500/20' },
  { bg: 'bg-pink-500/15',    text: 'text-pink-300',    border: 'border-pink-500/20' },
]

function labelPalette(label: string) {
  const hash = label.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return LABEL_PALETTES[hash % LABEL_PALETTES.length]
}

function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function IssueCard({ issue, project, overlay }: IssueCardProps) {
  const { setSelectedIssue } = useIssueStore()
  const members = useProjectStore((s) => s.members)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id, disabled: !!overlay })

  const plainDescription = issue.description ? stripHtml(issue.description) : ''

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : { transform: CSS.Transform.toString(transform), transition }}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      className="touch-none"
    >
      <motion.article
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: isDragging ? 0 : 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.15 }}
        onDoubleClick={() => !overlay && setSelectedIssue(issue)}
        className={cn(
          'group flex flex-col gap-0 rounded-xl border select-none',
          'bg-card border-border',
          'shadow-sm',
          'hover:shadow-md hover:border-foreground/20 transition-all duration-200',
          overlay
            ? 'rotate-[1.5deg] cursor-grabbing opacity-95'
            : 'cursor-grab active:cursor-grabbing',
        )}
      >
        {/* Body */}
        <div className="px-4 pt-4 pb-3 flex flex-col gap-2.5">
          {/* Labels */}
          {issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {issue.labels.slice(0, 3).map((label) => {
                const p = labelPalette(label)
                return (
                  <span
                    key={label}
                    className={cn(
                      'inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold border',
                      p.bg, p.text, p.border
                    )}
                  >
                    {label}
                  </span>
                )
              })}
            </div>
          )}

          {/* Title */}
          <p className="text-[13.5px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 tracking-[-0.01em]">
            {issue.title}
          </p>

          {/* Description */}
          {plainDescription && (
            <p className="text-[12px] leading-relaxed text-muted-foreground line-clamp-2 opacity-80">
              {plainDescription}
            </p>
          )}
        </div>

        {/* Divider */}
        <div className="h-px bg-border mx-4" />

        {/* Footer */}
        <div className="px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Left: type icon + key */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex items-center gap-1.5">
              <TypeIcon type={issue.type} size={12} className="text-muted-foreground shrink-0" />
              <span className="text-[11px] text-muted-foreground font-mono tracking-tight">
                {formatIssueId(project.key, issue.issue_number)}
              </span>
            </div>
          </div>

          {/* Right: estimate + quick actions */}
          <div className="flex items-center gap-2 shrink-0">
            {issue.estimate !== null && (
              <span className="text-[10.5px] text-muted-foreground bg-muted border border-border rounded-md px-1.5 py-0.5 font-medium tabular-nums">
                {issue.estimate}pt
              </span>
            )}
            <IssueCardQuickActions issue={issue} members={members} />
          </div>
        </div>
      </motion.article>
    </div>
  )
}

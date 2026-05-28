'use client'

import { motion } from 'framer-motion'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { Issue, Project } from '@/lib/supabase/types'
import { TypeIcon } from './TypeIcon'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatIssueId, cn, priorityConfig } from '@/lib/utils'
import { useIssueStore } from '@/lib/stores/issue.store'
import { useProjectStore } from '@/lib/stores/project.store'

interface IssueCardProps {
  issue: Issue
  project: Project
  overlay?: boolean
}

const PRIORITY_DOT: Record<string, string> = {
  critical: 'bg-rose-400',
  high:     'bg-orange-400',
  medium:   'bg-amber-400',
  low:      'bg-slate-400',
}

const LABEL_PALETTES = [
  { bg: 'bg-blue-500/20',   text: 'text-blue-300',   border: 'border-blue-500/30' },
  { bg: 'bg-purple-500/20', text: 'text-purple-300',  border: 'border-purple-500/30' },
  { bg: 'bg-emerald-500/20',text: 'text-emerald-300', border: 'border-emerald-500/30' },
  { bg: 'bg-orange-500/20', text: 'text-orange-300',  border: 'border-orange-500/30' },
  { bg: 'bg-pink-500/20',   text: 'text-pink-300',    border: 'border-pink-500/30' },
  { bg: 'bg-cyan-500/20',   text: 'text-cyan-300',    border: 'border-cyan-500/30' },
  { bg: 'bg-yellow-500/20', text: 'text-yellow-300',  border: 'border-yellow-500/30' },
]

function labelPalette(label: string) {
  const hash = label.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0)
  return LABEL_PALETTES[hash % LABEL_PALETTES.length]
}

export function IssueCard({ issue, project, overlay }: IssueCardProps) {
  const { setSelectedIssue } = useIssueStore()
  const members = useProjectStore((s) => s.members)
  const assignee = members.find((m) => m.id === issue.assignee_id)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: issue.id, disabled: !!overlay })

  return (
    <div
      ref={overlay ? undefined : setNodeRef}
      style={overlay ? undefined : { transform: CSS.Transform.toString(transform), transition }}
      {...(overlay ? {} : { ...attributes, ...listeners })}
      className="touch-none"
    >
      <motion.article
        initial={{ opacity: 0, y: 4 }}
        animate={{ opacity: isDragging ? 0 : 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ duration: 0.12 }}
        onDoubleClick={() => !overlay && setSelectedIssue(issue)}
        className={cn(
          'group bg-card border border-subtle rounded-md select-none',
          'hover:border-strong hover:shadow-sm transition-all duration-150',
          overlay
            ? 'rotate-[1deg] shadow-lg ring-1 ring-accent/30 cursor-grabbing opacity-95'
            : 'cursor-grab active:cursor-grabbing',
        )}
      >
        <div className="px-3 pt-3 pb-2.5">
          {/* Labels */}
          {issue.labels.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-2">
              {issue.labels.slice(0, 3).map((label) => {
                const p = labelPalette(label)
                return (
                  <span
                    key={label}
                    className={cn(
                      'text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded border',
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
          <p className="text-[13px] font-medium leading-snug text-foreground group-hover:text-accent transition-colors line-clamp-3">
            {issue.title}
          </p>
        </div>

        {/* Footer */}
        <div className="px-3 pb-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 min-w-0">
            <TypeIcon type={issue.type} size={12} className="shrink-0 text-muted" />
            <span className="text-[11px] text-muted font-mono tracking-tight truncate">
              {formatIssueId(project.key, issue.issue_number)}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span
              title={priorityConfig[issue.priority].label}
              className={cn('size-[7px] rounded-full shrink-0', PRIORITY_DOT[issue.priority])}
            />
            {assignee ? (
              <Avatar className="size-5 border border-subtle shrink-0">
                {assignee.avatar_url ? (
                  <img src={assignee.avatar_url} alt={assignee.full_name ?? ''} className="size-full object-cover rounded-full" />
                ) : (
                  <AvatarFallback className="text-[9px] bg-accent/20 text-accent font-semibold">
                    {(assignee.full_name ?? assignee.email ?? '?').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
            ) : (
              <span className="size-5 rounded-full border border-dashed border-subtle shrink-0" />
            )}
          </div>
        </div>
      </motion.article>
    </div>
  )
}

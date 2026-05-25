'use client'

import { motion } from 'framer-motion'
import type { Issue, Project } from '@/lib/supabase/types'
import { TypeIcon } from './TypeIcon'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatIssueId, cn, priorityConfig, typeConfig } from '@/lib/utils'
import { useIssueStore } from '@/lib/stores/issue.store'

interface IssueCardProps {
  issue: Issue
  project: Project
  isDragging?: boolean
}

export function IssueCard({ issue, project, isDragging }: IssueCardProps) {
  const { setSelectedIssue } = useIssueStore()
  const priority = priorityConfig[issue.priority]
  const type = typeConfig[issue.type]

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.12 }}
      onClick={() => setSelectedIssue(issue)}
      className={cn(
        'group relative bg-card border border-subtle rounded-lg cursor-pointer',
        'hover:border-strong transition-all select-none',
        `issue-priority-${issue.priority}`,
        isDragging && 'opacity-70 rotate-1 shadow-panel ring-1 ring-accent/20'
      )}
    >
      {/* Title area */}
      <div className="px-3 pt-3 pb-2">
        <p className="text-[13px] font-medium leading-snug line-clamp-2 text-foreground group-hover:text-accent transition-colors">
          {issue.title}
        </p>
        {issue.description && (
          <p className="text-[11.5px] text-muted leading-snug line-clamp-1 mt-0.5 opacity-75">
            {issue.description}
          </p>
        )}
      </div>

      {/* Jira-style metadata rows */}
      <div className="px-3 pb-2.5 space-y-[3px]">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted">Priority</span>
          <span className={cn('flex items-center gap-1.5 font-medium tabular-nums', priority.color)}>
            <span className={cn('size-[6px] rounded-full shrink-0', priority.dot)} />
            {priority.label}
          </span>
        </div>
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-muted">Type</span>
          <span className={cn('flex items-center gap-1.5 font-medium', type.color)}>
            <TypeIcon type={issue.type} size={11} />
            {type.label}
          </span>
        </div>
        {issue.estimate !== null && (
          <div className="flex items-center justify-between text-[11px]">
            <span className="text-muted">Estimate</span>
            <span className="text-foreground font-medium tabular-nums">{issue.estimate} pts</span>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 pb-2.5 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="text-[10px] text-muted font-mono tracking-tight shrink-0">
            {formatIssueId(project.key, issue.issue_number)}
          </span>
          {issue.labels.slice(0, 2).map((label) => (
            <span
              key={label}
              className="text-[10px] bg-subtle border border-subtle rounded px-1.5 py-0 text-muted truncate max-w-[60px]"
            >
              {label}
            </span>
          ))}
        </div>
        {issue.assignee_id ? (
          <Avatar className="size-4 border border-subtle shrink-0">
            <AvatarFallback className="text-[9px] bg-accent-muted text-accent font-medium">
              {issue.assignee_id.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        ) : (
          <span className="size-4 shrink-0" />
        )}
      </div>
    </motion.article>
  )
}

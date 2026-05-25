'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Paperclip } from 'lucide-react'
import type { Issue, Project } from '@/lib/supabase/types'
import { TypeIcon } from './TypeIcon'
import { PriorityBadge } from './PriorityBadge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatIssueId, cn, priorityConfig } from '@/lib/utils'
import { useIssueStore } from '@/lib/stores/issue.store'

interface IssueCardProps {
  issue: Issue
  project: Project
  isDragging?: boolean
}

export function IssueCard({ issue, project, isDragging }: IssueCardProps) {
  const { setSelectedIssue } = useIssueStore()
  const priorityClass = `issue-priority-${issue.priority}`

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.12 }}
      onClick={() => setSelectedIssue(issue)}
      className={cn(
        'group relative bg-card border border-subtle rounded-lg pl-[10px] pr-2.5 py-2 cursor-pointer',
        'hover:border-strong hover:bg-card/80 transition-all',
        priorityClass,
        isDragging && 'opacity-70 rotate-1 shadow-panel ring-1 ring-accent/20'
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[11px] text-muted font-mono tracking-tight">
          {formatIssueId(project.key, issue.issue_number)}
        </span>
        <PriorityBadge priority={issue.priority} />
      </div>

      <p className="text-[12.5px] font-medium leading-snug mb-2 line-clamp-2 text-foreground group-hover:text-accent transition-colors">
        {issue.title}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <TypeIcon type={issue.type} size={12} />
          {issue.labels.slice(0, 2).map((label) => (
            <span
              key={label}
              className="text-[10px] bg-subtle border border-subtle rounded px-1.5 py-0.5 text-muted truncate max-w-[64px]"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {issue.description && (
            <Paperclip size={11} className="text-muted opacity-60" />
          )}
          <MessageSquare size={11} className="text-muted opacity-40" />
          {issue.assignee_id ? (
            <Avatar className="size-4 border border-subtle">
              <AvatarFallback className="text-[9px] bg-accent-muted text-accent font-medium">
                {issue.assignee_id.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span
              className={cn(
                'size-1.5 rounded-full group-hover:opacity-100 opacity-70 transition-opacity',
                priorityConfig[issue.priority].dot
              )}
              title={priorityConfig[issue.priority].label}
            />
          )}
        </div>
      </div>
    </motion.article>
  )
}

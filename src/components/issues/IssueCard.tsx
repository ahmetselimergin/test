'use client'
import { motion } from 'framer-motion'
import type { Issue, Project } from '@/lib/supabase/types'
import { TypeIcon } from './TypeIcon'
import { PriorityBadge } from './PriorityBadge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatIssueId, cn } from '@/lib/utils'
import { useIssueStore } from '@/lib/stores/issue.store'

interface IssueCardProps {
  issue: Issue
  project: Project
  isDragging?: boolean
}

export function IssueCard({ issue, project, isDragging }: IssueCardProps) {
  const { setSelectedIssue } = useIssueStore()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onClick={() => setSelectedIssue(issue)}
      className={cn(
        'bg-card border border-subtle rounded-xl p-3 cursor-pointer',
        'hover:border-indigo-500/30 glow-accent-hover transition-all',
        isDragging && 'opacity-50 rotate-2 scale-105 shadow-2xl shadow-indigo-500/20'
      )}
    >
      <div className="flex items-start justify-between gap-2 mb-2">
        <span className="text-xs text-muted font-mono">
          {formatIssueId(project.key, issue.issue_number)}
        </span>
        <PriorityBadge priority={issue.priority} />
      </div>

      <p className="text-sm font-medium leading-snug mb-3 line-clamp-2">{issue.title}</p>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <TypeIcon type={issue.type} size={12} />
          {issue.labels.slice(0, 2).map((label) => (
            <span
              key={label}
              className="text-xs bg-white/5 border border-white/10 rounded px-1.5 py-0.5 text-muted"
            >
              {label}
            </span>
          ))}
        </div>
        {issue.assignee_id && (
          <Avatar className="w-5 h-5">
            <AvatarFallback className="text-xs bg-indigo-500/20 text-indigo-400">
              {issue.assignee_id.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        )}
      </div>
    </motion.div>
  )
}

'use client'

import { useIssueStore } from '@/lib/stores/issue.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { IssueCardContextMenu } from './IssueCardContextMenu'
import { TypeIcon } from './TypeIcon'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatIssueId, formatEstimate, cn, priorityConfig } from '@/lib/utils'
import type { Issue, Project, Priority } from '@/lib/supabase/types'

const PRIORITY_DOT: Record<Priority, string> = {
  critical: 'bg-rose-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
}

interface IssueRowProps {
  issue: Issue
  project: Project
}

export function IssueRow({ issue, project }: IssueRowProps) {
  const { setSelectedIssue } = useIssueStore()
  const members = useProjectStore((s) => s.members)
  const assignee = members.find((m) => m.id === issue.assignee_id)

  return (
    <IssueCardContextMenu issue={issue}>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
        onClick={() => setSelectedIssue(issue)}
      >
        <TypeIcon type={issue.type} size={13} className="shrink-0 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground font-mono tracking-tight shrink-0 w-14">
          {formatIssueId(project.key, issue.issue_number)}
        </span>
        <span className="flex-1 text-[13px] text-foreground truncate">{issue.title}</span>

        <div className="flex items-center gap-2 shrink-0">
          {issue.labels.slice(0, 2).map((label) => (
            <span
              key={label}
              className="text-[10px] px-1.5 py-0.5 bg-muted border border-border rounded text-muted-foreground"
            >
              {label}
            </span>
          ))}
          <span
            className={cn('size-2 rounded-full shrink-0', PRIORITY_DOT[issue.priority])}
            title={priorityConfig[issue.priority].label}
          />
          {assignee ? (
            <Avatar className="size-5">
              {assignee.avatar_url ? (
                <img
                  src={assignee.avatar_url}
                  alt={assignee.full_name ?? ''}
                  className="size-full object-cover rounded-full"
                />
              ) : (
                <AvatarFallback className="text-[8px] bg-primary/20 text-primary font-bold">
                  {(assignee.full_name ?? assignee.email ?? '?').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          ) : (
            <span className="size-5 rounded-full border border-dashed border-border shrink-0" />
          )}
          {issue.estimate !== null && (
            <span className="text-[10px] text-muted-foreground bg-muted border border-border rounded px-1.5 py-0.5 tabular-nums">
              {formatEstimate(issue.estimate)}
            </span>
          )}
        </div>
      </div>
    </IssueCardContextMenu>
  )
}

import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'
import type { Priority, IssueStatus, IssueType } from './supabase/types'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const priorityConfig: Record<Priority, { label: string; color: string; dot: string }> = {
  critical: { label: 'Critical', color: 'text-rose-400', dot: 'bg-rose-400' },
  high:     { label: 'High',     color: 'text-orange-400', dot: 'bg-orange-400' },
  medium:   { label: 'Medium',   color: 'text-amber-400',  dot: 'bg-amber-400' },
  low:      { label: 'Low',      color: 'text-slate-400',  dot: 'bg-slate-400' },
}

export const statusConfig: Record<IssueStatus, { label: string; color: string; bg: string }> = {
  todo:        { label: 'Todo',        color: 'text-slate-400',   bg: 'bg-slate-400/10' },
  in_progress: { label: 'In Progress', color: 'text-indigo-400',  bg: 'bg-indigo-400/10' },
  review:      { label: 'Review',      color: 'text-amber-400',   bg: 'bg-amber-400/10' },
  done:        { label: 'Done',        color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
}

export const typeConfig: Record<IssueType, { label: string; color: string; icon: string }> = {
  epic:       { label: 'Epic',     color: 'text-violet-400',  icon: 'zap' },
  feature:    { label: 'Feature',  color: 'text-blue-400',    icon: 'star' },
  story:      { label: 'Story',    color: 'text-emerald-400', icon: 'book-open' },
  task:       { label: 'Task',     color: 'text-indigo-400',  icon: 'check-square' },
  bug:        { label: 'Bug',      color: 'text-rose-400',    icon: 'bug' },
  'sub-task': { label: 'Sub-task', color: 'text-slate-400',   icon: 'corner-down-right' },
}

export function formatIssueId(projectKey: string, issueNumber: number) {
  return `${projectKey}-${issueNumber}`
}

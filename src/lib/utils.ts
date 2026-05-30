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

// 1w = 5d = 40h, 1d = 8h. Input: "1w 3d 2h" → stored hours
export function parseEstimate(input: string): number | null {
  const s = input.trim().toLowerCase()
  if (!s) return null
  let hours = 0
  const w = s.match(/(\d+(?:\.\d+)?)w/)
  const d = s.match(/(\d+(?:\.\d+)?)d/)
  const h = s.match(/(\d+(?:\.\d+)?)h/)
  if (w) hours += parseFloat(w[1]) * 40
  if (d) hours += parseFloat(d[1]) * 8
  if (h) hours += parseFloat(h[1])
  if (!w && !d && !h) {
    const n = parseFloat(s)
    if (!isNaN(n)) hours = n
  }
  return hours > 0 ? Math.round(hours) : null
}

export function formatEstimate(hours: number | null | undefined): string {
  if (!hours) return '—'
  let r = hours
  const w = Math.floor(r / 40); r -= w * 40
  const d = Math.floor(r / 8);  r -= d * 8
  const h = Math.round(r)
  return [w && `${w}h`, d && `${d}g`, h && `${h}s`].filter(Boolean).join(' ') || '—'
}

export function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return 'az önce'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} dakika önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} saat önce`
  const days = Math.floor(hours / 24)
  return `${days} gün önce`
}

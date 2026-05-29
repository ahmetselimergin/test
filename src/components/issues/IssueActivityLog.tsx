'use client'

import { useEffect } from 'react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useIssueStore } from '@/lib/stores/issue.store'
import { createClient } from '@/lib/supabase/client'
import type { ActivityLog } from '@/lib/supabase/types'

interface ActivityLogWithActor extends ActivityLog {
  actor: { full_name: string | null; avatar_url: string | null } | null
}

function relativeTime(isoDate: string): string {
  const diffMs = Date.now() - new Date(isoDate).getTime()
  const diffSec = Math.floor(diffMs / 1000)
  if (diffSec < 60) return 'az önce'
  const diffMin = Math.floor(diffSec / 60)
  if (diffMin < 60) return `${diffMin} dakika önce`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr} saat önce`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay} gün önce`
}

function describeAction(log: ActivityLogWithActor): string {
  const who = log.actor?.full_name ?? 'Biri'
  switch (log.action) {
    case 'issue_created':    return `${who} issue'yu oluşturdu`
    case 'status_changed':   return `${who} durumu değiştirdi: ${log.old_value} → ${log.new_value}`
    case 'priority_changed': return `${who} önceliği değiştirdi: ${log.old_value} → ${log.new_value}`
    case 'assignee_changed': return `${who} atananı değiştirdi`
    case 'title_changed':    return `${who} başlığı değiştirdi`
    default:                 return `${who} bir değişiklik yaptı`
  }
}

interface IssueActivityLogProps {
  issueId: string
}

export function IssueActivityLog({ issueId }: IssueActivityLogProps) {
  const activityLogs = useIssueStore((s) => s.activityLogs)

  useEffect(() => {
    let cancelled = false
    const supabase = createClient()
    supabase
      .from('activity_logs')
      .select('*, actor:profiles(full_name, avatar_url)')
      .eq('issue_id', issueId)
      .order('created_at', { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return
        if (error) { console.error('Failed to load activity logs:', error); return }
        if (data) useIssueStore.getState().setActivityLogs(data as ActivityLogWithActor[])
      })
    return () => { cancelled = true }
  }, [issueId])

  if (activityLogs.length === 0) {
    return (
      <p className="text-[12px] text-muted-foreground px-4 py-6 text-center">
        Henüz aktivite yok.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-1 py-3 px-4">
      {(activityLogs as ActivityLogWithActor[]).map((log) => (
        <div key={log.id} className="flex items-start gap-2.5 py-2">
          <Avatar className="size-6 shrink-0 mt-0.5">
            {log.actor?.avatar_url ? (
              <img
                src={log.actor.avatar_url}
                alt={log.actor.full_name ?? ''}
                className="size-full object-cover rounded-full"
              />
            ) : (
              <AvatarFallback className="text-[9px] bg-primary/20 text-primary font-bold">
                {(log.actor?.full_name ?? '?').slice(0, 2).toUpperCase()}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
            <span className="text-[12px] text-foreground leading-snug">
              {describeAction(log)}
            </span>
            <span className="text-[11px] text-muted-foreground shrink-0 whitespace-nowrap">
              {relativeTime(log.created_at)}
            </span>
          </div>
        </div>
      ))}
    </div>
  )
}

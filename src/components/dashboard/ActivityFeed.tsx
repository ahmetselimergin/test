import { timeAgo } from '@/lib/utils'

export interface ActivityItem {
  id: string
  action: string
  old_value: string | null
  new_value: string | null
  created_at: string
  issue: { title: string; project_id: string } | null
  actor: { full_name: string | null; avatar_url: string | null } | null
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

function dotColor(action: string, newValue: string | null): string {
  if (action === 'status_changed') {
    if (newValue === 'done') return 'bg-emerald-500 border-emerald-800'
    if (newValue === 'in_progress') return 'bg-indigo-500 border-indigo-800'
    if (newValue === 'review') return 'bg-amber-500 border-amber-800'
    return 'bg-slate-500 border-slate-700'
  }
  if (action === 'priority_changed' && newValue === 'critical') return 'bg-rose-500 border-rose-800'
  if (action === 'issue_created') return 'bg-emerald-500 border-emerald-800'
  return 'bg-slate-500 border-slate-700'
}

function itemLabel(item: ActivityItem): string {
  const title = item.issue?.title ?? 'Issue'
  if (item.action === 'status_changed') {
    return `"${title}" ${STATUS_LABELS[item.new_value ?? ''] ?? item.new_value}'a taşındı`
  }
  if (item.action === 'priority_changed') {
    return `"${title}" ${PRIORITY_LABELS[item.new_value ?? ''] ?? item.new_value} önceliğe alındı`
  }
  if (item.action === 'issue_created') {
    return `"${title}" oluşturuldu`
  }
  return `"${title}" güncellendi`
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted py-4">
        Henüz aktivite yok. Issue&apos;ları taşıyınca burada görünür.
      </p>
    )
  }

  return (
    <div className="flex flex-col">
      {items.map((item, i) => (
        <div key={item.id} className="flex gap-2.5">
          <div className="flex flex-col items-center pt-0.5 shrink-0">
            <span className={`size-2 rounded-full border-2 shrink-0 ${dotColor(item.action, item.new_value)}`} />
            {i < items.length - 1 && (
              <span className="w-px flex-1 bg-[rgb(var(--border))] mt-1" />
            )}
          </div>
          <div className="pb-3.5 min-w-0">
            <p className="text-[12.5px] text-foreground/80 font-medium leading-snug">
              {itemLabel(item)}
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              {timeAgo(item.created_at)}
              {item.actor?.full_name ? ` · ${item.actor.full_name}` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}

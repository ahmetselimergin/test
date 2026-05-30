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
  done: 'Tamamlandı',
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Kritik',
  high: 'Yüksek',
  medium: 'Orta',
  low: 'Düşük',
}

const ACTION_CONFIG: Record<string, { color: string; bg: string }> = {
  issue_created:    { color: '#34d399', bg: '#34d39920' },
  status_changed:   { color: '#818cf8', bg: '#818cf820' },
  priority_changed: { color: '#fb7185', bg: '#fb718520' },
  assignee_changed: { color: '#60a5fa', bg: '#60a5fa20' },
  title_changed:    { color: '#f59e0b', bg: '#f59e0b20' },
}

function getConfig(action: string, newValue: string | null) {
  if (action === 'status_changed' && newValue === 'done') return { color: '#34d399', bg: '#34d39920' }
  return ACTION_CONFIG[action] ?? { color: '#78788c', bg: '#78788c20' }
}

function actorInitials(actor: ActivityItem['actor']): string {
  const name = actor?.full_name
  if (!name) return '?'
  return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
}

function itemLabel(item: ActivityItem): string {
  const title = item.issue?.title ?? 'Issue'
  const actor = item.actor?.full_name ?? 'Birisi'
  switch (item.action) {
    case 'status_changed':
      return `"${title}" → ${STATUS_LABELS[item.new_value ?? ''] ?? item.new_value}`
    case 'priority_changed':
      return `"${title}" ${PRIORITY_LABELS[item.new_value ?? ''] ?? item.new_value} önceliğe alındı`
    case 'issue_created':
      return `"${title}" oluşturuldu`
    case 'assignee_changed':
      return `"${title}" atandı`
    case 'title_changed':
      return `Başlık güncellendi: "${title}"`
    default:
      return `"${title}" güncellendi`
  }
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="size-10 rounded-xl bg-muted flex items-center justify-center mb-3">
          <span className="text-[20px]">📭</span>
        </div>
        <p className="text-[13px] text-muted-foreground font-medium">Henüz aktivite yok</p>
        <p className="text-[11px] text-muted-foreground/60 mt-1">Issue'ları taşıyınca burada görünür</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-0">
      {items.map((item, i) => {
        const cfg = getConfig(item.action, item.new_value)
        return (
          <div key={item.id} className="flex gap-3 group">
            {/* Timeline line */}
            <div className="flex flex-col items-center pt-1 shrink-0">
              <div
                className="size-2 rounded-full shrink-0 ring-4 ring-background"
                style={{ backgroundColor: cfg.color }}
              />
              {i < items.length - 1 && (
                <div className="w-px flex-1 bg-border mt-1.5" />
              )}
            </div>

            {/* Content */}
            <div className="pb-4 flex-1 min-w-0">
              <div className="flex items-start gap-2">
                {/* Actor avatar */}
                <div
                  className="size-5 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold mt-0.5"
                  style={{ backgroundColor: cfg.bg, color: cfg.color }}
                >
                  {actorInitials(item.actor)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-foreground leading-snug truncate">
                    {itemLabel(item)}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className="text-[10px] text-muted-foreground">
                      {timeAgo(item.created_at)}
                    </span>
                    {item.actor?.full_name && (
                      <>
                        <span className="text-[10px] text-muted-foreground/40">·</span>
                        <span className="text-[10px] text-muted-foreground">{item.actor.full_name}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}

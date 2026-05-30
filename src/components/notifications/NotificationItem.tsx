import { timeAgo } from '@/lib/utils'
import type { AppNotification } from '@/lib/stores/notification.store'

function notificationText(n: AppNotification): string {
  const actor = n.actor?.full_name ?? 'Birisi'
  const title = n.data.issue_title ? `"${n.data.issue_title}"` : 'bir issue'
  switch (n.type) {
    case 'issue_assigned':
      return `${actor} seni ${title} issue'suna atadı`
    case 'issue_updated':
      return `${actor}, ${title} durumunu ${n.data.new_status ?? ''} olarak değiştirdi`
    case 'comment_added':
      return `${actor}, ${title} issue'suna yorum yaptı`
    case 'member_added':
      return `${n.data.member_name ?? actor} workspace'e katıldı`
    default:
      return `${actor} bir işlem yaptı`
  }
}

function actorInitials(actor: AppNotification['actor']): string {
  const name = actor?.full_name
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

interface NotificationItemProps {
  notification: AppNotification
  onClick: () => void
}

export function NotificationItem({ notification: n, onClick }: NotificationItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
        !n.read ? 'bg-muted/40' : ''
      }`}
    >
      <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
        {n.actor?.avatar_url ? (
          <img
            src={n.actor.avatar_url}
            alt=""
            className="size-full object-cover rounded-full"
          />
        ) : (
          actorInitials(n.actor)
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-foreground leading-snug">
          {notificationText(n)}
        </p>
        {n.data.comment_preview && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            "{n.data.comment_preview}"
          </p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          {timeAgo(n.created_at)}
        </p>
      </div>

      {!n.read && (
        <span className="size-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </button>
  )
}

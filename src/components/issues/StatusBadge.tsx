import { statusConfig } from '@/lib/utils'
import type { IssueStatus } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

export function StatusBadge({ status }: { status: IssueStatus }) {
  const config = statusConfig[status]
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        config.color,
        config.bg
      )}
    >
      {config.label}
    </span>
  )
}

import { priorityConfig } from '@/lib/utils'
import type { Priority } from '@/lib/supabase/types'
import { cn } from '@/lib/utils'

export function PriorityBadge({
  priority,
  showLabel = false,
}: {
  priority: Priority
  showLabel?: boolean
}) {
  const config = priorityConfig[priority]
  return (
    <span className={cn('flex items-center gap-1.5 text-xs', config.color)}>
      <span className={cn('w-2 h-2 rounded-full flex-shrink-0', config.dot)} />
      {showLabel && config.label}
    </span>
  )
}

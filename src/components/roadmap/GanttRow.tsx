import type { Epic } from '@/lib/supabase/types'
import { differenceInDays, parseISO } from 'date-fns'
import { cn } from '@/lib/utils'

interface GanttRowProps {
  epic: Epic
  viewStart: Date
  totalDays: number
}

export function GanttRow({ epic, viewStart, totalDays }: GanttRowProps) {
  if (!epic.start_date || !epic.end_date) return null

  const epicStart = parseISO(epic.start_date)
  const epicEnd = parseISO(epic.end_date)

  const leftDays = differenceInDays(epicStart, viewStart)
  const widthDays = differenceInDays(epicEnd, epicStart) + 1

  const leftPct = (leftDays / totalDays) * 100
  const widthPct = (widthDays / totalDays) * 100

  if (leftPct > 100 || leftPct + widthPct < 0) return null

  const clampedLeft = Math.max(0, leftPct)
  const clampedWidth = Math.min(100 - clampedLeft, widthPct + Math.min(0, leftPct))

  return (
    <div className="relative h-8 flex items-center">
      <div
        title={epic.title}
        className={cn(
          'absolute h-6 rounded-lg flex items-center px-2 text-xs font-medium text-white shadow-md transition-opacity',
          epic.status === 'completed' && 'opacity-50'
        )}
        style={{
          left: `${clampedLeft}%`,
          width: `${clampedWidth}%`,
          backgroundColor: epic.color,
          minWidth: '4px',
        }}
      >
        <span className="truncate">{epic.title}</span>
      </div>
    </div>
  )
}

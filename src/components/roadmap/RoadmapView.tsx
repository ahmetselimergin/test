'use client'
import { useState, useMemo } from 'react'
import { useProjectStore } from '@/lib/stores/project.store'
import { GanttRow } from './GanttRow'
import {
  addMonths,
  startOfMonth,
  endOfMonth,
  eachMonthOfInterval,
  format,
  differenceInDays,
} from 'date-fns'
import { tr } from 'date-fns/locale'
import { ChevronLeft, ChevronRight } from 'lucide-react'

export function RoadmapView() {
  const { epics } = useProjectStore()
  const [viewStart, setViewStart] = useState(() => startOfMonth(new Date()))

  const viewEnd = useMemo(() => endOfMonth(addMonths(viewStart, 5)), [viewStart])
  const months = useMemo(
    () => eachMonthOfInterval({ start: viewStart, end: viewEnd }),
    [viewStart, viewEnd]
  )
  const totalDays = useMemo(
    () => differenceInDays(viewEnd, viewStart) + 1,
    [viewStart, viewEnd]
  )

  const visibleEpics = useMemo(
    () => epics.filter((e) => e.start_date && e.end_date),
    [epics]
  )

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Roadmap</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewStart((s) => addMonths(s, -1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-muted hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-muted w-40 text-center">
            {format(viewStart, 'MMM yyyy', { locale: tr })} —{' '}
            {format(viewEnd, 'MMM yyyy', { locale: tr })}
          </span>
          <button
            onClick={() => setViewStart((s) => addMonths(s, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-muted hover:text-foreground transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="bg-card border border-subtle rounded-xl overflow-hidden">
        {/* Header — months */}
        <div className="flex border-b border-subtle">
          <div className="w-48 flex-shrink-0 px-4 py-2 border-r border-subtle">
            <span className="text-xs text-muted">Epic</span>
          </div>
          <div className="flex-1 flex">
            {months.map((month) => (
              <div
                key={month.toISOString()}
                className="flex-1 text-center py-2 text-xs text-muted border-r border-subtle last:border-0"
              >
                {format(month, 'MMM yyyy', { locale: tr })}
              </div>
            ))}
          </div>
        </div>

        {/* Empty state */}
        {visibleEpics.length === 0 && (
          <div className="py-12 text-center text-sm text-muted">
            Tarih girilmiş epic bulunamadı
          </div>
        )}

        {/* Rows */}
        {visibleEpics.map((epic) => (
          <div
            key={epic.id}
            className="flex border-b border-subtle last:border-0 hover:bg-white/[0.02] transition-colors"
          >
            <div className="w-48 flex-shrink-0 px-4 flex items-center gap-2 border-r border-subtle py-1">
              <div
                className="w-2 h-2 rounded-full flex-shrink-0"
                style={{ backgroundColor: epic.color }}
              />
              <span className="text-sm truncate">{epic.title}</span>
            </div>
            <div className="flex-1 relative px-2 py-1">
              <GanttRow
                epic={epic}
                viewStart={viewStart}
                totalDays={totalDays}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

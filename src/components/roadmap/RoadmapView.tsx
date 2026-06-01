'use client'
import { useState, useMemo } from 'react'
import { Plus } from 'lucide-react'
import { useProjectStore } from '@/lib/stores/project.store'
import { GanttRow } from './GanttRow'
import { CreateEpicDialog } from './CreateEpicDialog'
import { EpicDateDialog } from './EpicDateDialog'
import { Button } from '@/components/ui/button'
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
import { Card } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
import type { Epic } from '@/lib/supabase/types'

export function RoadmapView() {
  const { epics, currentProject } = useProjectStore()
  const [viewStart, setViewStart] = useState(() => startOfMonth(new Date()))
  const [createOpen, setCreateOpen] = useState(false)
  const [editingEpic, setEditingEpic] = useState<Epic | null>(null)

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
          {currentProject && (
            <Button size="sm" onClick={() => setCreateOpen(true)}>
              <Plus size={14} className="mr-1.5" />
              Epic Oluştur
            </Button>
          )}
          <button
            onClick={() => setViewStart((s) => addMonths(s, -1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-sm text-muted-foreground w-40 text-center">
            {format(viewStart, 'MMM yyyy', { locale: tr })} —{' '}
            {format(viewEnd, 'MMM yyyy', { locale: tr })}
          </span>
          <button
            onClick={() => setViewStart((s) => addMonths(s, 1))}
            className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/5 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <Card className="overflow-hidden">
        <ScrollArea className="w-full">
          <div className="flex border-b border-border">
            <div className="w-48 flex-shrink-0 px-4 py-2 border-r border-border">
              <span className="text-xs text-muted-foreground">Epic</span>
            </div>
            <div className="flex-1 flex">
              {months.map((month) => (
                <div
                  key={month.toISOString()}
                  className="flex-1 text-center py-2 text-xs text-muted-foreground border-r border-border last:border-0"
                >
                  {format(month, 'MMM yyyy', { locale: tr })}
                </div>
              ))}
            </div>
          </div>

          {visibleEpics.length === 0 && (
            <div className="py-12 text-center text-sm text-muted-foreground">
              Tarih girilmiş epic bulunamadı
            </div>
          )}

          {visibleEpics.map((epic) => (
            <div
              key={epic.id}
              className="flex border-b border-border last:border-0 hover:bg-white/[0.02] transition-colors"
            >
              <div className="w-48 flex-shrink-0 px-4 flex items-center gap-2 border-r border-border py-1">
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
                  onEdit={setEditingEpic}
                />
              </div>
            </div>
          ))}

          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </Card>

      {currentProject && (
        <CreateEpicDialog
          projectId={currentProject.id}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}

      {editingEpic && (
        <EpicDateDialog
          epic={editingEpic}
          open={!!editingEpic}
          onOpenChange={(open) => { if (!open) setEditingEpic(null) }}
        />
      )}
    </div>
  )
}

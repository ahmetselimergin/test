'use client'
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  type DragOverEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCenter,
} from '@dnd-kit/core'
import { SortableContext, arrayMove, horizontalListSortingStrategy } from '@dnd-kit/sortable'
import { useState, useCallback, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useProjectStore } from '@/lib/stores/project.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import { CreateIssueDialog } from './CreateIssueDialog'
import { createClient } from '@/lib/supabase/client'
import { BoardColumn as BoardColumnComponent } from './BoardColumn'
import { AddColumnButton } from './AddColumnButton'
import { IssueCard } from '@/components/issues/IssueCard'
import type { BoardColumn, Issue, Project, MemberSummary } from '@/lib/supabase/types'
import type { BoardFilters } from '@/components/board/FilterBar'
import { matchesFilters } from '@/components/board/FilterBar'
import { reorderBoardColumns } from '@/app/actions/board'

interface KanbanBoardProps {
  project: Project
  workspaceSlug: string
  columns?: BoardColumn[]
  issues?: Issue[]
  members?: MemberSummary[]
  filters?: BoardFilters
}

export function KanbanBoard({
  project,
  workspaceSlug,
  columns: columnsProp,
  issues: issuesProp,
  members = [],
  filters,
}: KanbanBoardProps) {
  // Always render from store — props are only used for initial hydration in BoardView.
  // Using issuesProp/columnsProp here would ignore optimistic store updates from drag.
  const columns = useProjectStore((s) => s.columns)
  const issues = useIssueStore((s) => s.issues)
  const globalCreateOpen = useIssueStore((s) => s.globalCreateOpen)
  const setGlobalCreateOpen = useIssueStore((s) => s.setGlobalCreateOpen)
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null)
  const [activeColumn, setActiveColumn] = useState<BoardColumn | null>(null)
  const [globalDialogOpen, setGlobalDialogOpen] = useState(false)

  useEffect(() => {
    if (globalCreateOpen && columns.length > 0) {
      setGlobalDialogOpen(true)
      setGlobalCreateOpen(false)
    }
  }, [globalCreateOpen, columns, setGlobalCreateOpen])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      if (active.data.current?.type === 'column') {
        const col = useProjectStore.getState().columns.find(c => c.id === active.id)
        if (col) setActiveColumn(col)
        return
      }
      const issue = issues.find((i) => i.id === active.id)
      if (issue) setActiveIssue(issue)
    },
    [issues]
  )

  // Read fresh state from store to avoid stale-closure bugs during rapid drag events.
  const handleDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      if (active.data.current?.type === 'column') return // column reorder happens in dragEnd
      if (!over || active.id === over.id) return

      const { issues: freshIssues, setIssues } = useIssueStore.getState()
      const activeId = active.id as string
      const overId = over.id as string

      const activeItem = freshIssues.find((i) => i.id === activeId)
      if (!activeItem) return

      // Dropped over a column droppable (empty column or column border)
      const overColumn = columns.find((c) => c.id === overId)
      if (overColumn) {
        if (activeItem.board_column_id === overColumn.id) return
        setIssues(
          freshIssues.map((i) =>
            i.id === activeId ? { ...i, board_column_id: overColumn.id } : i
          )
        )
        return
      }

      // Dropped over another issue card
      const overItem = freshIssues.find((i) => i.id === overId)
      if (!overItem) return

      const targetColumnId = overItem.board_column_id
      const targetColumnIssues = freshIssues.filter((i) => i.board_column_id === targetColumnId)
      const oldIndex = targetColumnIssues.findIndex((i) => i.id === activeId)
      const newIndex = targetColumnIssues.findIndex((i) => i.id === overId)

      if (oldIndex === -1) {
        // Moving from a different column — place after the over item
        setIssues(
          freshIssues.map((i) =>
            i.id === activeId ? { ...i, board_column_id: targetColumnId } : i
          )
        )
      } else if (oldIndex !== newIndex) {
        // Reordering within the same column
        const reordered = arrayMove(targetColumnIssues, oldIndex, newIndex).map((i, idx) => ({
          ...i,
          order: idx,
        }))
        setIssues(
          freshIssues.map((i) => reordered.find((r) => r.id === i.id) ?? i)
        )
      }
    },
    [columns]
  )

  const handleDragEnd = useCallback(async ({ active, over }: DragEndEvent) => {
    if (active.data.current?.type === 'column') {
      setActiveColumn(null)
      if (!over || active.id === over.id) return
      const { columns: freshCols, setColumns } = useProjectStore.getState()
      const oldIdx = freshCols.findIndex(c => c.id === active.id)
      const newIdx = freshCols.findIndex(c => c.id === over.id)
      if (oldIdx !== -1 && newIdx !== -1 && oldIdx !== newIdx) {
        const reordered = arrayMove(freshCols, oldIdx, newIdx).map((c, i) => ({ ...c, order: i }))
        setColumns(reordered)
        await reorderBoardColumns(reordered.map(c => ({ id: c.id, order: c.order })))
      }
      return
    }
    setActiveIssue(null)
    const { issues: freshIssues } = useIssueStore.getState()
    const moved = freshIssues.find((i) => i.id === active.id)
    if (!moved) return
    const supabase = createClient()
    await supabase
      .from('issues')
      .update({ board_column_id: moved.board_column_id, order: moved.order })
      .eq('id', moved.id)
  }, [])

  return (
    <DndContext
      id="kanban-board"
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-5 h-full overflow-x-auto items-stretch">
        <SortableContext
          items={columns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <AnimatePresence>
            {columns.map((column) => {
              const columnIssues = issues
                .filter(i => i.board_column_id === column.id)
                .filter(i => !filters || matchesFilters(i, filters))
              return (
                <BoardColumnComponent
                  key={column.id}
                  column={column}
                  issues={columnIssues}
                  project={project}
                  workspaceSlug={workspaceSlug}
                  members={members}
                />
              )
            })}
          </AnimatePresence>
        </SortableContext>
        <AddColumnButton project={project} workspaceSlug={workspaceSlug} />
      </div>

      {columns[0] && (
        <CreateIssueDialog
          project={project}
          column={columns[0]}
          workspaceSlug={workspaceSlug}
          members={members}
          open={globalDialogOpen}
          onOpenChange={setGlobalDialogOpen}
        />
      )}

      <DragOverlay dropAnimation={null}>
        {activeIssue && (
          <IssueCard issue={activeIssue} project={project} overlay />
        )}
        {activeColumn && (
          <div className="flex-shrink-0 w-[272px] rounded-xl border border-accent/50 bg-card/80 opacity-95 rotate-[2deg] shadow-2xl px-4 py-3 cursor-grabbing">
            <div className="flex items-center gap-2">
              <span className="size-2 rounded-full shrink-0" style={{ backgroundColor: activeColumn.color }} />
              <span className="text-[12px] font-semibold text-foreground">{activeColumn.name}</span>
            </div>
          </div>
        )}
      </DragOverlay>
    </DndContext>
  )
}

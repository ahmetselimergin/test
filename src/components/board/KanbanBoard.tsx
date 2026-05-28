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
import { useState, useCallback } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useProjectStore } from '@/lib/stores/project.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import { createClient } from '@/lib/supabase/client'
import { BoardColumn as BoardColumnComponent } from './BoardColumn'
import { AddColumnButton } from './AddColumnButton'
import { IssueCard } from '@/components/issues/IssueCard'
import type { BoardColumn, Issue, Project, MemberSummary } from '@/lib/supabase/types'

interface KanbanBoardProps {
  project: Project
  workspaceSlug: string
  columns?: BoardColumn[]
  issues?: Issue[]
  members?: MemberSummary[]
}

export function KanbanBoard({
  project,
  workspaceSlug,
  columns: columnsProp,
  issues: issuesProp,
  members = [],
}: KanbanBoardProps) {
  const storeColumns = useProjectStore((s) => s.columns)
  const storeIssues = useIssueStore((s) => s.issues)
  const columns = columnsProp ?? storeColumns
  const issues = issuesProp ?? storeIssues
  const [activeIssue, setActiveIssue] = useState<Issue | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } })
  )

  const handleDragStart = useCallback(
    ({ active }: DragStartEvent) => {
      const issue = issues.find((i) => i.id === active.id)
      if (issue) setActiveIssue(issue)
    },
    [issues]
  )

  // Read fresh state from store to avoid stale-closure bugs during rapid drag events.
  const handleDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
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

  const handleDragEnd = useCallback(async ({ active }: DragEndEvent) => {
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
            {columns.map((column) => (
              <BoardColumnComponent
                key={column.id}
                column={column}
                issues={issues.filter((i) => i.board_column_id === column.id)}
                project={project}
                workspaceSlug={workspaceSlug}
                members={members}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
        <AddColumnButton project={project} workspaceSlug={workspaceSlug} />
      </div>

      <DragOverlay dropAnimation={null}>
        {activeIssue && (
          <IssueCard issue={activeIssue} project={project} overlay />
        )}
      </DragOverlay>
    </DndContext>
  )
}

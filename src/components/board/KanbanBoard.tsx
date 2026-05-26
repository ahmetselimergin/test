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
  const setIssues = useIssueStore((s) => s.setIssues)
  const moveIssue = useIssueStore((s) => s.moveIssue)
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

  // Live reorder while dragging over other cards
  const handleDragOver = useCallback(
    ({ active, over }: DragOverEvent) => {
      if (!over || active.id === over.id) return

      const activeId = active.id as string
      const overId = over.id as string

      const activeIssueItem = issues.find((i) => i.id === activeId)
      if (!activeIssueItem) return

      // Check if dragging over a column (empty column drop zone)
      const overColumn = columns.find((c) => c.id === overId)
      if (overColumn) {
        if (activeIssueItem.board_column_id !== overColumn.id) {
          const updated = issues.map((i) =>
            i.id === activeId ? { ...i, board_column_id: overColumn.id } : i
          )
          setIssues(updated)
        }
        return
      }

      // Dragging over another issue
      const overIssue = issues.find((i) => i.id === overId)
      if (!overIssue) return

      const newColumnId = overIssue.board_column_id

      // Get ordered list of issues in the target column (after potential column switch)
      const columnIssues = issues.filter((i) => i.board_column_id === newColumnId)
      const oldIndex = columnIssues.findIndex((i) => i.id === activeId)
      const newIndex = columnIssues.findIndex((i) => i.id === overId)

      if (oldIndex === -1) {
        // Moving from another column — insert at overIssue position
        const updated = issues.map((i) =>
          i.id === activeId ? { ...i, board_column_id: newColumnId } : i
        )
        setIssues(updated)
      } else if (oldIndex !== newIndex) {
        // Reorder within same column
        const reordered = arrayMove(columnIssues, oldIndex, newIndex)
        const withNewOrders = reordered.map((i, idx) => ({ ...i, order: idx }))
        const updated = issues.map((i) => {
          const reorderedItem = withNewOrders.find((r) => r.id === i.id)
          return reorderedItem ?? i
        })
        setIssues(updated)
      }
    },
    [issues, columns, setIssues]
  )

  const handleDragEnd = useCallback(
    async ({ active, over }: DragEndEvent) => {
      setActiveIssue(null)
      if (!over) return

      const issueId = active.id as string
      const movedIssue = issues.find((i) => i.id === issueId)
      if (!movedIssue) return

      const supabase = createClient()
      await supabase
        .from('issues')
        .update({ board_column_id: movedIssue.board_column_id, order: movedIssue.order })
        .eq('id', issueId)
    },
    [issues]
  )

  return (
    <DndContext
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

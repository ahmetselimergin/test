'use client'
import {
  DndContext,
  type DragEndEvent,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  closestCorners,
} from '@dnd-kit/core'
import { SortableContext, horizontalListSortingStrategy } from '@dnd-kit/sortable'
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

  const handleDragEnd = useCallback(
    async ({ active, over }: DragEndEvent) => {
      setActiveIssue(null)
      if (!over) return

      const issueId = active.id as string
      const overId = over.id as string

      const targetColumn = columns.find((c) => c.id === overId)
      const targetIssue = issues.find((i) => i.id === overId)
      const newColumnId = targetColumn?.id ?? targetIssue?.board_column_id
      if (!newColumnId) return

      const columnIssues = issues
        .filter((i) => i.board_column_id === newColumnId && i.id !== issueId)
        .sort((a, b) => a.order - b.order)

      const newOrder =
        columnIssues.length > 0
          ? columnIssues[columnIssues.length - 1].order + 1
          : 0

      moveIssue(issueId, newColumnId, newOrder)

      const supabase = createClient()
      await supabase
        .from('issues')
        .update({ board_column_id: newColumnId, order: newOrder })
        .eq('id', issueId)
    },
    [columns, issues, moveIssue]
  )

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-4 p-5 h-full overflow-x-auto items-start">
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

      <DragOverlay>
        {activeIssue && (
          <IssueCard issue={activeIssue} project={project} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  )
}

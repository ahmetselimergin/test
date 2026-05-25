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
import { BoardColumn } from './BoardColumn'
import { IssueCard } from '@/components/issues/IssueCard'
import type { Issue, Project } from '@/lib/supabase/types'

export function KanbanBoard({ project }: { project: Project }) {
  const { columns } = useProjectStore()
  const { issues, moveIssue } = useIssueStore()
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
      <div className="flex gap-4 p-6 h-full overflow-x-auto">
        <SortableContext
          items={columns.map((c) => c.id)}
          strategy={horizontalListSortingStrategy}
        >
          <AnimatePresence>
            {columns.map((column) => (
              <BoardColumn
                key={column.id}
                column={column}
                issues={issues.filter((i) => i.board_column_id === column.id)}
                project={project}
              />
            ))}
          </AnimatePresence>
        </SortableContext>
      </div>

      <DragOverlay>
        {activeIssue && (
          <IssueCard issue={activeIssue} project={project} isDragging />
        )}
      </DragOverlay>
    </DndContext>
  )
}

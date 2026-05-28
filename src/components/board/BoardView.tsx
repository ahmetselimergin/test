'use client'

import { useState, useLayoutEffect, useMemo } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { BoardToolbar } from '@/components/board/BoardToolbar'
import { FilterBar } from '@/components/board/FilterBar'
import type { BoardFilters } from '@/components/board/FilterBar'
import { useProjectStore } from '@/lib/stores/project.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import type { BoardColumn, Issue, Project, MemberSummary } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  project: Project
  workspaceSlug: string
  columns: BoardColumn[]
  issues: Issue[]
  members: MemberSummary[]
}

export function BoardView({ project, workspaceSlug, columns, issues, members }: Props) {
  const [filterBarOpen, setFilterBarOpen] = useState(false)
  const [filters, setFilters] = useState<BoardFilters>({ assignees: [], priorities: [], types: [], labels: [] })
  const activeFilterCount = filters.assignees.length + filters.priorities.length + filters.types.length + filters.labels.length

  const liveIssues = useIssueStore((s) => s.issues)
  const allLabels = useMemo(
    () => [...new Set((liveIssues.length > 0 ? liveIssues : issues).flatMap(i => i.labels))],
    [liveIssues, issues]
  )

  useLayoutEffect(() => {
    useProjectStore.getState().hydrateProjectView({
      project,
      columns,
      epics: [],
      sprints: [],
      members,
    })
    useIssueStore.getState().setIssues(issues)

    const supabase = createClient()
    const channel = supabase
      .channel(`board-${project.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'issues',
          filter: `project_id=eq.${project.id}`,
        },
        (payload) => {
          const store = useIssueStore.getState()
          if (payload.eventType === 'UPDATE') {
            store.updateIssue((payload.new as Issue).id, payload.new as Partial<Issue>)
          }
          if (payload.eventType === 'INSERT') {
            const exists = store.issues.some((i) => i.id === (payload.new as Issue).id)
            if (!exists) store.addIssue(payload.new as Issue)
          }
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [project.id])

  return (
    <div className="h-full flex flex-col">
      <BoardToolbar
        project={project}
        issueCount={issues.length}
        filterBarOpen={filterBarOpen}
        onFilterToggle={() => setFilterBarOpen(!filterBarOpen)}
        activeFilterCount={activeFilterCount}
      />
      <AnimatePresence>
        {filterBarOpen && (
          <motion.div
            key="filter-bar"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
            style={{ overflow: 'hidden' }}
          >
            <FilterBar
              filters={filters}
              onChange={setFilters}
              members={members}
              allLabels={allLabels}
            />
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex-1 overflow-hidden grid-board-bg">
        <KanbanBoard
          project={project}
          workspaceSlug={workspaceSlug}
          columns={columns}
          issues={issues}
          members={members}
          filters={filters}
        />
      </div>
    </div>
  )
}

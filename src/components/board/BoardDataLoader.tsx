'use client'
import { useEffect } from 'react'
import { useProjectStore } from '@/lib/stores/project.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import type { BoardColumn, Issue, Project, Epic, Sprint } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'

interface Props {
  project: Project
  columns: BoardColumn[]
  issues: Issue[]
  epics?: Epic[]
  sprints?: Sprint[]
  children: React.ReactNode
}

export function BoardDataLoader({
  project,
  columns,
  issues,
  epics = [],
  sprints = [],
  children,
}: Props) {
  const { setCurrentProject, setColumns, setEpics, setSprints } = useProjectStore()
  const { setIssues } = useIssueStore()

  useEffect(() => {
    setCurrentProject(project)
    setColumns(columns)
    setIssues(issues)
    setEpics(epics)
    setSprints(sprints)
  }, [project, columns, issues, epics, sprints, setCurrentProject, setColumns, setIssues, setEpics, setSprints])

  useEffect(() => {
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
          if (payload.eventType === 'UPDATE') {
            useIssueStore.getState().updateIssue(
              (payload.new as Issue).id,
              payload.new as Partial<Issue>
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [project.id])

  return <>{children}</>
}

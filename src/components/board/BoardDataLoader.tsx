'use client'
import { useLayoutEffect } from 'react'
import { useProjectStore } from '@/lib/stores/project.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import type { BoardColumn, Issue, Project, Epic, Sprint, MemberSummary } from '@/lib/supabase/types'

const EMPTY_EPICS: Epic[] = []
const EMPTY_SPRINTS: Sprint[] = []
const EMPTY_MEMBERS: MemberSummary[] = []

interface Props {
  project: Project
  columns: BoardColumn[]
  issues: Issue[]
  epics?: Epic[]
  sprints?: Sprint[]
  members?: MemberSummary[]
  children: React.ReactNode
}

export function BoardDataLoader({
  project,
  columns,
  issues,
  epics = EMPTY_EPICS,
  sprints = EMPTY_SPRINTS,
  members = EMPTY_MEMBERS,
  children,
}: Props) {
  useLayoutEffect(() => {
    useProjectStore.getState().hydrateProjectView({ project, columns, epics, sprints, members })
    useIssueStore.getState().setIssues(issues)
  }, [project.id])

  return <>{children}</>
}

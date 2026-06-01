import { create } from 'zustand'
import type { Project, BoardColumn, Epic, Sprint, MemberSummary } from '@/lib/supabase/types'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  columns: BoardColumn[]
  epics: Epic[]
  sprints: Sprint[]
  members: MemberSummary[]
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  setColumns: (columns: BoardColumn[]) => void
  setEpics: (epics: Epic[]) => void
  setSprints: (sprints: Sprint[]) => void
  setMembers: (members: MemberSummary[]) => void
  addSprint: (sprint: Sprint) => void
  addEpic: (epic: Epic) => void
  updateEpic: (id: string, updates: Partial<Epic>) => void
  hydrateProjectView: (payload: {
    project: Project
    columns: BoardColumn[]
    epics: Epic[]
    sprints: Sprint[]
    members: MemberSummary[]
  }) => void
  updateColumn: (id: string, updates: Partial<BoardColumn>) => void
  addColumn: (column: BoardColumn) => void
  removeColumn: (id: string) => void
}

function columnsUnchanged(a: BoardColumn[], b: BoardColumn[]) {
  return (
    a === b ||
    (a.length === b.length &&
      a.every((col, i) => col.id === b[i]?.id && col.order === b[i]?.order))
  )
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  columns: [],
  epics: [],
  sprints: [],
  members: [],
  setProjects: (projects) =>
    set((state) => (state.projects === projects ? state : { projects })),
  setCurrentProject: (currentProject) =>
    set((state) =>
      state.currentProject?.id === currentProject?.id &&
      state.currentProject === currentProject
        ? state
        : { currentProject }
    ),
  setColumns: (columns) =>
    set((state) => (columnsUnchanged(state.columns, columns) ? state : { columns })),
  setEpics: (epics) => set((state) => (state.epics === epics ? state : { epics })),
  setSprints: (sprints) =>
    set((state) => (state.sprints === sprints ? state : { sprints })),
  setMembers: (members) =>
    set((state) => (state.members === members ? state : { members })),
  addSprint: (sprint) =>
    set((state) => ({ sprints: [...state.sprints, sprint] })),
  addEpic: (epic) =>
    set((state) => ({ epics: [...state.epics, epic] })),
  updateEpic: (id, updates) =>
    set((state) => ({
      epics: state.epics.map((e) => (e.id === id ? { ...e, ...updates } : e)),
    })),
  hydrateProjectView: ({ project, columns, epics, sprints, members }) =>
    set((state) => {
      const sameProject =
        state.currentProject?.id === project.id &&
        state.currentProject?.name === project.name
      if (
        sameProject &&
        columnsUnchanged(state.columns, columns) &&
        state.epics === epics &&
        state.sprints === sprints &&
        state.members === members
      ) {
        return state
      }
      return { currentProject: project, columns, epics, sprints, members }
    }),
  updateColumn: (id, updates) =>
    set((state) => ({
      columns: state.columns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  addColumn: (column) =>
    set((state) => ({ columns: [...state.columns, column] })),
  removeColumn: (id) =>
    set((state) => ({ columns: state.columns.filter((c) => c.id !== id) })),
}))

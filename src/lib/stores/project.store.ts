import { create } from 'zustand'
import type { Project, BoardColumn, Epic, Sprint } from '@/lib/supabase/types'

interface ProjectState {
  projects: Project[]
  currentProject: Project | null
  columns: BoardColumn[]
  epics: Epic[]
  sprints: Sprint[]
  setProjects: (projects: Project[]) => void
  setCurrentProject: (project: Project | null) => void
  setColumns: (columns: BoardColumn[]) => void
  setEpics: (epics: Epic[]) => void
  setSprints: (sprints: Sprint[]) => void
  updateColumn: (id: string, updates: Partial<BoardColumn>) => void
  addColumn: (column: BoardColumn) => void
  removeColumn: (id: string) => void
}

export const useProjectStore = create<ProjectState>((set) => ({
  projects: [],
  currentProject: null,
  columns: [],
  epics: [],
  sprints: [],
  setProjects: (projects) => set({ projects }),
  setCurrentProject: (currentProject) => set({ currentProject }),
  setColumns: (columns) => set({ columns }),
  setEpics: (epics) => set({ epics }),
  setSprints: (sprints) => set({ sprints }),
  updateColumn: (id, updates) =>
    set((state) => ({
      columns: state.columns.map((c) => (c.id === id ? { ...c, ...updates } : c)),
    })),
  addColumn: (column) =>
    set((state) => ({ columns: [...state.columns, column] })),
  removeColumn: (id) =>
    set((state) => ({ columns: state.columns.filter((c) => c.id !== id) })),
}))

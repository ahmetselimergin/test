import { create } from 'zustand'
import type { Workspace, WorkspaceMember } from '@/lib/supabase/types'

interface WorkspaceState {
  workspaces: Workspace[]
  currentWorkspace: Workspace | null
  members: WorkspaceMember[]
  setWorkspaces: (ws: Workspace[]) => void
  setCurrentWorkspace: (ws: Workspace | null) => void
  setMembers: (members: WorkspaceMember[]) => void
  addWorkspace: (ws: Workspace) => void
}

export const useWorkspaceStore = create<WorkspaceState>((set) => ({
  workspaces: [],
  currentWorkspace: null,
  members: [],
  setWorkspaces: (workspaces) => set({ workspaces }),
  setCurrentWorkspace: (currentWorkspace) => set({ currentWorkspace }),
  setMembers: (members) => set({ members }),
  addWorkspace: (ws) => set((state) => ({ workspaces: [...state.workspaces, ws] })),
}))

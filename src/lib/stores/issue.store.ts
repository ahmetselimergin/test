import { create } from 'zustand'
import type { Issue, Comment, ActivityLog } from '@/lib/supabase/types'

interface IssueState {
  issues: Issue[]
  selectedIssue: Issue | null
  comments: Comment[]
  activityLogs: ActivityLog[]
  setIssues: (issues: Issue[]) => void
  setSelectedIssue: (issue: Issue | null) => void
  setComments: (comments: Comment[]) => void
  setActivityLogs: (logs: ActivityLog[]) => void
  addIssue: (issue: Issue) => void
  updateIssue: (id: string, updates: Partial<Issue>) => void
  removeIssue: (id: string) => void
  moveIssue: (issueId: string, newColumnId: string, newOrder: number) => void
}

export const useIssueStore = create<IssueState>((set) => ({
  issues: [],
  selectedIssue: null,
  comments: [],
  activityLogs: [],
  setIssues: (issues) =>
    set((state) => (state.issues === issues ? state : { issues })),
  setSelectedIssue: (selectedIssue) => set({ selectedIssue }),
  setComments: (comments) => set({ comments }),
  setActivityLogs: (activityLogs) => set({ activityLogs }),
  addIssue: (issue) => set((state) => ({ issues: [issue, ...state.issues] })),
  updateIssue: (id, updates) =>
    set((state) => ({
      issues: state.issues.map((i) => (i.id === id ? { ...i, ...updates } : i)),
      selectedIssue:
        state.selectedIssue?.id === id
          ? { ...state.selectedIssue, ...updates }
          : state.selectedIssue,
    })),
  removeIssue: (id) =>
    set((state) => ({
      issues: state.issues.filter((i) => i.id !== id),
      selectedIssue: state.selectedIssue?.id === id ? null : state.selectedIssue,
    })),
  moveIssue: (issueId, newColumnId, newOrder) =>
    set((state) => ({
      issues: state.issues.map((i) =>
        i.id === issueId ? { ...i, board_column_id: newColumnId, order: newOrder } : i
      ),
    })),
}))

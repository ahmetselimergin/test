import { create } from 'zustand'

export interface AppNotification {
  id: string
  type: 'issue_assigned' | 'issue_updated' | 'comment_added' | 'member_added'
  actor: { full_name: string | null; avatar_url: string | null } | null
  issue_id: string | null
  workspace_id: string
  data: {
    issue_title?: string
    project_name?: string
    new_status?: string
    old_status?: string
    comment_preview?: string
    member_name?: string
  }
  read: boolean
  created_at: string
}

interface NotificationState {
  notifications: AppNotification[]
  setNotifications: (n: AppNotification[]) => void
  addNotification: (n: AppNotification) => void
  markRead: (id: string) => void
  markAllRead: () => void
  unreadCount: () => number
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  setNotifications: (notifications) => set({ notifications }),
  addNotification: (n) =>
    set((state) => ({
      notifications: state.notifications.some((x) => x.id === n.id)
        ? state.notifications
        : [n, ...state.notifications],
    })),
  markRead: (id) =>
    set((state) => ({
      notifications: state.notifications.map((n) =>
        n.id === id ? { ...n, read: true } : n
      ),
    })),
  markAllRead: () =>
    set((state) => ({
      notifications: state.notifications.map((n) => ({ ...n, read: true })),
    })),
  unreadCount: () => get().notifications.filter((n) => !n.read).length,
}))

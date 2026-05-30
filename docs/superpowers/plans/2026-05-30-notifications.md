# In-App Notifications — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Kullanıcılara atama, durum değişikliği, yorum ve üye ekleme olaylarında kalıcı, okunabilir in-app bildirimler göstermek.

**Architecture:** Server Actions ve client mutasyonlardan `notifications` tablosuna insert yapılır → Supabase Realtime ile dashboard layout'ta dinlenir → Zustand store'a eklenir → AppHeader'daki NotificationBell UI'ı gösterir.

**Tech Stack:** Next.js 16 App Router, Supabase (PostgreSQL + Realtime), Zustand, TypeScript, Tailwind v4

---

## Dosya Yapısı

**Yeni dosyalar:**
- `src/lib/stores/notification.store.ts` — Zustand notification state
- `src/app/actions/notifications.ts` — Server Actions: notification insert'leri
- `src/components/layout/NotificationsProvider.tsx` — Client component: realtime sub + initial load
- `src/components/notifications/NotificationBell.tsx` — Zil ikonu + okunmamış badge
- `src/components/notifications/NotificationPanel.tsx` — Dropdown panel
- `src/components/notifications/NotificationItem.tsx` — Tek bildirim satırı

**Değişen dosyalar:**
- `src/app/(dashboard)/layout.tsx` — NotificationsProvider ekle
- `src/components/layout/AppHeader.tsx` — Bell → NotificationBell replace
- `src/app/actions/board.ts` — createIssue'ya assignee notification ekle
- `src/components/issues/IssueDetailPanel.tsx` — handleAssigneeChange + handleStatusChange'e notification çağrısı
- `src/components/issues/IssueCommentThread.tsx` — comment insert'ten sonra notification çağrısı
- `src/app/actions/workspace.ts` — inviteTeamMember'a member_added notification ekle

---

## Task 1: Supabase'de notifications tablosunu oluştur

**Files:**
- Supabase Dashboard → SQL Editor

- [ ] **Step 1: Supabase Dashboard'u aç, SQL Editor'a git ve aşağıdaki SQL'i çalıştır**

```sql
create table notifications (
  id           uuid        default gen_random_uuid() primary key,
  user_id      uuid        references profiles(id) on delete cascade not null,
  actor_id     uuid        references profiles(id) on delete set null,
  type         text        not null,
  issue_id     uuid        references issues(id) on delete cascade,
  workspace_id uuid        references workspaces(id) on delete cascade not null,
  data         jsonb       default '{}'::jsonb,
  read         boolean     default false not null,
  created_at   timestamptz default now() not null
);

create index notifications_user_id_idx on notifications(user_id);
create index notifications_created_at_idx on notifications(created_at desc);

alter table notifications enable row level security;

create policy "Users see own notifications"
  on notifications for select
  using (auth.uid() = user_id);

create policy "Users update own notifications"
  on notifications for update
  using (auth.uid() = user_id);
```

- [ ] **Step 2: Supabase Table Editor'da `notifications` tablosunun göründüğünü doğrula**

Beklenen: `id`, `user_id`, `actor_id`, `type`, `issue_id`, `workspace_id`, `data`, `read`, `created_at` kolonları mevcut.

- [ ] **Step 3: Commit**

```bash
git commit --allow-empty -m "feat: notifications table created in Supabase"
```

---

## Task 2: Notification Zustand store

**Files:**
- Create: `src/lib/stores/notification.store.ts`

- [ ] **Step 1: Dosyayı oluştur**

```typescript
// src/lib/stores/notification.store.ts
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
```

- [ ] **Step 2: TypeScript hatası olmadığını doğrula**

```bash
cd /Users/ahmetselim/Desktop/test && npx tsc --noEmit 2>&1 | grep "notification.store"
```

Beklenen: çıktı yok (hata yok).

- [ ] **Step 3: Commit**

```bash
git add src/lib/stores/notification.store.ts
git commit -m "feat: notification zustand store"
```

---

## Task 3: Notification Server Actions

**Files:**
- Create: `src/app/actions/notifications.ts`

- [ ] **Step 1: Dosyayı oluştur**

```typescript
// src/app/actions/notifications.ts
'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function notifyIssueAssigned(
  issueId: string,
  newAssigneeId: string,
  workspaceId: string,
  data: { issue_title: string; project_name: string }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user || newAssigneeId === user.id) return

  const adminClient = createAdminClient()
  await adminClient.from('notifications').insert({
    user_id: newAssigneeId,
    actor_id: user.id,
    type: 'issue_assigned',
    issue_id: issueId,
    workspace_id: workspaceId,
    data,
  }).catch(() => {})
}

export async function notifyIssueUpdated(
  issueId: string,
  workspaceId: string,
  data: {
    issue_title: string
    project_name: string
    new_status: string
    old_status: string
    assignee_id: string | null
    reporter_id: string | null
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const recipients = [...new Set([data.assignee_id, data.reporter_id])]
    .filter((id): id is string => Boolean(id) && id !== user.id)

  if (recipients.length === 0) return

  const adminClient = createAdminClient()
  await adminClient.from('notifications').insert(
    recipients.map((user_id) => ({
      user_id,
      actor_id: user.id,
      type: 'issue_updated',
      issue_id: issueId,
      workspace_id: workspaceId,
      data: {
        issue_title: data.issue_title,
        project_name: data.project_name,
        new_status: data.new_status,
        old_status: data.old_status,
      },
    }))
  ).catch(() => {})
}

export async function notifyCommentAdded(
  issueId: string,
  workspaceId: string,
  data: {
    issue_title: string
    project_name: string
    comment_preview: string
    assignee_id: string | null
    reporter_id: string | null
  }
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const recipients = [...new Set([data.assignee_id, data.reporter_id])]
    .filter((id): id is string => Boolean(id) && id !== user.id)

  if (recipients.length === 0) return

  const adminClient = createAdminClient()
  await adminClient.from('notifications').insert(
    recipients.map((user_id) => ({
      user_id,
      actor_id: user.id,
      type: 'comment_added',
      issue_id: issueId,
      workspace_id: workspaceId,
      data: {
        issue_title: data.issue_title,
        project_name: data.project_name,
        comment_preview: data.comment_preview,
      },
    }))
  ).catch(() => {})
}

export async function notifyMemberAdded(
  workspaceId: string,
  actorId: string,
  memberName: string
) {
  const adminClient = createAdminClient()

  const { data: admins } = await adminClient
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspaceId)
    .in('role', ['owner', 'admin'])

  const recipients = (admins ?? [])
    .map((a) => a.user_id)
    .filter((id) => id !== actorId)

  if (recipients.length === 0) return

  await adminClient.from('notifications').insert(
    recipients.map((user_id) => ({
      user_id,
      actor_id: actorId,
      type: 'member_added',
      issue_id: null,
      workspace_id: workspaceId,
      data: { member_name: memberName },
    }))
  ).catch(() => {})
}
```

- [ ] **Step 2: TypeScript hatası olmadığını doğrula**

```bash
npx tsc --noEmit 2>&1 | grep "notifications.ts"
```

Beklenen: çıktı yok.

- [ ] **Step 3: Commit**

```bash
git add src/app/actions/notifications.ts
git commit -m "feat: notification server actions"
```

---

## Task 4: NotificationsProvider (Realtime + initial load)

**Files:**
- Create: `src/components/layout/NotificationsProvider.tsx`

- [ ] **Step 1: Dosyayı oluştur**

```typescript
// src/components/layout/NotificationsProvider.tsx
'use client'

import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useNotificationStore, type AppNotification } from '@/lib/stores/notification.store'

export function NotificationsProvider({ userId }: { userId: string }) {
  const { setNotifications, addNotification } = useNotificationStore()

  useEffect(() => {
    const supabase = createClient()

    // Initial load — son 50 bildirim
    supabase
      .from('notifications')
      .select('*, actor:profiles!actor_id(full_name, avatar_url)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50)
      .then(({ data }) => {
        if (data) setNotifications(data as AppNotification[])
      })

    // Realtime subscription
    const channel = supabase
      .channel(`notifications-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          addNotification(payload.new as AppNotification)
        }
      )
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userId, setNotifications, addNotification])

  return null
}
```

- [ ] **Step 2: TypeScript hatası olmadığını doğrula**

```bash
npx tsc --noEmit 2>&1 | grep "NotificationsProvider"
```

Beklenen: çıktı yok.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/NotificationsProvider.tsx
git commit -m "feat: notifications realtime provider"
```

---

## Task 5: Dashboard layout'a NotificationsProvider ekle

**Files:**
- Modify: `src/app/(dashboard)/layout.tsx`

Mevcut dosya server component. `NotificationsProvider`'a `userId` prop'u geçmek için layout'ta `createClient()` ile user'ı alıp aktaracağız.

- [ ] **Step 1: Layout'u güncelle**

`src/app/(dashboard)/layout.tsx` dosyasını şu hale getir:

```typescript
import { Sidebar } from '@/components/layout/Sidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DataLoader } from '@/components/layout/DataLoader'
import { IssueDetailPanel } from '@/components/issues/IssueDetailPanel'
import { WorkspaceColorProvider } from '@/components/layout/WorkspaceColorProvider'
import { NotificationsProvider } from '@/components/layout/NotificationsProvider'
import { createClient } from '@/lib/supabase/server'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <TooltipProvider>
      <DataLoader>
        <WorkspaceColorProvider />
        {user && <NotificationsProvider userId={user.id} />}
        <div className="flex h-screen overflow-hidden bg-background">
          <Sidebar />
          <div className="flex-1 flex flex-col overflow-hidden min-w-0">
            <AppHeader />
            <main className="flex-1 overflow-auto bg-muted/20">{children}</main>
          </div>
        </div>
      </DataLoader>
      <IssueDetailPanel />
    </TooltipProvider>
  )
}
```

- [ ] **Step 2: Build hatası olmadığını doğrula**

```bash
npx tsc --noEmit 2>&1 | grep "layout"
```

Beklenen: çıktı yok.

- [ ] **Step 3: Commit**

```bash
git add src/app/(dashboard)/layout.tsx
git commit -m "feat: add NotificationsProvider to dashboard layout"
```

---

## Task 6: NotificationItem bileşeni

**Files:**
- Create: `src/components/notifications/NotificationItem.tsx`

- [ ] **Step 1: Dosyayı oluştur**

```typescript
// src/components/notifications/NotificationItem.tsx
import { timeAgo } from '@/lib/utils'
import type { AppNotification } from '@/lib/stores/notification.store'

function notificationText(n: AppNotification): string {
  const actor = n.actor?.full_name ?? 'Birisi'
  const title = n.data.issue_title ? `"${n.data.issue_title}"` : 'bir issue'
  switch (n.type) {
    case 'issue_assigned':
      return `${actor} seni ${title} issue'suna atadı`
    case 'issue_updated':
      return `${actor}, ${title} durumunu ${n.data.new_status ?? ''} olarak değiştirdi`
    case 'comment_added':
      return `${actor}, ${title} issue'suna yorum yaptı`
    case 'member_added':
      return `${n.data.member_name ?? actor} workspace'e katıldı`
    default:
      return `${actor} bir işlem yaptı`
  }
}

function actorInitials(actor: AppNotification['actor']): string {
  const name = actor?.full_name
  if (!name) return '?'
  return name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
}

interface NotificationItemProps {
  notification: AppNotification
  onClick: () => void
}

export function NotificationItem({ notification: n, onClick }: NotificationItemProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/60 ${
        !n.read ? 'bg-muted/40' : ''
      }`}
    >
      {/* Actor avatar */}
      <div className="size-7 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary shrink-0 mt-0.5">
        {n.actor?.avatar_url ? (
          <img
            src={n.actor.avatar_url}
            alt=""
            className="size-full object-cover rounded-full"
          />
        ) : (
          actorInitials(n.actor)
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[12px] text-foreground leading-snug">
          {notificationText(n)}
        </p>
        {n.data.comment_preview && (
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
            "{n.data.comment_preview}"
          </p>
        )}
        <p className="text-[10px] text-muted-foreground mt-1">
          {timeAgo(n.created_at)}
        </p>
      </div>

      {/* Unread dot */}
      {!n.read && (
        <span className="size-1.5 rounded-full bg-primary shrink-0 mt-1.5" />
      )}
    </button>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/notifications/NotificationItem.tsx
git commit -m "feat: NotificationItem component"
```

---

## Task 7: NotificationPanel bileşeni

**Files:**
- Create: `src/components/notifications/NotificationPanel.tsx`

- [ ] **Step 1: Dosyayı oluştur**

```typescript
// src/components/notifications/NotificationPanel.tsx
'use client'

import { useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import { useNotificationStore } from '@/lib/stores/notification.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import { NotificationItem } from './NotificationItem'

interface NotificationPanelProps {
  open: boolean
  onClose: () => void
}

export function NotificationPanel({ open, onClose }: NotificationPanelProps) {
  const { notifications, markRead, markAllRead } = useNotificationStore()
  const setSelectedIssue = useIssueStore((s) => s.setSelectedIssue)
  const issues = useIssueStore((s) => s.issues)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose()
      }
    }
    if (open) document.addEventListener('mousedown', onClickOutside)
    return () => document.removeEventListener('mousedown', onClickOutside)
  }, [open, onClose])

  async function handleClick(id: string, issueId: string | null) {
    const supabase = createClient()
    markRead(id)
    await supabase.from('notifications').update({ read: true }).eq('id', id)

    if (issueId) {
      const issue = issues.find((i) => i.id === issueId)
      if (issue) setSelectedIssue(issue)
    }
    onClose()
  }

  async function handleMarkAllRead() {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return
    markAllRead()
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          initial={{ opacity: 0, y: -8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="absolute right-0 top-full mt-2 w-[320px] rounded-xl border border-border bg-popover shadow-xl overflow-hidden z-50"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border">
            <span className="text-[13px] font-semibold text-foreground">Bildirimler</span>
            {notifications.some((n) => !n.read) && (
              <button
                type="button"
                onClick={handleMarkAllRead}
                className="text-[11px] text-primary hover:text-primary/80 transition-colors"
              >
                Tümünü okundu işaretle
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[400px] overflow-y-auto divide-y divide-border">
            {notifications.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 text-center">
                <p className="text-[13px] text-muted-foreground font-medium">Henüz bildirim yok</p>
                <p className="text-[11px] text-muted-foreground/60 mt-1">Issue atandığında burada görünür</p>
              </div>
            ) : (
              notifications.map((n) => (
                <NotificationItem
                  key={n.id}
                  notification={n}
                  onClick={() => handleClick(n.id, n.issue_id)}
                />
              ))
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/notifications/NotificationPanel.tsx
git commit -m "feat: NotificationPanel component"
```

---

## Task 8: NotificationBell bileşeni

**Files:**
- Create: `src/components/notifications/NotificationBell.tsx`

- [ ] **Step 1: Dosyayı oluştur**

```typescript
// src/components/notifications/NotificationBell.tsx
'use client'

import { useState } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotificationStore } from '@/lib/stores/notification.store'
import { NotificationPanel } from './NotificationPanel'

export function NotificationBell() {
  const [open, setOpen] = useState(false)
  const unreadCount = useNotificationStore((s) => s.unreadCount())

  return (
    <div className="relative">
      <Button
        variant="ghost"
        size="icon"
        className="size-7 text-muted-foreground relative"
        aria-label="Bildirimler"
        onClick={() => setOpen((v) => !v)}
      >
        <Bell size={15} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 size-4 rounded-full bg-rose-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </Button>
      <NotificationPanel open={open} onClose={() => setOpen(false)} />
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/notifications/NotificationBell.tsx
git commit -m "feat: NotificationBell component with unread badge"
```

---

## Task 9: AppHeader'da Bell → NotificationBell

**Files:**
- Modify: `src/components/layout/AppHeader.tsx`

- [ ] **Step 1: Import'u güncelle**

`src/components/layout/AppHeader.tsx` dosyasında:

```typescript
// Şu satırı sil:
import { Search, Plus, Bell } from 'lucide-react'
// Bu satırla değiştir:
import { Search, Plus } from 'lucide-react'
```

```typescript
// Dosyanın import bölümüne ekle:
import { NotificationBell } from '@/components/notifications/NotificationBell'
```

- [ ] **Step 2: Bell button'ını replace et**

`AppHeader.tsx`'de şu bloğu:

```typescript
        <Button
          variant="ghost"
          size="icon"
          className="size-7 text-muted-foreground"
          aria-label="Bildirimler"
          title="Bildirimler — yakında"
        >
          <Bell size={15} />
        </Button>
```

Şununla değiştir:

```typescript
        <NotificationBell />
```

- [ ] **Step 3: Tarayıcıda doğrula**

`npm run dev` çalıştır. AppHeader'da zil ikonu görünmeli. Henüz bildirim olmadığı için badge görünmemeli.

- [ ] **Step 4: Commit**

```bash
git add src/components/layout/AppHeader.tsx
git commit -m "feat: replace Bell with NotificationBell in AppHeader"
```

---

## Task 10: createIssue action'ında assignee notification

**Files:**
- Modify: `src/app/actions/board.ts`

- [ ] **Step 1: Import ekle**

`src/app/actions/board.ts` dosyasının başına, mevcut import'ların altına:

```typescript
import { createAdminClient } from '@/lib/supabase/server'
```

Not: `createAdminClient` zaten `server.ts`'de export ediliyor. `createClient` import'unu değiştirme, sadece `createAdminClient`'ı ekle.

- [ ] **Step 2: createIssue'da bildirim ekle**

`createIssue` fonksiyonunda, `activity_logs` insert'inden hemen SONRA (return'den önce) şunu ekle:

```typescript
  // Notify assignee if set and different from creator
  if (assigneeId && assigneeId !== user.id) {
    const adminClient = createAdminClient()
    const { data: project } = await supabase
      .from('projects')
      .select('name, workspace_id')
      .eq('id', projectId)
      .single()

    await adminClient.from('notifications').insert({
      user_id: assigneeId,
      actor_id: user.id,
      type: 'issue_assigned',
      issue_id: issue.id,
      workspace_id: project?.workspace_id ?? '',
      data: {
        issue_title: title,
        project_name: project?.name ?? '',
      },
    }).catch(() => {})
  }
```

Bu bloğu `revalidatePath(...)` satırından hemen önce koy.

- [ ] **Step 3: TypeScript kontrolü**

```bash
npx tsc --noEmit 2>&1 | grep "board.ts"
```

Beklenen: çıktı yok.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/board.ts
git commit -m "feat: notify assignee on issue creation"
```

---

## Task 11: IssueDetailPanel'da assignee + status notification

**Files:**
- Modify: `src/components/issues/IssueDetailPanel.tsx`

- [ ] **Step 1: Import ekle**

`IssueDetailPanel.tsx` dosyasının import bölümüne ekle:

```typescript
import { notifyIssueAssigned, notifyIssueUpdated } from '@/app/actions/notifications'
```

- [ ] **Step 2: handleAssigneeChange'e notification ekle**

`handleAssigneeChange` fonksiyonunda, `activity_logs` insert'inden SONRA ekle:

```typescript
    // Notify new assignee
    if (id && id !== user.id) {
      const { data: project } = await supabase
        .from('projects')
        .select('name, workspace_id')
        .eq('id', issue.project_id)
        .single()

      notifyIssueAssigned(issue.id, id, project?.workspace_id ?? '', {
        issue_title: issue.title,
        project_name: project?.name ?? '',
      })
    }
```

- [ ] **Step 3: handleStatusChange'e notification ekle**

`handleStatusChange` fonksiyonunda, `activity_logs` insert'inden SONRA ekle:

```typescript
    // Notify assignee + reporter
    const { data: project } = await supabase
      .from('projects')
      .select('name, workspace_id')
      .eq('id', issue.project_id)
      .single()

    notifyIssueUpdated(issue.id, project?.workspace_id ?? '', {
      issue_title: issue.title,
      project_name: project?.name ?? '',
      new_status: status,
      old_status: oldStatus,
      assignee_id: issue.assignee_id,
      reporter_id: issue.reporter_id,
    })
```

- [ ] **Step 4: TypeScript kontrolü**

```bash
npx tsc --noEmit 2>&1 | grep "IssueDetailPanel"
```

Beklenen: çıktı yok.

- [ ] **Step 5: Commit**

```bash
git add src/components/issues/IssueDetailPanel.tsx
git commit -m "feat: notify on assignee and status changes"
```

---

## Task 12: IssueCommentThread'de yorum notification

**Files:**
- Modify: `src/components/issues/IssueCommentThread.tsx`

- [ ] **Step 1: Import ekle**

`IssueCommentThread.tsx` dosyasına ekle:

```typescript
import { notifyCommentAdded } from '@/app/actions/notifications'
```

- [ ] **Step 2: Comment insert'inden sonra notification çağır**

`IssueCommentThread.tsx`'de comment başarıyla eklendiğinde (mevcut `if (comment)` bloğu içinde, `setComments` çağrısından sonra) ekle:

Önce dosyada şu satırı bul:

```typescript
    if (comment) {
      useIssueStore.getState().setComments([...useIssueStore.getState().comments, comment as CommentWithAuthor])
```

Bu bloğun sonuna (kapanan `}` den önce) ekle:

```typescript
      // Notify issue participants
      const supabase2 = createClient()
      const { data: issueData } = await supabase2
        .from('issues')
        .select('assignee_id, reporter_id, project:projects(name, workspace_id)')
        .eq('id', issueId)
        .single()

      if (issueData) {
        const project = Array.isArray(issueData.project)
          ? issueData.project[0]
          : issueData.project
        notifyCommentAdded(issueId, project?.workspace_id ?? '', {
          issue_title: issueId,
          project_name: project?.name ?? '',
          comment_preview: newComment.slice(0, 80),
          assignee_id: issueData.assignee_id,
          reporter_id: issueData.reporter_id,
        })
      }
```

- [ ] **Step 3: TypeScript kontrolü**

```bash
npx tsc --noEmit 2>&1 | grep "IssueCommentThread"
```

Beklenen: çıktı yok.

- [ ] **Step 4: Commit**

```bash
git add src/components/issues/IssueCommentThread.tsx
git commit -m "feat: notify on comment added"
```

---

## Task 13: inviteTeamMember'da member_added notification

**Files:**
- Modify: `src/app/actions/workspace.ts`

- [ ] **Step 1: Import ekle**

`workspace.ts` dosyasına ekle:

```typescript
import { notifyMemberAdded } from '@/app/actions/notifications'
```

- [ ] **Step 2: inviteTeamMember'a notification ekle**

`inviteTeamMember` fonksiyonunda, `revalidatePath(...)` satırından hemen önce ekle:

```typescript
  // Notify workspace owners/admins
  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: newProfile } = await adminClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', profile.id)
      .single()

    notifyMemberAdded(
      workspaceId,
      user.id,
      newProfile?.full_name ?? newProfile?.email ?? email
    )
  }
```

- [ ] **Step 3: TypeScript kontrolü**

```bash
npx tsc --noEmit 2>&1 | grep "workspace.ts"
```

Beklenen: çıktı yok.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/workspace.ts
git commit -m "feat: notify admins on member added"
```

---

## Task 14: Uçtan uca doğrulama

- [ ] **Step 1: Dev server'ı başlat**

```bash
npm run dev
```

- [ ] **Step 2: Issue atama testi**

1. Bir issue'yu farklı bir kullanıcıya ata (IssueDetailPanel → Atanan)
2. O kullanıcıyla giriş yap
3. AppHeader'daki zil ikonunda kırmızı `1` badge'i görünmeli
4. Zile tıkla → "X seni Y issue'suna atadı" bildirimi görünmeli
5. Bildirime tıkla → okundu işaretlenir, issue detail panel açılır

- [ ] **Step 3: Status değişikliği testi**

1. Bana atanmış bir issue'nun durumunu değiştir
2. Atayan kişinin hesabında zil badge'i güncellenmeli

- [ ] **Step 4: "Tümünü okundu işaretle" testi**

1. Birden fazla okunmamış bildirim oluştur
2. Panel'de "Tümünü okundu işaretle" butonuna tıkla
3. Tüm bildirimler okundu → badge kaybolmali

- [ ] **Step 5: Final commit**

```bash
git add -A
git commit -m "feat: in-app notifications complete"
```

# In-App Notifications — Design Spec

**Goal:** Kullanıcılara atama, durum değişikliği, yorum ve üye ekleme olaylarında kalıcı, okunabilir in-app bildirimler göstermek.

**Architecture:** Server Actions → `notifications` tablosu (Supabase) → Realtime subscription → Zustand store → Bell UI

**Tech Stack:** Next.js Server Actions, Supabase (PostgreSQL + Realtime), Zustand, `createAdminClient` (service role)

---

## 1. Veritabanı

### `notifications` tablosu

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

### Notification türleri (`type` alanı)

| type | Tetikleyici | Alıcı |
|------|-------------|-------|
| `issue_assigned` | Issue atanınca | Yeni assignee (kendisi değilse) |
| `issue_updated` | Status değişince | Assignee + reporter (actor değilse) |
| `comment_added` | Yorum eklenince | Assignee + reporter (commenter değilse) |
| `member_added` | Workspace'e üye eklenince | Workspace owner ve admin'leri |

### `data` jsonb alanı içeriği

```json
{
  "issue_title": "Login sayfası bug'ı",
  "project_name": "CarDex",
  "new_status": "done",
  "old_status": "in_progress",
  "comment_preview": "Bu bug'ı repro edemedim..."
}
```

---

## 2. Zustand Store

**Dosya:** `src/lib/stores/notification.store.ts`

```ts
interface Notification {
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
  }
  read: boolean
  created_at: string
}

interface NotificationState {
  notifications: Notification[]
  unreadCount: number           // derived: notifications.filter(n => !n.read).length
  setNotifications: (n: Notification[]) => void
  addNotification: (n: Notification) => void
  markRead: (id: string) => void
  markAllRead: () => void
}
```

`unreadCount`, `notifications` değiştiğinde otomatik hesaplanır — ayrı state tutulmaz.

---

## 3. Realtime Subscription

**Dosya:** `src/app/(dashboard)/layout.tsx`

Dashboard layout'u mount olunca:
1. Supabase'den son 50 bildirimi çekip store'a `setNotifications` ile yükler
2. `notifications` tablosunu `user_id=eq.{userId}` filtresiyle dinler
3. INSERT event'inde `addNotification` çağırır
4. Unmount'ta channel temizlenir

```ts
supabase
  .channel(`notifications-${userId}`)
  .on('postgres_changes', {
    event: 'INSERT',
    schema: 'public',
    table: 'notifications',
    filter: `user_id=eq.${userId}`,
  }, (payload) => {
    store.addNotification(payload.new as Notification)
  })
  .subscribe()
```

İlk yükleme sorgusu:
```ts
supabase
  .from('notifications')
  .select('*, actor:profiles!actor_id(full_name, avatar_url)')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(50)
```

---

## 4. Server Actions Entegrasyonu

**Dosya:** `src/app/actions/board.ts` ve `src/app/actions/workspace.ts`

Tüm notification insert'leri `createAdminClient()` ile yapılır (RLS bypass). Bildirimler fire-and-forget — hata olursa ana işlem etkilenmez.

### `board.ts` — `updateIssueAssignee`

```ts
if (newAssigneeId && newAssigneeId !== actorId) {
  await adminClient.from('notifications').insert({
    user_id: newAssigneeId,
    actor_id: actorId,
    type: 'issue_assigned',
    issue_id: issueId,
    workspace_id: workspaceId,
    data: { issue_title, project_name },
  })
}
```

### `board.ts` — `updateIssueStatus`

Assignee ve reporter'a bildirim gönderilir (actor hariç, dedup ile):

```ts
const recipients = [...new Set([assigneeId, reporterId])]
  .filter(id => id && id !== actorId)

if (recipients.length > 0) {
  await adminClient.from('notifications').insert(
    recipients.map(user_id => ({
      user_id,
      actor_id: actorId,
      type: 'issue_updated',
      issue_id: issueId,
      workspace_id: workspaceId,
      data: { issue_title, project_name, old_status, new_status },
    }))
  )
}
```

### `board.ts` — `createComment`

Assignee ve reporter'a bildirim (commenter hariç):

```ts
data: { issue_title, project_name, comment_preview: comment.slice(0, 80) }
```

### `workspace.ts` — `inviteTeamMember`

Workspace owner ve admin'lerine bildirim:

```ts
data: { member_name: newMember.full_name ?? newMember.email }
```

---

## 5. UI Bileşenleri

### Dosya yapısı

```
src/components/notifications/
  NotificationBell.tsx    — AppHeader'daki zil butonu + unread badge
  NotificationPanel.tsx   — Dropdown panel (280px)
  NotificationItem.tsx    — Tek bildirim satırı
```

### `NotificationBell`

- `unreadCount > 0` → kırmızı badge (`9+` cap'li)
- Tıklanınca `NotificationPanel` açılır/kapanır
- AppHeader'daki mevcut `<Bell>` butonunu replace eder

### `NotificationPanel`

- Başlık: "Bildirimler" + "Tümünü okundu işaretle" butonu
- Bildirim listesi: son 50, `created_at DESC`
- Okunmamış satırlar: `bg-muted/60` arka plan
- Boş durum: "Henüz bildirim yok" mesajı
- Tıklanınca: `markRead(id)` + issue varsa `setSelectedIssue` açar

### `NotificationItem`

```
[Avatar]  [actor] seni "[issue_title]" issue'suna atadı    2dk önce
                                                           ● (okunmamış)
```

Metin `type`'a göre üretilir:
- `issue_assigned` → "X seni Y'ye atadı"
- `issue_updated` → "X, Y'nin durumunu Z olarak değiştirdi"
- `comment_added` → "X, Y'ye yorum yaptı"
- `member_added` → "X workspace'e katıldı"

---

## 6. Okundu İşaretleme

- **Tek bildirim:** Panel'de satıra tıklanınca → `supabase.from('notifications').update({ read: true }).eq('id', id)` + store güncelleme
- **Tümünü okundu:** "Tümünü okundu işaretle" → `update({ read: true }).eq('user_id', userId).eq('read', false)` + `markAllRead()`

---

## Kapsam Dışı

- Email bildirimleri
- Push notification (mobil/desktop)
- Bildirim tercihleri (hangi olaylar için bildirim)
- Bildirim silme

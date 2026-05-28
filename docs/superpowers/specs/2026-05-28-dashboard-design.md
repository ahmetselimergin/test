# Dashboard Design Spec

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the workspace landing page (`/{workspace}`) with a rich dashboard showing project progress, personal quick stats, and a workspace activity feed — all rendered server-side with Framer Motion animations.

**Architecture:** Pure Server Component page fetches all data in parallel. Three new client-only leaf components handle Framer Motion animations (number count-up, stagger entrance). Activity feed is powered by a Supabase DB trigger that writes `activity_logs` rows whenever an issue's status or priority changes.

**Tech Stack:** Next.js 16 App Router (server components), Supabase (server client), Framer Motion v12, Tailwind CSS + existing CSS token system (`rgb(var(--token))`).

---

## 1. Route Change

`src/app/(dashboard)/[workspace]/page.tsx` is completely rewritten. The existing logic (redirect to `/projects` if projects exist, otherwise show "create first project" form) is **replaced** by the dashboard. The "create first project" empty state becomes a card inside the dashboard when `projects.length === 0`.

The sidebar's "All projects" link (`/{workspace}/projects`) continues to work as before — that page is not touched.

---

## 2. Database — Activity Trigger

**New migration:** `supabase/migrations/006_activity_trigger.sql`

```sql
CREATE OR REPLACE FUNCTION log_issue_activity()
RETURNS TRIGGER AS $$
BEGIN
  -- Status change
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO activity_logs (issue_id, actor_id, action, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'status_changed', OLD.status, NEW.status);
  END IF;
  -- Priority change
  IF OLD.priority IS DISTINCT FROM NEW.priority THEN
    INSERT INTO activity_logs (issue_id, actor_id, action, old_value, new_value)
    VALUES (NEW.id, auth.uid(), 'priority_changed', OLD.priority, NEW.priority);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER issues_activity_logger
AFTER UPDATE ON issues
FOR EACH ROW EXECUTE FUNCTION log_issue_activity();
```

New issue inserts are logged from the `createIssue` server action — not via trigger. This is intentional: `auth.uid()` inside a DB trigger is unreliable when called from Next.js server actions (the session may not propagate). The trigger uses `SECURITY DEFINER` but still depends on the PostgREST auth context; if `auth.uid()` returns null the row is inserted with `actor_id = null`, which is acceptable. The `createIssue` server action already has `user.id` and passes it directly when inserting the `activity_logs` row for new issues.

---

## 3. Data Fetching (page.tsx)

All queries run in parallel with `Promise.all`. The page is `async` and uses the Supabase server client.

```ts
const [workspace, projects, assignedCount, doneToday, criticalBugs, activity] =
  await Promise.all([
    // workspace row
    supabase.from('workspaces').select('*').eq('slug', slug).single(),

    // projects with issue counts
    supabase.from('projects').select(`
      id, name, key, color,
      issues(count),
      done_issues:issues(count).eq(status, done)
    `).eq('workspace_id', workspace.id),

    // "Bana Atanan" count
    supabase.from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('assignee_id', user.id)
      .neq('status', 'done'),

    // "Bugün Biten" count
    supabase.from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'done')
      .gte('updated_at', startOfToday),

    // "Kritik Bug" count
    supabase.from('issues')
      .select('id', { count: 'exact', head: true })
      .eq('priority', 'critical')
      .eq('type', 'bug')
      .neq('status', 'done'),

    // Activity feed — last 24h, max 20 rows
    supabase.from('activity_logs')
      .select('*, issue:issues(title, project_id), actor:profiles(full_name, avatar_url)')
      .gte('created_at', twentyFourHoursAgo)
      .order('created_at', { ascending: false })
      .limit(20),
  ])
```

> Note: Supabase JS v2 does not support inline `.eq()` chaining on embedded resource counts. The actual implementation uses two separate queries per project (total issues + done issues) grouped client-side. See implementation plan for the exact query pattern.

**Quick stat navigation links:**
| Stat | Link |
|------|------|
| Bana Atanan | `/{slug}/{firstProjectId}/backlog?assignee=me` |
| Bugün Biten | `/{slug}/{firstProjectId}/backlog?status=done&since=today` |
| Kritik Bug | `/{slug}/{firstProjectId}/backlog?priority=critical&type=bug` |

`firstProjectId` = the project with the earliest `created_at` among workspace projects (i.e. `projects.sort((a,b) => a.created_at.localeCompare(b.created_at))[0]?.id`). If no projects exist, stat cards are not rendered (empty state card shown instead).

The backlog filter implementation is part of the "Kanban Board UX" sub-project spec. For now the links are correct URL params — backlog page ignores them until that spec is implemented.

---

## 4. Components

### `src/app/(dashboard)/[workspace]/page.tsx`
Server component. Fetches data, passes props to child components. Renders the full dashboard layout.

### `src/components/dashboard/DashboardHero.tsx`
**Client component** (needs `'use client'` for Framer Motion).

Props:
```ts
interface DashboardHeroProps {
  userName: string          // from profile.full_name ?? email
  assignedCount: number
  doneTodayCount: number
  criticalBugCount: number
  assignedHref: string
  doneTodayHref: string
  criticalBugHref: string
}
```

Renders:
- Gradient hero banner (`linear-gradient(135deg, #1e1b4b → #0f0e1a → bg)`)
- Date line + greeting h1 + subtitle
- Three stat cards as `<Link>` elements with `motion.div` count-up animation on mount
- Stat card colours: indigo (assigned), emerald (done), rose (critical bugs)

Count-up animation: `useEffect` drives a local `displayed` state from 0 → target over 600ms using `requestAnimationFrame`.

### `src/components/dashboard/ProjectCard.tsx`
**Server component.**

Props:
```ts
interface ProjectCardProps {
  project: Project
  totalIssues: number
  doneIssues: number
  workspaceSlug: string
}
```

Renders a horizontal card (`<Link href="/{slug}/{project.id}/board">`):
- Left: coloured square showing `project.key.slice(0, 2)` (max 2 chars, uppercase)
- Middle: project name + animated progress bar (CSS transition, no JS needed)
- Right: percentage badge coloured to match project color

Progress bar fill: `(doneIssues / totalIssues * 100).toFixed(0)%` — clipped to 100.

### `src/components/dashboard/ActivityFeed.tsx`
**Server component.**

Props:
```ts
interface ActivityFeedProps {
  items: ActivityItem[]   // from activity_logs join
}

interface ActivityItem {
  id: string
  action: 'status_changed' | 'priority_changed' | 'issue_created'
  old_value: string | null
  new_value: string | null
  created_at: string
  issue: { title: string; project_id: string } | null
  actor: { full_name: string | null; avatar_url: string | null } | null
}
```

Renders a vertical timeline:
- Coloured dot per action type: `status_changed → done` = emerald, `status_changed → in_progress` = indigo, `priority_changed → critical` = rose, `issue_created` = emerald, other = slate
- Vertical connector line between dots
- Human-readable label: `"${issue.title}" ${newStatusLabel}'a taşındı`
- Relative time: `2 dakika önce`, `1 saat önce` etc. using a `timeAgo(date: string): string` helper added to `src/lib/utils.ts`
- Actor name in secondary text

Empty state (no activity in last 24h): "Henüz aktivite yok. Issue'ları taşıyınca burada görünür."

---

## 5. Layout Structure

```
/{workspace} page
├── DashboardHero           (client — gradient banner + 3 stat cards)
└── div.flex (main content area, flex-row)
    ├── div.flex-[3]        (project list)
    │   ├── header row      ("Projeler" label + "Tümünü gör →" link)
    │   └── ProjectCard[]   (one per project, server)
    └── div.flex-[2]        (activity feed, border-left)
        ├── header row      ("Son 24 Saat" label)
        └── ActivityFeed    (server)
```

Empty state when `projects.length === 0`: render a centered "Create your first project" card (same as current `/{workspace}/page.tsx` content) inside the project list area instead of the project cards.

---

## 6. Animations

All Framer Motion usage is isolated to `DashboardHero` (client component only).

| Element | Animation |
|---------|-----------|
| Hero banner | `motion.div` fade-in + slide-up on mount (`initial: {opacity:0, y:12}`, `animate: {opacity:1, y:0}`, duration 0.4s) |
| Stat numbers | Count-up via `requestAnimationFrame` from 0 → value over 600ms |
| Stat cards | Stagger: each card delays by 100ms (`transition: { delay: index * 0.1 }`) |

Project cards and activity items are server-rendered — no JS animation. CSS `transition` on progress bar fill gives a smooth paint.

---

## 7. Empty & Error States

| Scenario | Behaviour |
|----------|-----------|
| No workspace found | `redirect('/')` |
| No projects | "Create your first project" card inside project list column |
| No activity in 24h | Placeholder text in activity feed |
| User has no assigned issues | Stat card shows `0`, link still works |
| Activity logs query fails | Feed shows "Aktivite yüklenemedi" — page does not crash |

# Dashboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the `/{workspace}` landing page with a rich dashboard showing a hero banner with personal quick stats, a project progress list, and a workspace activity feed — all server-rendered with Framer Motion animations.

**Architecture:** Pure Next.js Server Component page fetches all data in parallel (projects, issue counts, quick stats, activity). Three new client/server leaf components render the UI. A Supabase DB trigger automatically writes `activity_logs` rows when issues are updated; new-issue creation is logged from the existing server action. All Framer Motion usage is isolated to `DashboardHero` (the only `'use client'` component).

**Tech Stack:** Next.js 16 App Router, Supabase JS v2 (server client), Framer Motion (`framer-motion`), Tailwind CSS + existing `rgb(var(--token))` CSS token system.

---

## File Map

| Action | File |
|--------|------|
| Create | `supabase/migrations/006_activity_trigger.sql` |
| Modify | `src/lib/utils.ts` — add `timeAgo()` |
| Create | `src/components/dashboard/ActivityFeed.tsx` |
| Create | `src/components/dashboard/ProjectCard.tsx` |
| Create | `src/components/dashboard/DashboardHero.tsx` |
| Rewrite | `src/app/(dashboard)/[workspace]/page.tsx` |
| Modify | `src/app/actions/board.ts` — add activity log in `createIssue` |

---

### Task 1: DB Migration — Activity Trigger + INSERT Policy

**Files:**
- Create: `supabase/migrations/006_activity_trigger.sql`

- [ ] **Step 1: Create the migration file**

```sql
-- supabase/migrations/006_activity_trigger.sql

-- Allow authenticated users to insert activity logs (used by server actions)
create policy "activity_logs_insert"
  on activity_logs for insert
  with check (actor_id = auth.uid());

-- Function: fires after any issue UPDATE, logs status/priority changes
create or replace function log_issue_activity()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into activity_logs (issue_id, actor_id, action, old_value, new_value)
    values (new.id, auth.uid(), 'status_changed', old.status, new.status);
  end if;
  if old.priority is distinct from new.priority then
    insert into activity_logs (issue_id, actor_id, action, old_value, new_value)
    values (new.id, auth.uid(), 'priority_changed', old.priority, new.priority);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger issues_activity_logger
  after update on issues
  for each row execute function log_issue_activity();
```

- [ ] **Step 2: Apply the migration**

If using Supabase CLI:
```bash
supabase db push
```

If using Supabase dashboard: open SQL editor, paste the file contents, and run.

Verify in Supabase dashboard → Database → Triggers: you should see `issues_activity_logger` on the `issues` table.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/006_activity_trigger.sql
git commit -m "feat: add activity_logs trigger and INSERT policy"
```

---

### Task 2: `timeAgo` Helper

**Files:**
- Modify: `src/lib/utils.ts`

- [ ] **Step 1: Add the function to the end of `src/lib/utils.ts`**

Append after the last existing export (`formatIssueId`):

```ts
export function timeAgo(dateString: string): string {
  const seconds = Math.floor((Date.now() - new Date(dateString).getTime()) / 1000)
  if (seconds < 60) return 'az önce'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${minutes} dakika önce`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} saat önce`
  const days = Math.floor(hours / 24)
  return `${days} gün önce`
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors related to `utils.ts`.

- [ ] **Step 3: Commit**

```bash
git add src/lib/utils.ts
git commit -m "feat: add timeAgo utility"
```

---

### Task 3: ActivityFeed Component

**Files:**
- Create: `src/components/dashboard/ActivityFeed.tsx`

- [ ] **Step 1: Create the file**

```tsx
import { timeAgo } from '@/lib/utils'

export interface ActivityItem {
  id: string
  action: string
  old_value: string | null
  new_value: string | null
  created_at: string
  issue: { title: string; project_id: string } | null
  actor: { full_name: string | null; avatar_url: string | null } | null
}

interface ActivityFeedProps {
  items: ActivityItem[]
}

const STATUS_LABELS: Record<string, string> = {
  todo: 'Todo',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
}

const PRIORITY_LABELS: Record<string, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

function dotColor(action: string, newValue: string | null): string {
  if (action === 'status_changed') {
    if (newValue === 'done') return 'bg-emerald-500 border-emerald-800'
    if (newValue === 'in_progress') return 'bg-indigo-500 border-indigo-800'
    if (newValue === 'review') return 'bg-amber-500 border-amber-800'
    return 'bg-slate-500 border-slate-700'
  }
  if (action === 'priority_changed' && newValue === 'critical') return 'bg-rose-500 border-rose-800'
  if (action === 'issue_created') return 'bg-emerald-500 border-emerald-800'
  return 'bg-slate-500 border-slate-700'
}

function itemLabel(item: ActivityItem): string {
  const title = item.issue?.title ?? 'Issue'
  if (item.action === 'status_changed') {
    return `"${title}" ${STATUS_LABELS[item.new_value ?? ''] ?? item.new_value}'a taşındı`
  }
  if (item.action === 'priority_changed') {
    return `"${title}" ${PRIORITY_LABELS[item.new_value ?? ''] ?? item.new_value} önceliğe alındı`
  }
  if (item.action === 'issue_created') {
    return `"${title}" oluşturuldu`
  }
  return `"${title}" güncellendi`
}

export function ActivityFeed({ items }: ActivityFeedProps) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-muted py-4">
        Henüz aktivite yok. Issue&apos;ları taşıyınca burada görünür.
      </p>
    )
  }

  return (
    <div className="flex flex-col">
      {items.map((item, i) => (
        <div key={item.id} className="flex gap-2.5">
          <div className="flex flex-col items-center pt-0.5 shrink-0">
            <span className={`size-2 rounded-full border-2 shrink-0 ${dotColor(item.action, item.new_value)}`} />
            {i < items.length - 1 && (
              <span className="w-px flex-1 bg-[rgb(var(--border))] mt-1" />
            )}
          </div>
          <div className="pb-3.5 min-w-0">
            <p className="text-[12.5px] text-foreground/80 font-medium leading-snug">
              {itemLabel(item)}
            </p>
            <p className="text-[11px] text-muted mt-0.5">
              {timeAgo(item.created_at)}
              {item.actor?.full_name ? ` · ${item.actor.full_name}` : ''}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "ActivityFeed"
```

Expected: no output (no errors).

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ActivityFeed.tsx
git commit -m "feat: add ActivityFeed component"
```

---

### Task 4: ProjectCard Component

**Files:**
- Create: `src/components/dashboard/ProjectCard.tsx`

- [ ] **Step 1: Create the file**

```tsx
import Link from 'next/link'
import type { Project } from '@/lib/supabase/types'

interface ProjectCardProps {
  project: Project
  totalIssues: number
  doneIssues: number
  workspaceSlug: string
}

export function ProjectCard({ project, totalIssues, doneIssues, workspaceSlug }: ProjectCardProps) {
  const pct = totalIssues > 0 ? Math.min(100, Math.round((doneIssues / totalIssues) * 100)) : 0

  return (
    <Link
      href={`/${workspaceSlug}/${project.id}/board`}
      className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl border border-subtle bg-[rgb(var(--bg-subtle)/0.4)] hover:border-strong hover:bg-[rgb(var(--bg-subtle))] transition-all group"
    >
      <div
        className="size-10 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
        style={{ backgroundColor: project.color }}
      >
        {project.key.slice(0, 2)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] font-semibold text-foreground group-hover:text-accent transition-colors truncate">
            {project.name}
          </span>
          <span className="text-[11px] text-muted shrink-0 ml-2 tabular-nums">
            {doneIssues} / {totalIssues}
          </span>
        </div>
        <div className="h-[3px] bg-[rgb(var(--bg-muted))] rounded-full overflow-hidden">
          <div
            className="h-[3px] rounded-full transition-all duration-700"
            style={{ width: `${pct}%`, backgroundColor: project.color }}
          />
        </div>
      </div>

      <span
        className="text-[11px] font-bold shrink-0 px-2 py-0.5 rounded-md border tabular-nums"
        style={{
          color: project.color,
          backgroundColor: `${project.color}18`,
          borderColor: `${project.color}30`,
        }}
      >
        {pct}%
      </span>
    </Link>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "ProjectCard"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/ProjectCard.tsx
git commit -m "feat: add ProjectCard component with progress bar"
```

---

### Task 5: DashboardHero Client Component

**Files:**
- Create: `src/components/dashboard/DashboardHero.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'

interface DashboardHeroProps {
  userName: string
  assignedCount: number
  doneTodayCount: number
  criticalBugCount: number
  assignedHref: string
  doneTodayHref: string
  criticalBugHref: string
}

function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0)
  const rafRef = useRef<number | null>(null)

  useEffect(() => {
    const start = performance.now()
    function tick(now: number) {
      const progress = Math.min((now - start) / duration, 1)
      setValue(Math.round(progress * target))
      if (progress < 1) rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => { if (rafRef.current !== null) cancelAnimationFrame(rafRef.current) }
  }, [target, duration])

  return value
}

interface StatCardProps {
  count: number
  label: string
  emoji: string
  bgColor: string
  borderColor: string
  textColor: string
  href: string
  delay: number
}

function StatCard({ count, label, emoji, bgColor, borderColor, textColor, href, delay }: StatCardProps) {
  const displayed = useCountUp(count)
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay }}
      className="flex-1"
    >
      <Link
        href={href}
        className="flex items-center gap-3.5 px-4 py-4 rounded-xl border transition-all hover:brightness-110 block"
        style={{ background: bgColor, borderColor }}
      >
        <div
          className="size-10 rounded-xl flex items-center justify-center text-xl shrink-0"
          style={{ background: bgColor }}
        >
          {emoji}
        </div>
        <div>
          <div
            className="text-[28px] font-extrabold leading-none tracking-tight tabular-nums"
            style={{ color: textColor }}
          >
            {displayed}
          </div>
          <div className="text-[11px] text-muted mt-1 font-medium">{label}</div>
        </div>
      </Link>
    </motion.div>
  )
}

export function DashboardHero({
  userName,
  assignedCount,
  doneTodayCount,
  criticalBugCount,
  assignedHref,
  doneTodayHref,
  criticalBugHref,
}: DashboardHeroProps) {
  const today = new Date().toLocaleDateString('tr-TR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const firstName = userName.split(' ')[0]

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden border-b border-subtle px-8 py-7 shrink-0"
      style={{
        background: 'linear-gradient(135deg, #1e1b4b 0%, #0f0e1a 60%, rgb(var(--bg)) 100%)',
      }}
    >
      {/* Ambient glow orbs */}
      <div
        className="pointer-events-none absolute -top-10 -left-10 size-48 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)' }}
      />
      <div
        className="pointer-events-none absolute top-5 right-20 size-36 rounded-full"
        style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)' }}
      />

      <p className="text-[11px] font-semibold uppercase tracking-widest mb-1 relative" style={{ color: '#6366f1' }}>
        {today}
      </p>
      <h1 className="text-[22px] font-bold tracking-tight mb-1 relative" style={{ color: '#f0f0f8' }}>
        Hoşgeldin, {firstName} 👋
      </h1>
      <p className="text-[13px] text-muted mb-6 relative">
        Workspace&apos;indeki son durumu buradan takip edebilirsin
      </p>

      <div className="flex gap-3 relative">
        <StatCard
          count={assignedCount}
          label="Bana Atanan"
          emoji="📋"
          bgColor="rgba(99,102,241,0.18)"
          borderColor="rgba(99,102,241,0.3)"
          textColor="#818cf8"
          href={assignedHref}
          delay={0.1}
        />
        <StatCard
          count={doneTodayCount}
          label="Bugün Biten"
          emoji="✅"
          bgColor="rgba(16,185,129,0.15)"
          borderColor="rgba(16,185,129,0.25)"
          textColor="#34d399"
          href={doneTodayHref}
          delay={0.2}
        />
        <StatCard
          count={criticalBugCount}
          label="Kritik Bug"
          emoji="🐛"
          bgColor="rgba(244,63,94,0.15)"
          borderColor="rgba(244,63,94,0.25)"
          textColor="#fb7185"
          href={criticalBugHref}
          delay={0.3}
        />
      </div>
    </motion.div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "DashboardHero"
```

Expected: no output.

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/DashboardHero.tsx
git commit -m "feat: add DashboardHero client component with count-up animation"
```

---

### Task 6: Dashboard Page — Rewrite `[workspace]/page.tsx`

**Files:**
- Rewrite: `src/app/(dashboard)/[workspace]/page.tsx`

- [ ] **Step 1: Replace the entire file content**

```tsx
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DashboardHero } from '@/components/dashboard/DashboardHero'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import type { ActivityItem } from '@/components/dashboard/ActivityFeed'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'

export default async function WorkspaceDashboard({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace: slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: workspace }, { data: profile }] = await Promise.all([
    supabase.from('workspaces').select('*').eq('slug', slug).single(),
    supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
  ])

  if (!workspace) redirect('/')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true })

  const projectList = projects ?? []
  const firstProjectId = projectList[0]?.id ?? null

  // Per-project issue counts (two queries each, in parallel)
  const issueCounts = await Promise.all(
    projectList.map(async (project) => {
      const [{ count: total }, { count: done }] = await Promise.all([
        supabase
          .from('issues')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id),
        supabase
          .from('issues')
          .select('*', { count: 'exact', head: true })
          .eq('project_id', project.id)
          .eq('status', 'done'),
      ])
      return { projectId: project.id, total: total ?? 0, done: done ?? 0 }
    })
  )

  // Quick stats
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [
    { count: assignedCount },
    { count: doneTodayCount },
    { count: criticalBugCount },
  ] = await Promise.all([
    supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('assignee_id', user.id)
      .neq('status', 'done'),
    supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'done')
      .gte('updated_at', startOfToday.toISOString()),
    supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('priority', 'critical')
      .eq('type', 'bug')
      .neq('status', 'done'),
  ])

  // Activity feed — last 24 hours
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  const { data: rawActivity } = await supabase
    .from('activity_logs')
    .select('*, issue:issues(title, project_id), actor:profiles(full_name, avatar_url)')
    .gte('created_at', since)
    .order('created_at', { ascending: false })
    .limit(20)

  const activityItems: ActivityItem[] = (rawActivity ?? []).map((row) => ({
    id: row.id,
    action: row.action,
    old_value: row.old_value,
    new_value: row.new_value,
    created_at: row.created_at,
    issue: Array.isArray(row.issue) ? row.issue[0] ?? null : row.issue,
    actor: Array.isArray(row.actor) ? row.actor[0] ?? null : row.actor,
  }))

  const userName = profile?.full_name ?? profile?.email ?? 'Kullanıcı'

  const heroHref = (path: string) =>
    firstProjectId ? `/${slug}/${firstProjectId}${path}` : '#'

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <DashboardHero
        userName={userName}
        assignedCount={assignedCount ?? 0}
        doneTodayCount={doneTodayCount ?? 0}
        criticalBugCount={criticalBugCount ?? 0}
        assignedHref={heroHref('/backlog?assignee=me')}
        doneTodayHref={heroHref('/backlog?status=done&since=today')}
        criticalBugHref={heroHref('/backlog?priority=critical&type=bug')}
      />

      <div className="flex flex-1 min-h-0">
        {/* Projects list */}
        <div className="flex-[3] overflow-y-auto p-6 border-r border-subtle">
          <div className="flex items-center justify-between mb-4">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-accent">
              Projeler
            </p>
            <Link href={`/${slug}/projects`} className="text-[11px] text-accent hover:underline">
              Tümünü gör →
            </Link>
          </div>

          {projectList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center border border-dashed border-subtle rounded-xl">
              <p className="text-muted mb-4 text-sm">
                Henüz proje yok. İlk projeyi oluştur.
              </p>
              <CreateProjectDialog workspaceId={workspace.id} />
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              {projectList.map((project) => {
                const counts = issueCounts.find((c) => c.projectId === project.id)
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    totalIssues={counts?.total ?? 0}
                    doneIssues={counts?.done ?? 0}
                    workspaceSlug={slug}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="flex-[2] overflow-y-auto p-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-accent mb-4">
            Son 24 Saat
          </p>
          <ActivityFeed items={activityItems} />
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | head -30
```

Expected: zero errors. If `Supabase join returns array` type errors appear on `row.issue` / `row.actor`, the `.map()` normalization (`Array.isArray(row.issue) ? row.issue[0] : row.issue`) handles it.

- [ ] **Step 3: Build**

```bash
npx next build 2>&1 | tail -15
```

Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Commit**

```bash
git add src/app/(dashboard)/[workspace]/page.tsx
git commit -m "feat: dashboard page — hero + project list + activity feed"
```

---

### Task 7: Wire `createIssue` to Log New Issue Activity

**Files:**
- Modify: `src/app/actions/board.ts` (lines 108–131)

- [ ] **Step 1: Find the correct insertion point**

In `src/app/actions/board.ts`, locate the block after the `issues` insert succeeds:

```ts
  if (error) return { error: error.message }

  revalidatePath(`/${workspaceSlug}/${projectId}/board`)
  return { success: true, issue }
```

Add the activity log insert between the error guard and `revalidatePath`:

```ts
  if (error) return { error: error.message }

  // Log new-issue activity (trigger only fires on UPDATE; INSERT must be logged here)
  await supabase.from('activity_logs').insert({
    issue_id: issue.id,
    actor_id: user.id,
    action: 'issue_created',
    old_value: null,
    new_value: null,
  })

  revalidatePath(`/${workspaceSlug}/${projectId}/board`)
  return { success: true, issue }
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit 2>&1 | grep "board.ts"
```

Expected: no output.

- [ ] **Step 3: Build**

```bash
npx next build 2>&1 | tail -10
```

Expected: `✓ Compiled successfully`.

- [ ] **Step 4: Commit**

```bash
git add src/app/actions/board.ts
git commit -m "feat: log issue_created activity in createIssue server action"
```

---

### Task 8: End-to-End Verification

**Files:** None (verification only)

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

- [ ] **Step 2: Open `http://localhost:3000` and log in**

Navigate to your workspace. You should land on the dashboard (not the projects list).

Expected:
- Hero banner with gradient, your name, today's date
- Three stat cards with count-up animation (numbers tick up from 0)
- Project list with coloured keys, progress bars, and percentage badges
- Activity feed on the right (empty if no issues moved yet)

- [ ] **Step 3: Create an issue, then move it to Done**

On the Kanban board, drag a card to the "Done" column (or create a new one and drag it).

Return to the dashboard. Refresh the page.

Expected: the moved issue appears in the activity feed as `"Issue title" Done'a taşındı`.

- [ ] **Step 4: Verify empty state**

If you have no projects, the project list column should show the "Create your first project" card with the `CreateProjectDialog` button.

- [ ] **Step 5: Final build check**

```bash
npx next build 2>&1 | tail -10
```

Expected: `✓ Compiled successfully`.

# Figma Dark Core Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Elevate FlowTrack's visual design to a premium, Figma-like aesthetic — neutral gray-black tokens, compact layout, high-information-density components, and refined motion.

**Architecture:** Pure CSS/UI changes across 13 files. No store, schema, or routing changes. Each task targets a specific component layer: tokens → layout → board → panels → auth → dialogs. Changes cascade top-down (tokens first, components after).

**Tech Stack:** Tailwind v4, Framer Motion, shadcn/ui, Next.js App Router

**Spec:** `docs/superpowers/specs/2026-05-25-figma-dark-core-design.md`

**Dev server:** `npm run dev` — runs on `http://localhost:3000`

---

## File Map

| File | Task | Change |
|---|---|---|
| `src/app/globals.css` | 1 | Token values, board grid, global easing |
| `src/components/layout/Sidebar.tsx` | 2 | Size, spacing, active state indicator |
| `src/components/layout/AppHeader.tsx` | 3 | Height, blur, button sizes |
| `src/components/board/BoardColumn.tsx` | 4 | Width, header, drop zone |
| `src/components/board/AddColumnButton.tsx` | 4 | Width to match column |
| `src/components/issues/IssueCard.tsx` | 5 | Padding, font, hover, motion |
| `src/components/issues/IssueDetailPanel.tsx` | 6 | Header height, backdrop, spring |
| `src/components/issues/IssuePropertyRow.tsx` | 6 | Grid layout, spacing |
| `src/app/(auth)/layout.tsx` | 7 | Left panel bg, line grid, tagline |
| `src/app/(auth)/login/page.tsx` | 8 | Remove Card, input border, title |
| `src/app/(auth)/register/page.tsx` | 8 | Same as login |
| `src/components/board/CreateIssueDialog.tsx` | 9 | Input tokens, mount animation |
| `src/components/layout/Providers.tsx` | 9 | Toast style |

---

## Task 1: CSS Token System

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: Update dark mode tokens**

Replace the entire `:root` and `.dark` blocks in `src/app/globals.css`:

```css
@layer base {
  :root {
    --bg: 248 248 250;
    --bg-elevated: 255 255 255;
    --bg-card: 255 255 255;
    --bg-subtle: 241 245 249;
    --bg-muted: 228 228 231;
    --border: 228 228 231;
    --border-strong: 161 161 170;
    --text: 9 9 11;
    --text-muted: 113 113 122;
    --accent: 99 102 241;
    --accent-hover: 79 70 229;
    --accent-muted: 238 242 255;
    --sidebar-w: 220px;
    --header-h: 44px;
    --radius-lg: 10px;
    --shadow-panel: 0 8px 30px rgba(9, 9, 11, 0.08);
  }

  .dark {
    --bg: 8 8 10;
    --bg-elevated: 16 16 20;
    --bg-card: 22 22 28;
    --bg-subtle: 13 13 16;
    --bg-muted: 34 34 42;
    --border: 38 38 46;
    --border-strong: 58 58 68;
    --text: 248 248 250;
    --text-muted: 120 120 132;
    --accent: 99 102 241;
    --accent-hover: 129 140 248;
    --accent-muted: 30 27 75;
    --shadow-panel: 0 16px 48px rgba(0, 0, 0, 0.5);
  }

  * {
    border-color: rgb(var(--border));
    transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  }

  body {
    background-color: rgb(var(--bg));
    color: rgb(var(--text));
    font-family: var(--font-inter), system-ui, sans-serif;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }

  code,
  .font-mono {
    font-family: var(--font-mono), ui-monospace, monospace;
  }
}
```

- [ ] **Step 2: Replace board background utility**

Find the `.grid-board-bg` class in the `@layer utilities` block and replace it:

```css
  .grid-board-bg {
    background-image:
      linear-gradient(rgb(var(--border) / 0.4) 1px, transparent 1px),
      linear-gradient(90deg, rgb(var(--border) / 0.4) 1px, transparent 1px);
    background-size: 24px 24px;
  }
```

- [ ] **Step 3: Verify visually**

Run `npm run dev`, open `http://localhost:3000`. Toggle dark/light mode.
Expected: Background slightly darker, borders more subtle, sidebar narrower (220px), header shorter (44px).

- [ ] **Step 4: Commit**

```bash
git add src/app/globals.css
git commit -m "style: Figma Dark Core token system — darker bg, tighter layout vars, line grid"
```

---

## Task 2: Sidebar

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Replace Sidebar component**

Replace the entire contents of `src/components/layout/Sidebar.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  Kanban,
  ListTodo,
  Timer,
  Map,
  LogOut,
  FolderKanban,
  Users,
  Settings,
  LayoutGrid,
  User,
  ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/actions/auth'
import { useWorkspaceStore } from '@/lib/stores/workspace.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { Button } from '@/components/ui/button'

const projectViews = [
  { label: 'Board', icon: Kanban, href: 'board' },
  { label: 'Backlog', icon: ListTodo, href: 'backlog' },
  { label: 'Sprints', icon: Timer, href: 'sprint' },
  { label: 'Roadmap', icon: Map, href: 'roadmap' },
]

const workspaceLinks = [
  { label: 'All projects', icon: LayoutGrid, href: 'projects' },
  { label: 'Team', icon: Users, href: 'team' },
  { label: 'Settings', icon: Settings, href: 'settings' },
]

function NavLink({
  href,
  icon: Icon,
  label,
  active,
}: {
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
  active: boolean
}) {
  return (
    <Link
      href={href}
      className={cn(
        'flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] font-medium transition-colors relative',
        active
          ? 'text-accent bg-subtle/60'
          : 'text-muted hover:text-foreground hover:bg-subtle/60'
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-accent rounded-r-full" />
      )}
      <Icon size={15} className={active ? 'text-accent' : 'opacity-70'} />
      {label}
    </Link>
  )
}

export function Sidebar() {
  const pathname = usePathname()
  const workspace = useWorkspaceStore((s) => s.currentWorkspace)
  const projects = useProjectStore((s) => s.projects)
  const currentProject = useProjectStore((s) => s.currentProject)
  const slug = workspace?.slug

  return (
    <aside className="w-[var(--sidebar-w)] h-screen border-r border-subtle bg-subtle/30 flex flex-col shrink-0">
      <div className="h-[var(--header-h)] flex items-center gap-2 px-3 border-b border-subtle">
        <Link
          href={slug ? `/${slug}/projects` : '/'}
          className="flex items-center gap-2 min-w-0"
        >
          <div className="size-7 rounded-lg bg-accent flex items-center justify-center shadow-sm shrink-0">
            <FolderKanban size={14} className="text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold truncate leading-tight">
              {workspace?.name ?? 'FlowTrack'}
            </p>
            <p className="text-[10px] text-muted uppercase tracking-wider">
              Workspace
            </p>
          </div>
        </Link>
      </div>

      <div className="flex-1 overflow-y-auto p-2.5 space-y-5">
        {slug && (
          <div>
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted">
              Workspace
            </p>
            <nav className="space-y-0.5">
              {workspaceLinks.map((item) => {
                const href = `/${slug}/${item.href}`
                const active =
                  pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <NavLink
                    key={item.href}
                    href={href}
                    icon={item.icon}
                    label={item.label}
                    active={active}
                  />
                )
              })}
            </nav>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
              Projects
            </p>
            {slug && (
              <Link
                href={`/${slug}/projects`}
                className="text-[10px] text-accent hover:underline"
              >
                View all
              </Link>
            )}
          </div>
          <nav className="space-y-0.5">
            {projects.length === 0 && (
              <p className="px-2 text-xs text-muted">No projects yet</p>
            )}
            {projects.map((project) => {
              const isActive = currentProject?.id === project.id
              const boardHref = `/${slug}/${project.id}/board`
              return (
                <div key={project.id}>
                  <Link
                    href={boardHref}
                    className={cn(
                      'flex items-center gap-2 px-2 py-1.5 rounded-md text-[12px] font-medium transition-colors w-full',
                      isActive
                        ? 'bg-subtle/80 text-foreground'
                        : 'text-muted hover:text-foreground hover:bg-subtle/60'
                    )}
                  >
                    <span
                      className="size-5 rounded-md flex items-center justify-center text-[9px] font-bold text-white shrink-0"
                      style={{ backgroundColor: project.color }}
                    >
                      {project.key.slice(0, 2)}
                    </span>
                    <span className="truncate flex-1">{project.name}</span>
                    {isActive && (
                      <motion.div
                        animate={{ rotate: 180 }}
                        initial={{ rotate: 0 }}
                        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
                      >
                        <ChevronDown size={13} className="text-muted shrink-0" />
                      </motion.div>
                    )}
                  </Link>
                  {isActive && slug && (
                    <div className="ml-3 mt-0.5 pl-2.5 border-l border-subtle space-y-0.5 py-0.5">
                      {projectViews.map((view) => {
                        const href = `/${slug}/${project.id}/${view.href}`
                        const active = pathname.includes(`/${view.href}`)
                        return (
                          <NavLink
                            key={view.href}
                            href={href}
                            icon={view.icon}
                            label={view.label}
                            active={active}
                          />
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>
      </div>

      <div className="border-t border-subtle p-2.5 space-y-0.5">
        <NavLink
          href="/profile"
          icon={User}
          label="Profile"
          active={pathname === '/profile'}
        />
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-2 h-8 text-[12px] text-muted hover:text-rose-400"
          onClick={() => signOut()}
        >
          <LogOut size={15} />
          Sign out
        </Button>
      </div>
    </aside>
  )
}
```

- [ ] **Step 2: Verify visually**

Open any dashboard page. Check:
- Sidebar is 220px wide (narrower than before)
- Active nav item has a left indigo bar indicator, not filled background
- ChevronDown rotates smoothly when project is active
- Bottom section uses `border-t` instead of `<Separator />`

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "style: sidebar — compact 220px, left-bar active indicator, animated chevron"
```

---

## Task 3: App Header

**Files:**
- Modify: `src/components/layout/AppHeader.tsx`

- [ ] **Step 1: Replace AppHeader component**

Replace the entire contents of `src/components/layout/AppHeader.tsx`:

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  ChevronRight,
  Search,
  Plus,
  Bell,
  LayoutGrid,
} from 'lucide-react'
import { useWorkspaceStore } from '@/lib/stores/workspace.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

const viewLabels: Record<string, string> = {
  board: 'Board',
  backlog: 'Backlog',
  sprint: 'Sprints',
  roadmap: 'Roadmap',
  projects: 'Projects',
  team: 'Team',
  settings: 'Settings',
}

export function AppHeader() {
  const pathname = usePathname()
  const workspace = useWorkspaceStore((s) => s.currentWorkspace)
  const project = useProjectStore((s) => s.currentProject)

  const segments = pathname.split('/').filter(Boolean)
  const viewKey = segments[segments.length - 1]
  const isProjectView = project && ['board', 'backlog', 'sprint', 'roadmap'].includes(viewKey)

  return (
    <header className="h-[var(--header-h)] border-b border-subtle bg-[rgb(var(--bg-elevated)/0.95)] backdrop-blur-sm flex items-center gap-3 px-4 shrink-0 z-20">
      <nav className="flex items-center gap-1 min-w-0 text-[13px]">
        {workspace && (
          <>
            <Link
              href={`/${workspace.slug}/projects`}
              className="text-muted hover:text-foreground transition-colors truncate max-w-[120px]"
            >
              {workspace.name}
            </Link>
            {(project || !isProjectView) && (
              <ChevronRight size={13} className="text-muted shrink-0" />
            )}
          </>
        )}
        {project && isProjectView && (
          <>
            <Link
              href={`/${workspace?.slug}/${project.id}/board`}
              className="font-medium text-foreground hover:text-accent transition-colors truncate max-w-[140px]"
            >
              {project.name}
            </Link>
            <ChevronRight size={13} className="text-muted shrink-0" />
            <span className="text-muted font-medium">
              {viewLabels[viewKey] ?? viewKey}
            </span>
          </>
        )}
        {!project && workspace && viewLabels[viewKey] && (
          <span className="font-medium text-foreground">
            {viewLabels[viewKey]}
          </span>
        )}
        {pathname === '/profile' && (
          <span className="font-medium text-foreground">Profile</span>
        )}
      </nav>

      <div className="flex-1 max-w-xs hidden md:block">
        <div className="relative">
          <Search
            size={13}
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
          />
          <Input
            readOnly
            placeholder="Search… (⌘K)"
            className="h-7 pl-8 bg-subtle/80 border-subtle text-xs placeholder:text-muted/70"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {project && isProjectView && (
          <Button size="sm" className="bg-accent hover:brightness-110 text-white gap-1.5 h-7 text-xs px-2.5">
            <Plus size={13} />
            Create
          </Button>
        )}
        <Button variant="ghost" size="icon" className="size-7 text-muted" aria-label="Notifications">
          <Bell size={15} />
        </Button>
        <Link
          href={workspace ? `/${workspace.slug}/projects` : '/'}
          aria-label="Projects"
          className="inline-flex size-7 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-foreground transition-colors"
        >
          <LayoutGrid size={15} />
        </Link>
        <ThemeToggle />
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Verify visually**

Check header height is 44px, search is smaller (h-7), Create button is compact, breadcrumb text is 13px.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppHeader.tsx
git commit -m "style: header — 44px height, frosted bg, compact search and action buttons"
```

---

## Task 4: Kanban Board Column + Add Column Button

**Files:**
- Modify: `src/components/board/BoardColumn.tsx`
- Modify: `src/components/board/AddColumnButton.tsx`

- [ ] **Step 1: Update BoardColumn**

Replace the entire contents of `src/components/board/BoardColumn.tsx`:

```tsx
'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, MoreHorizontal } from 'lucide-react'
import type { BoardColumn as BoardColumnType, Issue, Project } from '@/lib/supabase/types'
import { IssueCard } from '@/components/issues/IssueCard'
import { CreateIssueDialog } from '@/components/board/CreateIssueDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface BoardColumnProps {
  column: BoardColumnType
  issues: Issue[]
  project: Project
  workspaceSlug: string
}

export function BoardColumn({
  column,
  issues,
  project,
  workspaceSlug,
}: BoardColumnProps) {
  const [createOpen, setCreateOpen] = useState(false)
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const sorted = [...issues].sort((a, b) => a.order - b.order)
  const isOverLimit =
    column.wip_limit !== null && issues.length >= column.wip_limit

  return (
    <div className="flex-shrink-0 w-[272px] flex flex-col max-h-full">
      <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="size-1.5 rounded-full shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-foreground truncate">
            {column.name}
          </h3>
          <span
            className={cn(
              'text-[11px] font-mono px-1 py-0 rounded tabular-nums',
              isOverLimit
                ? 'bg-rose-500/15 text-rose-400'
                : 'bg-subtle text-muted'
            )}
          >
            {issues.length}
            {column.wip_limit != null && ` / ${column.wip_limit}`}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 text-muted"
            onClick={() => setCreateOpen(true)}
            aria-label="Add issue"
          >
            <Plus size={13} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex size-6 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-foreground">
              <MoreHorizontal size={13} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                Add issue
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Edit column</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CreateIssueDialog
        project={project}
        column={column}
        workspaceSlug={workspaceSlug}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-lg border p-1.5 flex flex-col gap-1.5 min-h-[120px] overflow-y-auto transition-colors',
          isOver
            ? 'border-accent/50 bg-accent-muted/30'
            : 'border-subtle bg-card/40'
        )}
      >
        <SortableContext
          items={sorted.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {sorted.map((issue) => (
            <IssueCard key={issue.id} issue={issue} project={project} />
          ))}
        </SortableContext>
        {sorted.length === 0 && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="w-full py-5 text-xs text-muted hover:text-accent border border-dashed border-subtle rounded-lg hover:border-accent/40 transition-colors"
          >
            + Add issue
          </button>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Update AddColumnButton width**

In `src/components/board/AddColumnButton.tsx`, find the `DialogTrigger` className and change `w-[300px]` to `w-[272px]`:

```tsx
      <DialogTrigger className="flex-shrink-0 w-[272px] min-h-[120px] rounded-lg border border-dashed border-subtle flex items-center justify-center gap-2 text-sm text-muted hover:text-accent hover:border-accent/40 hover:bg-accent-muted/20 transition-colors">
```

Also change `rounded-xl` to `rounded-lg` in the same className.

- [ ] **Step 3: Verify visually**

Open the board page. Check:
- Columns are narrower (272px vs 300px before)
- Column header text is smaller and more spaced
- Drop zone is `rounded-lg` not `rounded-xl`
- Add column trigger matches column width

- [ ] **Step 4: Commit**

```bash
git add src/components/board/BoardColumn.tsx src/components/board/AddColumnButton.tsx
git commit -m "style: board column — 272px width, compact header, tighter drop zone"
```

---

## Task 5: Issue Card

**Files:**
- Modify: `src/components/issues/IssueCard.tsx`

- [ ] **Step 1: Replace IssueCard component**

Replace the entire contents of `src/components/issues/IssueCard.tsx`:

```tsx
'use client'

import { motion } from 'framer-motion'
import { MessageSquare, Paperclip } from 'lucide-react'
import type { Issue, Project } from '@/lib/supabase/types'
import { TypeIcon } from './TypeIcon'
import { PriorityBadge } from './PriorityBadge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { formatIssueId, cn, priorityConfig } from '@/lib/utils'
import { useIssueStore } from '@/lib/stores/issue.store'

interface IssueCardProps {
  issue: Issue
  project: Project
  isDragging?: boolean
}

export function IssueCard({ issue, project, isDragging }: IssueCardProps) {
  const { setSelectedIssue } = useIssueStore()
  const priorityClass = `issue-priority-${issue.priority}`

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ duration: 0.12 }}
      onClick={() => setSelectedIssue(issue)}
      className={cn(
        'group relative bg-card border border-subtle rounded-lg pl-[10px] pr-2.5 py-2 cursor-pointer',
        'hover:border-strong hover:bg-card/80 transition-all',
        priorityClass,
        isDragging && 'opacity-70 rotate-1 shadow-panel ring-1 ring-accent/20'
      )}
    >
      <div className="flex items-center justify-between gap-2 mb-1">
        <span className="text-[11px] text-muted font-mono tracking-tight">
          {formatIssueId(project.key, issue.issue_number)}
        </span>
        <PriorityBadge priority={issue.priority} />
      </div>

      <p className="text-[12.5px] font-medium leading-snug mb-2 line-clamp-2 text-foreground group-hover:text-accent transition-colors">
        {issue.title}
      </p>

      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <TypeIcon type={issue.type} size={12} />
          {issue.labels.slice(0, 2).map((label) => (
            <span
              key={label}
              className="text-[10px] bg-subtle border border-subtle rounded px-1.5 py-0.5 text-muted truncate max-w-[64px]"
            >
              {label}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {issue.description && (
            <Paperclip size={11} className="text-muted opacity-60" />
          )}
          <MessageSquare size={11} className="text-muted opacity-40" />
          {issue.assignee_id ? (
            <Avatar className="size-4 border border-subtle">
              <AvatarFallback className="text-[9px] bg-accent-muted text-accent font-medium">
                {issue.assignee_id.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          ) : (
            <span
              className={cn(
                'size-1.5 rounded-full group-hover:opacity-100 opacity-70 transition-opacity',
                priorityConfig[issue.priority].dot
              )}
              title={priorityConfig[issue.priority].label}
            />
          )}
        </div>
      </div>
    </motion.article>
  )
}
```

- [ ] **Step 2: Verify visually**

Open board page. Check:
- Cards are more compact (shorter height)
- Title clips at 2 lines instead of 3
- Hover changes background subtly (no shadow)
- Priority dot brightens on hover
- Drag overlay has `ring-1` (thinner ring)

- [ ] **Step 3: Commit**

```bash
git add src/components/issues/IssueCard.tsx
git commit -m "style: issue card — compact padding, 2-line title, hover bg shift, refined motion"
```

---

## Task 6: Issue Detail Panel + Property Row

**Files:**
- Modify: `src/components/issues/IssueDetailPanel.tsx`
- Modify: `src/components/issues/IssuePropertyRow.tsx`

- [ ] **Step 1: Update IssuePropertyRow**

Replace the entire contents of `src/components/issues/IssuePropertyRow.tsx`:

```tsx
import { cn } from '@/lib/utils'

interface IssuePropertyRowProps {
  label: string
  children: React.ReactNode
  className?: string
}

export function IssuePropertyRow({
  label,
  children,
  className,
}: IssuePropertyRowProps) {
  return (
    <div
      className={cn(
        'grid grid-cols-[80px_1fr] gap-3 items-start py-2 border-b border-subtle last:border-0',
        className
      )}
    >
      <span className="text-[12px] font-medium text-muted pt-1">{label}</span>
      <div className="min-w-0 text-[12px]">{children}</div>
    </div>
  )
}
```

- [ ] **Step 2: Update IssueDetailPanel — header, backdrop, spring**

In `src/components/issues/IssueDetailPanel.tsx`, make these targeted changes:

**2a.** Change the panel header height from `h-14` to `h-11`:
```tsx
      <div className="flex items-center justify-between px-5 h-11 border-b border-subtle shrink-0">
```

**2b.** Change the title section padding from `py-4` to `py-3`:
```tsx
      <div className="px-5 py-3 border-b border-subtle">
```

**2c.** Change the backdrop from `bg-black/50 backdrop-blur-[2px]` to `bg-black/40 backdrop-blur-[1px]`:
```tsx
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
```

**2d.** Update the spring transition on the panel `motion.aside`:
```tsx
            transition={{ type: 'spring', damping: 36, stiffness: 420 }}
```

**2e.** In the Status property row, change `flex flex-wrap gap-1.5` to `flex gap-1 overflow-x-auto`:
```tsx
              <div className="flex gap-1 overflow-x-auto">
```

**2f.** In the Priority property row, same change:
```tsx
              <div className="flex gap-1 overflow-x-auto">
```

- [ ] **Step 3: Verify visually**

Open board page, click any issue card. Check:
- Panel slides in faster and snappier
- Panel header is shorter (h-11)
- Property rows are more compact (80px label column, 12px text)
- Status/priority selectors scroll horizontally instead of wrapping
- Backdrop is lighter (less black)

- [ ] **Step 4: Commit**

```bash
git add src/components/issues/IssueDetailPanel.tsx src/components/issues/IssuePropertyRow.tsx
git commit -m "style: issue detail panel — compact header, 80px property labels, faster spring, lighter backdrop"
```

---

## Task 7: Auth Layout

**Files:**
- Modify: `src/app/(auth)/layout.tsx`

- [ ] **Step 1: Replace auth layout**

Replace the entire contents of `src/app/(auth)/layout.tsx`:

```tsx
import { FolderKanban } from 'lucide-react'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-[rgb(var(--bg))] border-r border-subtle">
        {/* Line grid background */}
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgb(var(--border) / 0.4) 1px, transparent 1px),
              linear-gradient(90deg, rgb(var(--border) / 0.4) 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />
        {/* Indigo glow at top */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            background:
              'radial-gradient(ellipse 70% 40% at 50% -10%, rgb(var(--accent) / 0.4), transparent 70%)',
          }}
        />
        <div className="relative z-10 flex flex-col justify-between p-12 w-full">
          <div className="flex items-center gap-3">
            <div className="size-9 rounded-xl bg-accent flex items-center justify-center">
              <FolderKanban className="text-white" size={18} />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-lg font-semibold">FlowTrack</span>
              <span className="text-[10px] font-medium bg-accent/20 text-accent border border-accent/30 rounded px-1.5 py-0.5 tracking-wide uppercase">
                Beta
              </span>
            </div>
          </div>
          <div className="max-w-md">
            <h2 className="text-2xl font-medium tracking-tight mb-4">
              Ship work the way Jira should feel.
            </h2>
            <p className="text-muted text-sm leading-relaxed">
              Kanban boards, sprints, backlogs, and roadmaps — built for teams
              who want speed without the clutter.
            </p>
          </div>
          <p className="text-xs text-muted">
            Trusted by product & engineering teams
          </p>
        </div>
      </div>
      <div className="flex-1 flex items-center justify-center p-6 bg-[rgb(var(--bg))]">
        <div className="w-full max-w-[360px]">{children}</div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify visually**

Open `http://localhost:3000/login`. Check:
- Left panel is near-black with line grid visible
- Indigo glow is subtle at the top
- "Beta" badge appears next to logo
- Tagline is `text-2xl` (smaller than before)
- Right panel background also dark

- [ ] **Step 3: Commit**

```bash
git add "src/app/(auth)/layout.tsx"
git commit -m "style: auth layout — dark bg, line grid, indigo glow, Beta badge, compact tagline"
```

---

## Task 8: Auth Pages — Login + Register

**Files:**
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Replace login page**

Replace the entire contents of `src/app/(auth)/login/page.tsx`:

```tsx
'use client'

import { signIn } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function LoginPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signIn(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-lg font-medium tracking-tight mb-1">Sign in</h1>
        <p className="text-sm text-muted">Enter your credentials to continue</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[12px]">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className="h-10 border-[rgb(var(--border-strong))] bg-[rgb(var(--bg-card))]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[12px]">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            placeholder="••••••••"
            className="h-10 border-[rgb(var(--border-strong))] bg-[rgb(var(--bg-card))]"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-accent text-white hover:brightness-110"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={15} />
              Signing in…
            </>
          ) : (
            'Sign in'
          )}
        </Button>
      </form>
      <p className="text-center text-sm text-muted mt-6">
        No account?{' '}
        <Link href="/register" className="text-accent font-medium hover:underline">
          Create one
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Replace register page**

Replace the entire contents of `src/app/(auth)/register/page.tsx`:

```tsx
'use client'

import { signUp } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import Link from 'next/link'
import { useState } from 'react'
import { Loader2 } from 'lucide-react'

export default function RegisterPage() {
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const result = await signUp(new FormData(e.currentTarget))
    if (result?.error) {
      setError(result.error)
      setLoading(false)
    }
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-lg font-medium tracking-tight mb-1">Create account</h1>
        <p className="text-sm text-muted">Start tracking work with your team</p>
      </div>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="name" className="text-[12px]">Full name</Label>
          <Input
            id="name"
            name="name"
            required
            placeholder="Alex Morgan"
            className="h-10 border-[rgb(var(--border-strong))] bg-[rgb(var(--bg-card))]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-[12px]">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@company.com"
            className="h-10 border-[rgb(var(--border-strong))] bg-[rgb(var(--bg-card))]"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="password" className="text-[12px]">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Min. 6 characters"
            className="h-10 border-[rgb(var(--border-strong))] bg-[rgb(var(--bg-card))]"
          />
        </div>
        {error && (
          <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
            {error}
          </p>
        )}
        <Button
          type="submit"
          disabled={loading}
          className="w-full h-10 bg-accent text-white hover:brightness-110"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={15} />
              Creating…
            </>
          ) : (
            'Create account'
          )}
        </Button>
      </form>
      <p className="text-center text-sm text-muted mt-6">
        Already have an account?{' '}
        <Link href="/login" className="text-accent font-medium hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  )
}
```

- [ ] **Step 3: Verify visually**

Open `http://localhost:3000/login` and `/register`. Check:
- No Card component — form floats on dark background
- Inputs have more visible border (`border-strong`)
- Title is `text-lg font-medium` (smaller and lighter weight)
- Submit button hover uses `brightness-110` not opacity

- [ ] **Step 4: Commit**

```bash
git add "src/app/(auth)/login/page.tsx" "src/app/(auth)/register/page.tsx"
git commit -m "style: auth pages — remove Card wrapper, dark-native inputs, compact heading"
```

---

## Task 9: Dialogs + Toast

**Files:**
- Modify: `src/components/board/CreateIssueDialog.tsx`
- Modify: `src/components/layout/Providers.tsx`

- [ ] **Step 1: Fix CreateIssueDialog input tokens**

In `src/components/board/CreateIssueDialog.tsx`, replace all hardcoded glass-effect classes with proper token classes.

Find `className="bg-white/5 border-white/10"` on the title Input and replace:
```tsx
            className="bg-[rgb(var(--bg-card))] border-[rgb(var(--border-strong))]"
```

Find the two `<select>` elements with `className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"` and replace both:
```tsx
                className="w-full h-10 rounded-lg border border-[rgb(var(--border-strong))] bg-[rgb(var(--bg-card))] px-3 text-sm"
```

- [ ] **Step 2: Add mount animation to CreateIssueDialog**

The `DialogContent` from shadcn already has its own animation. No additional Framer Motion needed — shadcn's dialog uses Radix UI which applies `data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95` by default. Verify this is present in `src/components/ui/dialog.tsx` (do not modify).

- [ ] **Step 3: Update Providers toast style**

Replace the entire contents of `src/components/layout/Providers.tsx`:

```tsx
'use client'

import { ThemeProvider } from 'next-themes'
import { Toaster } from '@/components/ui/sonner'

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          style: {
            background: 'rgb(var(--bg-card))',
            border: '1px solid rgb(var(--border-strong))',
            color: 'rgb(var(--text))',
          },
        }}
      />
    </ThemeProvider>
  )
}
```

- [ ] **Step 4: Verify visually**

On the board page:
- Click "+ Add issue" on a column — dialog inputs should look native (dark bg, visible border)
- Trigger a success action (e.g. copy issue key) — toast should use the card background color, not default white/light

- [ ] **Step 5: Commit**

```bash
git add src/components/board/CreateIssueDialog.tsx src/components/layout/Providers.tsx
git commit -m "style: dialogs use CSS token inputs, toast matches theme surface"
```

---

## Self-Review Checklist

**Spec coverage:**
- [x] Token system (Task 1)
- [x] Sidebar compact + active indicator (Task 2)
- [x] Header compact + frosted (Task 3)
- [x] Board column 272px, compact header (Task 4)
- [x] AddColumnButton 272px (Task 4)
- [x] Issue card compact, motion refined (Task 5)
- [x] Issue detail panel compact spring + backdrop (Task 6)
- [x] IssuePropertyRow 80px label grid (Task 6)
- [x] Auth layout dark + grid + glow + badge (Task 7)
- [x] Auth pages card-less, strong borders (Task 8)
- [x] CreateIssueDialog token inputs (Task 9)
- [x] Toast themed (Task 9)

**Type/naming consistency:** All component names and imports match existing codebase. No new types introduced.

**Placeholder scan:** No TBD or TODO present in plan.

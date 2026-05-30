# shadcn/ui Tam Yeniden Tasarım — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** FlowTrack'in tüm UI'ını shadcn/ui bileşenlerine ve Tailwind v4'ün `@theme inline` token sistemine taşımak; workspace rengi `--primary` üzerinden runtime'da inject edilecek.

**Architecture:** `globals.css`'de `@theme inline` bloğu ile tüm shadcn renk token'ları Tailwind'e kaydedilir; `WorkspaceColorProvider` sadece `--primary` CSS değişkenini override eder. Her bileşenden custom `rgb(var(--*))` inline style'lar ve legacy utility class'lar (`.text-muted`, `.bg-subtle`, `.border-subtle`, `.text-accent`, `.bg-accent`) kaldırılır, yerlerine shadcn Tailwind class'ları gelir.

**Tech Stack:** Next.js 16, Tailwind CSS v4, shadcn/ui (base-nova), @base-ui/react, Framer Motion, Zustand

---

## Token Eşleştirme Referansı (tüm görevlerde kullanılacak)

| Eski | Yeni |
|---|---|
| `rgb(var(--bg-card))` / `bg-card` (custom) | `bg-card` (shadcn) |
| `rgb(var(--bg-subtle))` / `bg-subtle` | `bg-muted` |
| `rgb(var(--bg-muted))` | `bg-accent` |
| `rgb(var(--border))` / `border-subtle` | `border` |
| `rgb(var(--border-strong))` / `border-strong` | `border-border` (veya `border-foreground/20`) |
| `rgb(var(--text))` | `text-foreground` |
| `rgb(var(--text-muted))` / `text-muted` | `text-muted-foreground` |
| `rgb(var(--accent))` / `text-accent` | `text-primary` |
| `bg-accent` / `bg-[rgb(var(--accent))]` | `bg-primary` |
| `bg-accent-muted` / `bg-[rgb(var(--accent-muted))]` | `bg-primary/10` |
| `bg-[rgb(var(--bg-elevated))]` | `bg-background` |
| `hover:border-strong` | `hover:border-foreground/20` |
| `hover:bg-subtle/60` | `hover:bg-muted` |

---

## Task 1: Yeni shadcn bileşenlerini kur

**Files:**
- Create: `src/components/ui/collapsible.tsx`
- Create: `src/components/ui/scroll-area.tsx`
- Create: `src/components/ui/table.tsx`
- Create: `src/components/ui/breadcrumb.tsx`

- [ ] **Step 1: Eksik bileşenleri kur**

```bash
cd /Users/ahmetselim/Desktop/test
npx shadcn@latest add collapsible scroll-area table breadcrumb --yes
```

Expected output: 4 bileşen `src/components/ui/` altına eklenir.

- [ ] **Step 2: Bileşenlerin varlığını doğrula**

```bash
ls src/components/ui/ | grep -E "collapsible|scroll-area|table|breadcrumb"
```

Expected: 4 satır çıktı (collapsible.tsx, scroll-area.tsx, table.tsx, breadcrumb.tsx).

- [ ] **Step 3: Commit**

```bash
git add src/components/ui/
git commit -m "feat: shadcn collapsible, scroll-area, table, breadcrumb eklendi"
```

---

## Task 2: globals.css — Token sistemi kurulumu

**Files:**
- Modify: `src/app/globals.css`

- [ ] **Step 1: globals.css'i yeniden yaz**

`src/app/globals.css` içeriğini şununla değiştir:

```css
@import "tailwindcss";
@import "shadcn/tailwind.css";

/* @theme inline — CSS değişkenlerini Tailwind class'larına bağlar (runtime override'a izin verir) */
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-card: var(--card);
  --color-card-foreground: var(--card-foreground);
  --color-popover: var(--popover);
  --color-popover-foreground: var(--popover-foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  --color-secondary: var(--secondary);
  --color-secondary-foreground: var(--secondary-foreground);
  --color-muted: var(--muted);
  --color-muted-foreground: var(--muted-foreground);
  --color-accent: var(--accent);
  --color-accent-foreground: var(--accent-foreground);
  --color-destructive: var(--destructive);
  --color-destructive-foreground: var(--destructive-foreground);
  --color-border: var(--border);
  --color-input: var(--input);
  --color-ring: var(--ring);
  --color-sidebar: var(--sidebar);
  --color-sidebar-foreground: var(--sidebar-foreground);
  --color-sidebar-border: var(--sidebar-border);
  --color-sidebar-accent: var(--sidebar-accent);
  --color-sidebar-accent-foreground: var(--sidebar-accent-foreground);
  --radius-sm: var(--radius-sm-val);
  --radius-md: var(--radius-md-val);
  --radius-lg: var(--radius-lg-val);
  --radius-xl: var(--radius-xl-val);
}

@layer base {
  :root {
    --background: #f8f8fa;
    --foreground: #09090b;
    --card: #ffffff;
    --card-foreground: #09090b;
    --popover: #ffffff;
    --popover-foreground: #09090b;
    --primary: #6366f1;
    --primary-foreground: #ffffff;
    --secondary: #f1f5f9;
    --secondary-foreground: #09090b;
    --muted: #f1f5f9;
    --muted-foreground: #71717a;
    --accent: #f1f5f9;
    --accent-foreground: #09090b;
    --destructive: #f43f5e;
    --destructive-foreground: #ffffff;
    --border: #e4e4e7;
    --input: #e4e4e7;
    --ring: #6366f1;
    --sidebar: #f8f8fa;
    --sidebar-foreground: #09090b;
    --sidebar-border: #e4e4e7;
    --sidebar-accent: #f1f5f9;
    --sidebar-accent-foreground: #09090b;
    --sidebar-w: 220px;
    --header-h: 44px;
    --radius-sm-val: 6px;
    --radius-md-val: 8px;
    --radius-lg-val: 10px;
    --radius-xl-val: 14px;
  }

  .dark {
    --background: #08080a;
    --foreground: #f8f8fa;
    --card: #16161c;
    --card-foreground: #f8f8fa;
    --popover: #1c1c24;
    --popover-foreground: #f8f8fa;
    --primary: #6366f1;
    --primary-foreground: #ffffff;
    --secondary: #1e1e26;
    --secondary-foreground: #f8f8fa;
    --muted: #1e1e26;
    --muted-foreground: #78788c;
    --accent: #262630;
    --accent-foreground: #f8f8fa;
    --destructive: #f43f5e;
    --destructive-foreground: #ffffff;
    --border: #26262e;
    --input: #26262e;
    --ring: #818cf8;
    --sidebar: #0d0d10;
    --sidebar-foreground: #f8f8fa;
    --sidebar-border: #26262e;
    --sidebar-accent: #1a1a22;
    --sidebar-accent-foreground: #f8f8fa;
  }

  * {
    border-color: var(--color-border, #e4e4e7);
    transition-timing-function: cubic-bezier(0.16, 1, 0.3, 1);
  }

  body {
    background-color: var(--color-background);
    color: var(--color-foreground);
    font-family: var(--font-inter), system-ui, sans-serif;
    font-feature-settings: 'cv02', 'cv03', 'cv04', 'cv11';
  }

  code, .font-mono {
    font-family: var(--font-mono), ui-monospace, monospace;
  }
}

@layer utilities {
  .issue-priority-critical { border-left: 3px solid #f43f5e; }
  .issue-priority-high     { border-left: 3px solid #fb923c; }
  .issue-priority-medium   { border-left: 3px solid #fbbf24; }
  .issue-priority-low      { border-left: 3px solid #94a3b8; }
}
```

- [ ] **Step 2: Dev sunucusunu başlat ve temel sayfalara bak**

```bash
npm run dev
```

Tarayıcıda `http://localhost:3000` aç. Sayfa yüklenmeli, font değişmemeli. Butonlar ve inputlar artık `bg-primary` ile boyandığından indigo rengi görmeli.

- [ ] **Step 3: Commit**

```bash
git add src/app/globals.css
git commit -m "feat: globals.css shadcn @theme inline token sistemi"
```

---

## Task 3: WorkspaceColorProvider — --primary inject

**Files:**
- Modify: `src/components/layout/WorkspaceColorProvider.tsx`

- [ ] **Step 1: WorkspaceColorProvider'ı güncelle**

```tsx
'use client'

import { useEffect } from 'react'
import { useWorkspaceStore } from '@/lib/stores/workspace.store'

export function WorkspaceColorProvider() {
  const color = useWorkspaceStore((s) => s.currentWorkspace?.color)

  useEffect(() => {
    if (!color) return
    const root = document.documentElement
    root.style.setProperty('--primary', color)
    root.style.setProperty('--ring', color)
  }, [color])

  return null
}
```

- [ ] **Step 2: Workspace renginin yansıdığını doğrula**

Tarayıcıda bir workspace aç. Dev tools'da `document.documentElement.style` içinde `--primary` değerinin workspace rengiyle eşleştiğini kontrol et.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/WorkspaceColorProvider.tsx
git commit -m "feat: WorkspaceColorProvider --primary inject"
```

---

## Task 4: Sidebar yeniden tasarımı

**Files:**
- Modify: `src/components/layout/Sidebar.tsx`

- [ ] **Step 1: Sidebar.tsx'i yeniden yaz**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Kanban, ListTodo, Timer, Map, LogOut,
  FolderKanban, Users, Settings, LayoutGrid, User, ChevronDown,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/actions/auth'
import { useWorkspaceStore } from '@/lib/stores/workspace.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'

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
          ? 'bg-accent text-accent-foreground'
          : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
      )}
    >
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 bg-primary rounded-r-full" />
      )}
      <Icon size={15} className={active ? 'text-primary' : 'opacity-60'} />
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
    <aside className="w-[var(--sidebar-w)] h-screen border-r border-sidebar-border bg-sidebar flex flex-col shrink-0">
      {/* Workspace Header */}
      <div className="h-[var(--header-h)] flex items-center gap-2 px-3 border-b border-sidebar-border">
        <Link href={slug ? `/${slug}` : '/'} className="flex items-center gap-2 min-w-0">
          <Avatar className="size-7 rounded-lg shrink-0">
            <AvatarFallback
              className="rounded-lg text-[11px] font-bold text-primary-foreground"
              style={{ backgroundColor: workspace?.color ?? 'var(--color-primary)' }}
            >
              {workspace?.name ? workspace.name.slice(0, 2).toUpperCase() : <FolderKanban size={14} />}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold truncate leading-tight text-sidebar-foreground">
              {workspace?.name ?? 'FlowTrack'}
            </p>
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
              Workspace
            </p>
          </div>
        </Link>
      </div>

      {/* Nav */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-5">
        {slug && (
          <div>
            <p className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Workspace
            </p>
            <nav className="space-y-0.5">
              {workspaceLinks.map((item) => {
                const href = `/${slug}/${item.href}`
                const active = pathname === href || pathname.startsWith(`${href}/`)
                return (
                  <NavLink key={item.href} href={href} icon={item.icon} label={item.label} active={active} />
                )
              })}
            </nav>
          </div>
        )}

        <div>
          <div className="flex items-center justify-between px-2 mb-1">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Projects
            </p>
            {slug && (
              <Link href={`/${slug}/projects`} className="text-[10px] text-primary hover:underline">
                View all
              </Link>
            )}
          </div>
          <nav className="space-y-0.5">
            {projects.length === 0 && (
              <p className="px-2 text-xs text-muted-foreground">No projects yet</p>
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
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
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
                        <ChevronDown size={13} className="text-muted-foreground shrink-0" />
                      </motion.div>
                    )}
                  </Link>
                  <AnimatePresence>
                    {isActive && slug && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                        className="overflow-hidden"
                      >
                        <div className="ml-3 mt-0.5 pl-2.5 border-l border-sidebar-border space-y-0.5 py-0.5">
                          {projectViews.map((view) => {
                            const href = `/${slug}/${project.id}/${view.href}`
                            const active = pathname.includes(`/${view.href}`)
                            return (
                              <NavLink key={view.href} href={href} icon={view.icon} label={view.label} active={active} />
                            )
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )
            })}
          </nav>
        </div>
      </div>

      {/* Footer */}
      <Separator className="bg-sidebar-border" />
      <div className="p-2.5 space-y-0.5">
        <NavLink href="/profile" icon={User} label="Profile" active={pathname === '/profile'} />
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-2 h-8 text-[12px] text-muted-foreground hover:text-destructive"
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

- [ ] **Step 2: Sidebar'ın görsel olarak doğru çalıştığını kontrol et**

Tarayıcıda dashboard'u aç. Sidebar solda görünmeli, aktif link `bg-accent` ile vurgulanmalı, workspace avatar'ı `--primary` rengini kullanmalı.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/Sidebar.tsx
git commit -m "feat: sidebar shadcn token sistemi ve AnimatePresence"
```

---

## Task 5: AppHeader yeniden tasarımı

**Files:**
- Modify: `src/components/layout/AppHeader.tsx`

- [ ] **Step 1: AppHeader.tsx'i güncelle**

```tsx
'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Plus, Bell } from 'lucide-react'
import { useWorkspaceStore } from '@/lib/stores/workspace.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

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
    <header className="h-[var(--header-h)] border-b border-border bg-background/95 backdrop-blur-sm flex items-center gap-3 px-4 shrink-0 z-20">
      <Breadcrumb>
        <BreadcrumbList>
          {workspace && (
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link href={`/${workspace.slug}/projects`} className="text-muted-foreground hover:text-foreground">
                  {workspace.name}
                </Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
          )}
          {isProjectView && project && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link href={`/${workspace?.slug}/${project.id}/board`} className="text-muted-foreground hover:text-foreground">
                    {project.name}
                  </Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{viewLabels[viewKey] ?? viewKey}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          {!isProjectView && workspace && viewLabels[viewKey] && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>{viewLabels[viewKey]}</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
          {pathname === '/profile' && (
            <>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbPage>Profile</BreadcrumbPage>
              </BreadcrumbItem>
            </>
          )}
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1 max-w-xs hidden md:block">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <Input
            readOnly
            placeholder="Search… (⌘K)"
            className="h-7 pl-8 bg-muted/60 border-border text-xs placeholder:text-muted-foreground/70"
          />
        </div>
      </div>

      <div className="flex items-center gap-1 ml-auto">
        {project && isProjectView && (
          <Button size="sm" className="gap-1.5 h-7 text-xs px-2.5">
            <Plus size={13} />
            Create
          </Button>
        )}
        <Button variant="ghost" size="icon" className="size-7 text-muted-foreground" aria-label="Notifications">
          <Bell size={15} />
        </Button>
        <ThemeToggle />
      </div>
    </header>
  )
}
```

- [ ] **Step 2: Breadcrumb görünümünü kontrol et**

Bir proje board sayfasında header'da "WorkspaceName / ProjectName / Board" breadcrumb'ının göründüğünü doğrula.

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/AppHeader.tsx
git commit -m "feat: AppHeader Breadcrumb + shadcn tokens"
```

---

## Task 6: PageHeader + Dashboard Layout

**Files:**
- Modify: `src/components/layout/PageHeader.tsx`
- Modify: `src/app/(dashboard)/layout.tsx`

- [ ] **Step 1: PageHeader.tsx güncelle**

```tsx
import { cn } from '@/lib/utils'
import { Separator } from '@/components/ui/separator'

interface PageHeaderProps {
  title: string
  description?: string
  actions?: React.ReactNode
  className?: string
}

export function PageHeader({ title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('px-6 pt-6 pb-0', className)}>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-5">
        <div>
          <h1 className="text-xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground mt-1 max-w-2xl">{description}</p>
          )}
        </div>
        {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
      </div>
      <Separator />
    </div>
  )
}
```

- [ ] **Step 2: Dashboard layout.tsx güncelle**

```tsx
import { Sidebar } from '@/components/layout/Sidebar'
import { AppHeader } from '@/components/layout/AppHeader'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DataLoader } from '@/components/layout/DataLoader'
import { IssueDetailPanel } from '@/components/issues/IssueDetailPanel'
import { WorkspaceColorProvider } from '@/components/layout/WorkspaceColorProvider'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <TooltipProvider>
      <DataLoader>
        <WorkspaceColorProvider />
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

- [ ] **Step 3: Commit**

```bash
git add src/components/layout/PageHeader.tsx "src/app/(dashboard)/layout.tsx"
git commit -m "feat: PageHeader Separator + layout bg-muted/20"
```

---

## Task 7: BoardToolbar

**Files:**
- Modify: `src/components/board/BoardToolbar.tsx`

- [ ] **Step 1: BoardToolbar.tsx'i güncelle**

```tsx
'use client'

import { Filter, SlidersHorizontal, LayoutList } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import type { Project } from '@/lib/supabase/types'

interface BoardToolbarProps {
  project: Project
  issueCount: number
  filterBarOpen: boolean
  onFilterToggle: () => void
  activeFilterCount: number
}

export function BoardToolbar({ project, issueCount, filterBarOpen, onFilterToggle, activeFilterCount }: BoardToolbarProps) {
  return (
    <div className="flex items-center justify-between gap-4 px-6 py-3 border-b border-border bg-card/50">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className="size-9 rounded-lg flex items-center justify-center text-xs font-bold text-white shrink-0"
          style={{ backgroundColor: project.color }}
        >
          {project.key}
        </div>
        <div className="min-w-0">
          <h1 className="text-base font-semibold truncate text-foreground">{project.name}</h1>
          <p className="text-xs text-muted-foreground">
            Kanban board · <span className="font-mono">{issueCount}</span> issues
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="font-mono text-[11px] hidden sm:inline-flex">
          {project.key}
        </Badge>
        <Separator orientation="vertical" className="h-5 hidden sm:block" />
        <Button
          variant={filterBarOpen ? 'secondary' : 'outline'}
          size="sm"
          className="gap-1.5 h-8 text-xs"
          onClick={onFilterToggle}
        >
          <Filter size={14} />
          Filter
          {activeFilterCount > 0 && (
            <Badge variant="default" className="ml-1 h-4 min-w-4 px-1 text-[10px] rounded-full">
              {activeFilterCount}
            </Badge>
          )}
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs hidden sm:inline-flex">
          <SlidersHorizontal size={14} />
          Group
        </Button>
        <Button variant="outline" size="sm" className="gap-1.5 h-8 text-xs hidden md:inline-flex">
          <LayoutList size={14} />
          Columns
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/components/board/BoardToolbar.tsx
git commit -m "feat: BoardToolbar shadcn tokens"
```

---

## Task 8: FilterBar

**Files:**
- Modify: `src/components/board/FilterBar.tsx`

- [ ] **Step 1: FilterBar.tsx'teki custom class'ları güncelle**

Dosyada şu değişiklikleri yap:

1. `chip` fonksiyonunu güncelle:
```tsx
const chip = (active: boolean) => cn(
  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-[12px] font-medium transition-all shrink-0',
  active
    ? 'border-primary/40 bg-primary/10 text-primary'
    : 'border-border text-muted-foreground hover:border-foreground/20 hover:text-foreground'
)
```

2. `row` fonksiyonunu güncelle:
```tsx
const row = (active: boolean) => cn(
  'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors',
  active ? 'bg-primary/10 text-primary' : 'hover:bg-muted text-foreground'
)
```

3. Ana div class'ını güncelle:
```tsx
<div className="flex items-center gap-2 px-6 py-2.5 border-b border-border bg-card/30 overflow-x-auto shrink-0">
```

4. Filtre badge'lerindeki `bg-accent text-white` → `bg-primary text-primary-foreground`:
```tsx
<span className="size-4 rounded-full bg-primary text-primary-foreground text-[10px] font-bold flex items-center justify-center">
```

5. Active chip span class'larını güncelle:
```tsx
className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10 border border-primary/20 text-primary text-[11px] font-medium shrink-0"
```

- [ ] **Step 2: Commit**

```bash
git add src/components/board/FilterBar.tsx
git commit -m "feat: FilterBar primary token"
```

---

## Task 9: IssueCard

**Files:**
- Modify: `src/components/issues/IssueCard.tsx`

- [ ] **Step 1: IssueCard.tsx'teki custom style'ları güncelle**

Şu değişiklikleri yap:

1. `motion.article` class'ını güncelle (inline `rgb(var(--*))` kaldır):
```tsx
className={cn(
  'group flex flex-col gap-0 rounded-xl border select-none',
  'bg-card border-border',
  'shadow-sm',
  'hover:shadow-md hover:border-foreground/20 transition-all duration-200',
  overlay
    ? 'rotate-[1.5deg] cursor-grabbing opacity-95'
    : 'cursor-grab active:cursor-grabbing',
)}
```

2. Divider'ı güncelle:
```tsx
<div className="h-px bg-border mx-4" />
```

3. Estimate badge'ini güncelle:
```tsx
<span className="text-[10.5px] text-muted-foreground bg-muted border border-border rounded-md px-1.5 py-0.5 font-medium tabular-nums">
  {issue.estimate}pt
</span>
```

4. Title hover class'ı:
```tsx
className="text-[13.5px] font-semibold leading-snug text-foreground group-hover:text-primary transition-colors line-clamp-2 tracking-[-0.01em]"
```

5. Description class:
```tsx
className="text-[12px] leading-relaxed text-muted-foreground line-clamp-2"
```

- [ ] **Step 2: Commit**

```bash
git add src/components/issues/IssueCard.tsx
git commit -m "feat: IssueCard bg-card border-border shadcn tokens"
```

---

## Task 10: BoardColumn

**Files:**
- Modify: `src/components/board/BoardColumn.tsx`

- [ ] **Step 1: BoardColumn.tsx'i oku ve custom class'ları güncelle**

Dosyayı oku. Sonra şu değişiklikleri uygula:
- `rgb(var(--bg-*))` → shadcn class
- `border-[rgb(var(--border))]` → `border-border`
- Sütun container: `bg-muted/40` 
- Sütun başlık: `bg-card` veya `bg-background`
- Issue count badge: `<Badge variant="secondary">`
- Sütun aksiyonları (add issue, settings): `<Button variant="ghost" size="icon-sm">`

- [ ] **Step 2: Commit**

```bash
git add src/components/board/BoardColumn.tsx
git commit -m "feat: BoardColumn shadcn tokens"
```

---

## Task 11: AddColumnButton

**Files:**
- Modify: `src/components/board/AddColumnButton.tsx`

- [ ] **Step 1: AddColumnButton.tsx'i güncelle**

Dosyayı oku. Custom class'ları kaldır, `<Button variant="outline" className="border-dashed">` kullan.

- [ ] **Step 2: Commit**

```bash
git add src/components/board/AddColumnButton.tsx
git commit -m "feat: AddColumnButton border-dashed outline"
```

---

## Task 12: CreateIssueDialog

**Files:**
- Modify: `src/components/board/CreateIssueDialog.tsx`

- [ ] **Step 1: CreateIssueDialog.tsx'i güncelle**

Dosyayı oku. Şu değişiklikleri yap:
- Dialog içindeki tüm `rgb(var(--*))` inline style'ları kaldır
- Input/Textarea/Select class'larında `border-[rgb(var(--border-strong))] bg-[rgb(var(--bg-card))]` → standart (shadcn varsayılan stili yeterli)
- Submit buton: `<Button type="submit">` (varsayılan variant — primary rengi kullanır)
- Cancel: `<Button variant="outline">`

- [ ] **Step 2: Commit**

```bash
git add src/components/board/CreateIssueDialog.tsx
git commit -m "feat: CreateIssueDialog shadcn tokens"
```

---

## Task 13: IssueDetailPanel

**Files:**
- Modify: `src/components/issues/IssueDetailPanel.tsx`

- [ ] **Step 1: IssueDetailPanel.tsx'i güncelle**

Dosyayı oku. Şu değişiklikleri yap:
- Sheet içindeki custom `bg-[rgb(var(--bg-card))]` → kaldır (Sheet zaten `bg-background` kullanır)
- `border-[rgb(var(--border))]` → `border-border`
- `text-[rgb(var(--text-muted))]` → `text-muted-foreground`
- Panel başlık: `text-foreground font-semibold`
- Section başlıkları: `text-xs font-semibold text-muted-foreground uppercase tracking-widest`

- [ ] **Step 2: Commit**

```bash
git add src/components/issues/IssueDetailPanel.tsx
git commit -m "feat: IssueDetailPanel shadcn tokens"
```

---

## Task 14: Projects sayfası

**Files:**
- Modify: `src/app/(dashboard)/[workspace]/projects/page.tsx`
- Modify: `src/components/projects/ProjectCardActions.tsx`

- [ ] **Step 1: projects/page.tsx içindeki ProjectCard fonksiyonunu güncelle**

`ProjectCard` local fonksiyonunda (page.tsx içindeki) şu değişiklikleri yap:

1. Kart container:
```tsx
<div className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-foreground/20 hover:shadow-lg transition-all">
```

2. Boş durum container:
```tsx
<div className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-2xl text-center">
```

3. Boş durum ikonu:
```tsx
<div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
  <Kanban size={24} className="text-primary" />
</div>
```

4. Yeni proje placeholder:
```tsx
<div className="rounded-2xl border border-dashed border-border hover:border-primary/40 hover:bg-muted/40 transition-all flex items-center justify-center min-h-[220px]">
```

5. Logo/avatar:
```tsx
<div className="size-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white font-bold overflow-hidden">
```
(değişmez — logo alanı white/overlay üzerine kurulu)

6. Proje ismi hover:
```tsx
<h3 className="font-semibold text-[14px] text-foreground group-hover:text-primary transition-colors truncate mb-0.5">
```

7. Key badge:
```tsx
<span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
```

- [ ] **Step 2: Commit**

```bash
git add "src/app/(dashboard)/[workspace]/projects/page.tsx"
git commit -m "feat: Projects sayfası shadcn tokens"
```

---

## Task 15: Dashboard Hero + ProjectCard

**Files:**
- Modify: `src/components/dashboard/DashboardHero.tsx`
- Modify: `src/components/dashboard/ProjectCard.tsx`

- [ ] **Step 1: DashboardHero.tsx güncelle**

`StatCard` bileşeninin className'ini güncelle:
```tsx
<Link
  href={href}
  className="flex items-center gap-3.5 px-4 py-4 rounded-xl border transition-all hover:brightness-110"
  style={{ background: bgColor, borderColor }}
>
```
(değişmez — inline style zaten renk bazlı)

Ana wrapper'daki `border-b border-subtle` → `border-b border-border`:
```tsx
className="relative overflow-hidden border-b border-border px-8 py-7 shrink-0"
```

- [ ] **Step 2: ProjectCard.tsx güncelle**

`src/components/dashboard/ProjectCard.tsx` içindeki `Link` class'ını güncelle:
```tsx
className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl border border-border bg-card/40 hover:border-foreground/20 hover:bg-card transition-all group"
```

Progress bar container:
```tsx
<div className="h-[3px] bg-muted rounded-full overflow-hidden">
```

Percentage badge:
```tsx
<span
  className="text-[11px] font-bold shrink-0 px-2 py-0.5 rounded-md border tabular-nums"
  style={{
    color: project.color,
    backgroundColor: `${project.color}18`,
    borderColor: `${project.color}30`,
  }}
>
```
(değişmez — project rengi için inline style korunur)

- [ ] **Step 3: Commit**

```bash
git add src/components/dashboard/DashboardHero.tsx src/components/dashboard/ProjectCard.tsx
git commit -m "feat: Dashboard Hero + ProjectCard shadcn tokens"
```

---

## Task 16: Backlog

**Files:**
- Modify: `src/components/backlog/BacklogView.tsx`
- Modify: `src/components/backlog/BacklogGroup.tsx`

- [ ] **Step 1: BacklogView.tsx ve BacklogGroup.tsx dosyalarını oku**

Her iki dosyayı da oku. Sonra:
- `BacklogGroup` içindeki grup başlıklarını `Collapsible` + `CollapsibleTrigger` + `CollapsibleContent` ile sar
- Satır container'larına `<Table>` + `<TableBody>` + `<TableRow>` + `<TableCell>` kullan
- Custom `border-subtle` → `border-border`
- Custom `text-muted` → `text-muted-foreground`
- Priority/status için var olan `Badge` component'ini koru

```tsx
// BacklogGroup.tsx yapısı
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Table, TableBody, TableCell, TableRow } from '@/components/ui/table'
import { ChevronDown } from 'lucide-react'

// Grup header için CollapsibleTrigger
// Issue listesi için Table
```

- [ ] **Step 2: Commit**

```bash
git add src/components/backlog/
git commit -m "feat: Backlog Collapsible + Table shadcn"
```

---

## Task 17: Sprint

**Files:**
- Modify: `src/components/sprint/SprintView.tsx`
- Modify: `src/components/sprint/SprintCard.tsx`

- [ ] **Step 1: Sprint bileşenlerini oku ve güncelle**

Her iki dosyayı oku. Şu değişiklikleri yap:
- SprintCard wrapper: `<Card>` + `<CardHeader>` + `<CardContent>`
- Sprint status: `<Badge>` (active → `variant="default"`, completed → `variant="secondary"`)
- Custom border/bg class'ları → shadcn token'ları

- [ ] **Step 2: Commit**

```bash
git add src/components/sprint/
git commit -m "feat: Sprint Card + Badge shadcn"
```

---

## Task 18: Roadmap

**Files:**
- Modify: `src/components/roadmap/RoadmapView.tsx`

- [ ] **Step 1: RoadmapView.tsx'i oku ve wrapper'ı güncelle**

Dosyayı oku. Gantt çizim mantığına dokunma. Sadece wrapper'ı güncelle:
- Container: `<Card className="overflow-hidden">`
- Scroll area: `<ScrollArea className="w-full">` + `<ScrollBar orientation="horizontal" />`
- Custom `border-subtle` → `border-border`

```tsx
import { Card } from '@/components/ui/card'
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area'
```

- [ ] **Step 2: Commit**

```bash
git add src/components/roadmap/
git commit -m "feat: Roadmap Card + ScrollArea wrapper"
```

---

## Task 19: Settings sayfası

**Files:**
- Modify: `src/components/workspace/WorkspaceSettingsForm.tsx`
- Modify: `src/components/workspace/DangerZone.tsx`
- Modify: `src/app/(dashboard)/[workspace]/settings/page.tsx`

- [ ] **Step 1: Settings page.tsx'i oku**

Dosyayı oku, mevcut yapıyı anla.

- [ ] **Step 2: Settings page.tsx'i güncelle**

```tsx
// İki tab: Workspace / Danger Zone
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'

// Her bölüm Card içinde
// Tabs ile Workspace ve Danger Zone ayrımı
```

- [ ] **Step 3: WorkspaceSettingsForm.tsx'i oku ve güncelle**

Custom class'ları temizle, `Input`, `Label`, `Button` shadcn default stillerini kullan (ek class gerekmez).

- [ ] **Step 4: DangerZone.tsx'i oku ve güncelle**

Delete button: `<Button variant="destructive">`. Confirm dialog içindeki butonlar da aynı şekilde.

- [ ] **Step 5: Commit**

```bash
git add src/components/workspace/ "src/app/(dashboard)/[workspace]/settings/page.tsx"
git commit -m "feat: Settings Tabs + Card + destructive shadcn"
```

---

## Task 20: Team sayfası

**Files:**
- Modify: `src/app/(dashboard)/[workspace]/team/page.tsx`

- [ ] **Step 1: team/page.tsx'i oku ve Table ile yeniden yaz**

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent } from '@/components/ui/card'

// Her üye bir TableRow
// Rol: <Badge variant="secondary">
// Avatar: <Avatar size-8>
```

Custom class'ları kaldır.

- [ ] **Step 2: Commit**

```bash
git add "src/app/(dashboard)/[workspace]/team/page.tsx"
git commit -m "feat: Team sayfası Table + Badge shadcn"
```

---

## Task 21: Profile sayfası

**Files:**
- Modify: `src/components/profile/ProfileForm.tsx`
- Modify: `src/app/(dashboard)/profile/page.tsx`

- [ ] **Step 1: Profile bileşenlerini oku ve güncelle**

- Page container: `<Card className="max-w-2xl mx-auto mt-8">` + `<CardHeader>` + `<CardContent>`
- Avatar: `<Avatar className="size-20">` + `<AvatarFallback>`
- Form: `Input`, `Label`, `Button` — ek class gerekmez

- [ ] **Step 2: Commit**

```bash
git add src/components/profile/ "src/app/(dashboard)/profile/page.tsx"
git commit -m "feat: Profile Card + Avatar shadcn"
```

---

## Task 22: Auth sayfaları

**Files:**
- Modify: `src/app/(auth)/layout.tsx`
- Modify: `src/app/(auth)/login/page.tsx`
- Modify: `src/app/(auth)/register/page.tsx`

- [ ] **Step 1: Auth layout.tsx'i oku**

Mevcut layout yapısını anla.

- [ ] **Step 2: Auth layout'u Card içine al**

```tsx
// layout.tsx
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-muted/30 flex items-center justify-center p-4">
      <Card className="w-full max-w-sm shadow-lg">
        <CardHeader className="pb-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="size-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground text-xs font-bold">FT</span>
            </div>
            <span className="font-semibold text-foreground">FlowTrack</span>
          </div>
        </CardHeader>
        <CardContent>{children}</CardContent>
      </Card>
    </div>
  )
}
```

- [ ] **Step 3: login/page.tsx'i güncelle**

```tsx
// Login page içindeki custom class'ları temizle:
// "border-[rgb(var(--border-strong))] bg-[rgb(var(--bg-card))]" → kaldır (shadcn varsayılan)
// "bg-accent text-white hover:brightness-110" → kaldır, sadece <Button type="submit" className="w-full h-10">
// "text-accent font-medium hover:underline" → "text-primary font-medium hover:underline"
```

- [ ] **Step 4: register/page.tsx'i güncelle**

Login ile aynı pattern — custom class'ları temizle.

- [ ] **Step 5: Commit**

```bash
git add "src/app/(auth)/"
git commit -m "feat: Auth layout Card ortalanmış + shadcn tokens"
```

---

## Task 23: Kalan bileşenler — token sweep

**Files:**
- Modify: `src/components/issues/IssueDetailTabs.tsx`
- Modify: `src/components/issues/IssuePropertyRow.tsx`
- Modify: `src/components/issues/IssueEditor.tsx`
- Modify: `src/components/issues/IssueCommentThread.tsx`
- Modify: `src/components/issues/MemberPicker.tsx`
- Modify: `src/components/issues/StatusBadge.tsx`
- Modify: `src/components/issues/PriorityBadge.tsx`
- Modify: `src/components/projects/CreateProjectDialog.tsx`
- Modify: `src/components/projects/EditProjectDialog.tsx`

- [ ] **Step 1: Her dosyayı aç ve token sweep yap**

Her dosyada şu pattern'leri bul ve değiştir (glob/find kullan):

```bash
# Dosyalarda kalan custom class'ları bul
grep -rn "rgb(var\|border-subtle\|text-muted\b\|bg-subtle\|text-accent\|bg-accent\b\|border-strong" src/components/ --include="*.tsx"
```

Her eşleşme için token tablosunu kullanarak shadcn eşdeğerine çevir.

- [ ] **Step 2: Tüm custom utility class referanslarını kontrol et**

```bash
grep -rn "border-subtle\|text-muted\b\|bg-subtle\|bg-card\b\|text-accent\b\|bg-accent\b" src/ --include="*.tsx" | grep -v "node_modules"
```

Çıktı boş olmalı (veya sadece yorum satırları kalmalı).

- [ ] **Step 3: Commit**

```bash
git add src/components/
git commit -m "feat: tüm bileşenlerde shadcn token sweep tamamlandı"
```

---

## Task 24: Son doğrulama

**Files:** Tüm değiştirilen dosyalar (read-only kontrol)

- [ ] **Step 1: Build al**

```bash
npm run build
```

Expected: Build hata vermeden tamamlanır.

- [ ] **Step 2: Kalan custom class'ları kontrol et**

```bash
grep -rn "rgb(var\|--bg-subtle\|--bg-card\|--bg-muted\|--text-muted\|--accent\b\|--border\b" src/ --include="*.tsx" --include="*.ts" --include="*.css" | grep -v "node_modules\|globals.css"
```

Globals.css dışında eşleşme kalmamalı.

- [ ] **Step 3: Light/dark tema geçişini kontrol et**

Dev sunucusu açık haldeyken ThemeToggle ile light↔dark geçiş yap. Her sayfada renk sistemi tutarlı görünmeli.

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: shadcn/ui tam yeniden tasarım tamamlandı"
```

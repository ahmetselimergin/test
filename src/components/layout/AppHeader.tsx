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

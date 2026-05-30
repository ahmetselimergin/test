'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Search, Plus } from 'lucide-react'
import { useWorkspaceStore } from '@/lib/stores/workspace.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import { ThemeToggle } from '@/components/layout/ThemeToggle'
import { CommandPalette } from '@/components/layout/CommandPalette'
import { NotificationBell } from '@/components/notifications/NotificationBell'
import { Button } from '@/components/ui/button'
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
  const setGlobalCreateOpen = useIssueStore((s) => s.setGlobalCreateOpen)
  const [paletteOpen, setPaletteOpen] = useState(false)

  const segments = pathname.split('/').filter(Boolean)
  const viewKey = segments[segments.length - 1]
  const isProjectView = project && ['board', 'backlog', 'sprint', 'roadmap'].includes(viewKey)

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setPaletteOpen(true)
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  return (
    <>
      <header className="h-[var(--header-h)] border-b border-border bg-background/95 backdrop-blur-sm flex items-center gap-3 px-4 shrink-0 z-20">
        <Breadcrumb>
          <BreadcrumbList>
            {workspace && (
              <BreadcrumbItem>
                <BreadcrumbLink
                  render={<Link href={`/${workspace.slug}/projects`} />}
                  className="text-muted-foreground hover:text-foreground"
                >
                  {workspace.name}
                </BreadcrumbLink>
              </BreadcrumbItem>
            )}
            {isProjectView && project && (
              <>
                <BreadcrumbSeparator />
                <BreadcrumbItem>
                  <BreadcrumbLink
                    render={<Link href={`/${workspace?.slug}/${project.id}/board`} />}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {project.name}
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

        {/* Search trigger */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="flex-1 max-w-xs hidden md:flex items-center gap-2 h-7 px-3 rounded-md bg-muted/60 border border-border text-xs text-muted-foreground/70 hover:text-muted-foreground hover:bg-muted transition-colors"
        >
          <Search size={12} className="shrink-0" />
          <span className="flex-1 text-left">Ara…</span>
          <kbd className="hidden sm:inline-flex items-center gap-0.5 bg-background border border-border rounded px-1 py-0.5 text-[10px] font-mono text-muted-foreground/60">
            ⌘K
          </kbd>
        </button>

        <div className="flex items-center gap-1 ml-auto">
          {project && isProjectView && (
            <Button
              size="sm"
              className="gap-1.5 h-7 text-xs px-2.5"
              onClick={() => setGlobalCreateOpen(true)}
            >
              <Plus size={13} />
              Create
            </Button>
          )}
          <NotificationBell />
          <ThemeToggle />
        </div>
      </header>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </>
  )
}

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

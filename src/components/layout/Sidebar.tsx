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
          href={slug ? `/${slug}` : '/'}
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

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
  { label: 'Tüm Projeler', icon: LayoutGrid, href: 'projects' },
  { label: 'Takım', icon: Users, href: 'team' },
  { label: 'Ayarlar', icon: Settings, href: 'settings' },
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
              className="rounded-lg text-[11px] font-bold text-white"
              style={{ backgroundColor: workspace?.color ?? '#6366f1' }}
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
              Projeler
            </p>
            {slug && (
              <Link href={`/${slug}/projects`} className="text-[10px] text-primary hover:underline">
                Tümünü gör
              </Link>
            )}
          </div>
          <nav className="space-y-0.5">
            {projects.length === 0 && (
              <p className="px-2 text-xs text-muted-foreground">Henüz proje yok</p>
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
        <NavLink href="/profile" icon={User} label="Profil" active={pathname === '/profile'} />
        <Button
          variant="ghost"
          className="w-full justify-start gap-2 px-2 h-8 text-[12px] text-muted-foreground hover:text-destructive"
          onClick={() => signOut()}
        >
          <LogOut size={15} />
          Çıkış Yap
        </Button>
      </div>
    </aside>
  )
}

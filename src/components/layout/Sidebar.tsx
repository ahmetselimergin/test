'use client'
import { motion, AnimatePresence } from 'framer-motion'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Kanban,
  ListTodo,
  Timer,
  Map,
  ChevronLeft,
  LogOut,
  FolderKanban,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { signOut } from '@/app/actions/auth'
import { useWorkspaceStore } from '@/lib/stores/workspace.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'

const navItems = [
  { label: 'Board', icon: Kanban, href: 'board' },
  { label: 'Backlog', icon: ListTodo, href: 'backlog' },
  { label: 'Sprint', icon: Timer, href: 'sprint' },
  { label: 'Roadmap', icon: Map, href: 'roadmap' },
]

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false)
  const pathname = usePathname()
  const { currentWorkspace } = useWorkspaceStore()
  const { projects, currentProject } = useProjectStore()

  return (
    <motion.aside
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      className="relative flex flex-col h-screen border-r border-subtle glass z-10 flex-shrink-0"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b border-subtle h-14 overflow-hidden">
        <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center flex-shrink-0">
          <FolderKanban size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="font-semibold text-sm truncate"
            >
              {currentWorkspace?.name ?? 'FlowTrack'}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Projects nav */}
      <div className="flex-1 overflow-y-auto py-3 space-y-1 px-2">
        {projects.map((project) => (
          <div key={project.id} className="space-y-0.5">
            <Tooltip>
              <TooltipTrigger
                className={cn(
                  'flex items-center gap-2 px-2 py-1.5 rounded-lg cursor-pointer w-full',
                  'text-muted hover:bg-white/5 transition-colors',
                  currentProject?.id === project.id &&
                    'bg-indigo-500/10 text-indigo-400'
                )}
              >
                  <div
                    className="w-5 h-5 rounded flex-shrink-0 flex items-center justify-center text-xs font-bold text-white"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.key[0]}
                  </div>
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium truncate"
                      >
                        {project.name}
                      </motion.span>
                    )}
                  </AnimatePresence>
              </TooltipTrigger>
              {collapsed && (
                <TooltipContent side="right">{project.name}</TooltipContent>
              )}
            </Tooltip>

            {!collapsed && currentProject?.id === project.id && (
              <div className="ml-3 space-y-0.5">
                {navItems.map((item) => {
                  const href = `/${currentWorkspace?.slug}/${project.id}/${item.href}`
                  const active = pathname.includes(`/${item.href}`)
                  return (
                    <Link
                      key={item.href}
                      href={href}
                      className={cn(
                        'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-colors',
                        active
                          ? 'bg-indigo-500/15 text-indigo-400 font-medium'
                          : 'text-muted hover:bg-white/5'
                      )}
                    >
                      <item.icon size={14} />
                      {item.label}
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="border-t border-subtle p-2">
        <Tooltip>
          <TooltipTrigger
            className="w-full flex items-center gap-2 px-2 py-2 rounded-lg text-muted hover:bg-white/5 transition-colors"
            onClick={() => signOut()}
          >
              <LogOut size={16} className="flex-shrink-0" />
              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="text-sm"
                  >
                    Çıkış
                  </motion.span>
                )}
              </AnimatePresence>
          </TooltipTrigger>
          {collapsed && <TooltipContent side="right">Çıkış</TooltipContent>}
        </Tooltip>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-16 w-6 h-6 rounded-full border border-subtle bg-card flex items-center justify-center hover:bg-white/10 transition-colors z-20"
      >
        <motion.div animate={{ rotate: collapsed ? 180 : 0 }}>
          <ChevronLeft size={12} />
        </motion.div>
      </button>
    </motion.aside>
  )
}

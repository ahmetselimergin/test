'use client'

import Link from 'next/link'
import { Kanban, ListTodo, Map, Timer } from 'lucide-react'
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip'

const views = [
  { href: 'board', icon: Kanban, label: 'Board' },
  { href: 'backlog', icon: ListTodo, label: 'Backlog' },
  { href: 'sprint', icon: Timer, label: 'Sprint' },
  { href: 'roadmap', icon: Map, label: 'Roadmap' },
] as const

interface Props {
  slug: string
  projectId: string
}

export function ProjectCardActions({ slug, projectId }: Props) {
  return (
    <div className="flex gap-1">
      {views.map(({ href, icon: Icon, label }) => (
        <Tooltip key={href}>
          <TooltipTrigger className="flex-1">
            <Link
              href={`/${slug}/${projectId}/${href}`}
              className="flex items-center justify-center h-8 w-full rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/8 transition-colors"
            >
              <Icon size={14} />
            </Link>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-[11px]">
            {label}
          </TooltipContent>
        </Tooltip>
      ))}
    </div>
  )
}

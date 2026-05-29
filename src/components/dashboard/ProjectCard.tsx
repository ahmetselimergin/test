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
      className="flex items-center gap-3.5 px-3.5 py-3 rounded-xl border border-border bg-card/40 hover:border-foreground/20 hover:bg-card transition-all group"
    >
      <div
        className="size-10 rounded-lg flex items-center justify-center text-[11px] font-bold text-white shrink-0"
        style={{ backgroundColor: project.color }}
      >
        {project.key.slice(0, 2)}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {project.name}
          </span>
          <span className="text-[11px] text-muted-foreground shrink-0 ml-2 tabular-nums">
            {doneIssues} / {totalIssues}
          </span>
        </div>
        <div className="h-[3px] bg-muted rounded-full overflow-hidden">
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

import Link from 'next/link'
import { Kanban } from 'lucide-react'
import type { Project } from '@/lib/supabase/types'

const METHODOLOGY_LABELS: Record<string, string> = {
  kanban: 'Kanban',
  scrum: 'Scrum',
}

interface ProjectCardProps {
  project: Project
  totalIssues: number
  doneIssues: number
  workspaceSlug: string
}

export function ProjectCard({ project, totalIssues, doneIssues, workspaceSlug }: ProjectCardProps) {
  const pct = totalIssues > 0 ? Math.min(100, Math.round((doneIssues / totalIssues) * 100)) : 0
  const remaining = totalIssues - doneIssues

  return (
    <Link
      href={`/${workspaceSlug}/${project.id}/board`}
      className="group flex items-center gap-4 px-4 py-3.5 rounded-xl border border-border bg-card hover:bg-card/80 hover:border-foreground/15 transition-all duration-150"
    >
      {/* Logo / key icon */}
      <div
        className="size-9 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
        style={{ backgroundColor: `${project.color}22`, border: `1px solid ${project.color}40` }}
      >
        {project.logo_url ? (
          <img src={project.logo_url} alt={project.name} className="size-full object-cover rounded-xl" />
        ) : (
          <span
            className="text-[11px] font-bold"
            style={{ color: project.color }}
          >
            {project.key.slice(0, 2)}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[13px] font-semibold text-foreground group-hover:text-primary transition-colors truncate">
            {project.name}
          </span>
          <span
            className="text-[10px] font-medium px-1.5 py-px rounded shrink-0"
            style={{ color: project.color, backgroundColor: `${project.color}18` }}
          >
            {METHODOLOGY_LABELS[project.methodology] ?? project.methodology}
          </span>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2.5">
          <div className="flex-1 h-[3px] bg-muted rounded-full overflow-hidden">
            <div
              className="h-[3px] rounded-full transition-all duration-700"
              style={{ width: `${pct}%`, backgroundColor: project.color }}
            />
          </div>
          <span className="text-[11px] text-muted-foreground tabular-nums shrink-0">
            {doneIssues}/{totalIssues}
          </span>
        </div>
      </div>

      {/* Completion + remaining */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        <span
          className="text-[13px] font-bold tabular-nums"
          style={{ color: pct === 100 ? '#34d399' : project.color }}
        >
          {pct}%
        </span>
        {remaining > 0 && (
          <span className="text-[10px] text-muted-foreground tabular-nums">
            {remaining} kaldı
          </span>
        )}
        {pct === 100 && (
          <span className="text-[10px] text-emerald-400 font-medium">Tamamlandı</span>
        )}
      </div>
    </Link>
  )
}

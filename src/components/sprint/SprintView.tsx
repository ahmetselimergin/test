'use client'
import { useProjectStore } from '@/lib/stores/project.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import { SprintCard } from './SprintCard'
import { BurndownChart } from './BurndownChart'

export function SprintView() {
  const { sprints } = useProjectStore()
  const { issues } = useIssueStore()

  const activeSprint = sprints.find((s) => s.status === 'active')
  const activeIssues = activeSprint
    ? issues.filter((i) => i.sprint_id === activeSprint.id)
    : []

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Sprint</h1>

      {activeSprint && (
        <BurndownChart sprint={activeSprint} issues={activeIssues} />
      )}

      <div className="space-y-4">
        <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          Sprint&apos;ler
        </h2>
        {sprints.length === 0 && (
          <p className="text-sm text-muted-foreground">Henüz sprint yok.</p>
        )}
        {sprints.map((sprint) => (
          <SprintCard
            key={sprint.id}
            sprint={sprint}
            issues={issues.filter((i) => i.sprint_id === sprint.id)}
          />
        ))}
      </div>
    </div>
  )
}

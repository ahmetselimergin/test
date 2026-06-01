'use client'
import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useProjectStore } from '@/lib/stores/project.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import { SprintCard } from './SprintCard'
import { BurndownChart } from './BurndownChart'
import { CreateSprintDialog } from './CreateSprintDialog'
import { Button } from '@/components/ui/button'

export function SprintView() {
  const { sprints, currentProject } = useProjectStore()
  const { issues } = useIssueStore()
  const [createOpen, setCreateOpen] = useState(false)

  const activeSprint = sprints.find((s) => s.status === 'active')
  const activeIssues = activeSprint
    ? issues.filter((i) => i.sprint_id === activeSprint.id)
    : []

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Sprint</h1>
        {currentProject && (
          <Button size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} className="mr-1.5" />
            Sprint Oluştur
          </Button>
        )}
      </div>

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

      {currentProject && (
        <CreateSprintDialog
          projectId={currentProject.id}
          open={createOpen}
          onOpenChange={setCreateOpen}
        />
      )}
    </div>
  )
}

'use client'
import { useMemo, useState } from 'react'
import { useIssueStore } from '@/lib/stores/issue.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { BacklogGroup } from './BacklogGroup'
import type { Project } from '@/lib/supabase/types'

type GroupBy = 'epic' | 'priority' | 'none'

const groupByLabels: Record<GroupBy, string> = {
  epic: 'Epic\'e Göre',
  priority: 'Önceliğe Göre',
  none: 'Gruplandırma Yok',
}

export function BacklogView({ project }: { project: Project }) {
  const { issues } = useIssueStore()
  const { epics } = useProjectStore()
  const [groupBy, setGroupBy] = useState<GroupBy>('epic')

  const backlogIssues = useMemo(
    () => issues.filter((i) => !i.sprint_id),
    [issues]
  )

  const groups = useMemo(() => {
    if (groupBy === 'epic') {
      const epicGroups = epics.map((epic) => ({
        id: epic.id,
        title: epic.title,
        color: epic.color,
        issues: backlogIssues.filter((i) => i.epic_id === epic.id),
      }))
      const noEpic = backlogIssues.filter((i) => !i.epic_id)
      return [
        ...epicGroups,
        { id: 'none', title: 'Epic Yok', color: undefined, issues: noEpic },
      ]
    }

    if (groupBy === 'priority') {
      return (['critical', 'high', 'medium', 'low'] as const).map((p) => ({
        id: p,
        title: p.charAt(0).toUpperCase() + p.slice(1),
        color: undefined,
        issues: backlogIssues.filter((i) => i.priority === p),
      }))
    }

    return [
      {
        id: 'all',
        title: 'Tüm Issue\'lar',
        color: undefined,
        issues: backlogIssues,
      },
    ]
  }, [backlogIssues, epics, groupBy])

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Backlog</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted">Grupla:</span>
          <div className="flex gap-1">
            {(Object.keys(groupByLabels) as GroupBy[]).map((key) => (
              <button
                key={key}
                onClick={() => setGroupBy(key)}
                className={`px-3 py-1 rounded-md text-xs transition-colors ${
                  groupBy === key
                    ? 'bg-indigo-500/15 text-indigo-400 font-medium'
                    : 'text-muted hover:bg-white/5'
                }`}
              >
                {groupByLabels[key]}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {groups.map((group) => (
          <BacklogGroup
            key={group.id}
            title={group.title}
            issues={group.issues}
            project={project}
            color={group.color}
          />
        ))}
      </div>
    </div>
  )
}

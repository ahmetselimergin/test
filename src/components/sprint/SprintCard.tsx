'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { Play, CheckCircle, Calendar, ChevronRight } from 'lucide-react'
import type { Sprint, Issue } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Card, CardHeader, CardContent } from '@/components/ui/card'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'
import { createClient } from '@/lib/supabase/client'
import { useProjectStore } from '@/lib/stores/project.store'
import { IssueRow } from '@/components/issues/IssueRow'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface SprintCardProps {
  sprint: Sprint
  issues: Issue[]
}

export function SprintCard({ sprint, issues }: SprintCardProps) {
  const { setSprints, sprints } = useProjectStore()
  const currentProject = useProjectStore((s) => s.currentProject)
  const [issuesOpen, setIssuesOpen] = useState(sprint.status === 'active')
  const doneIssues = issues.filter((i) => i.status === 'done').length
  const progress = issues.length > 0 ? (doneIssues / issues.length) * 100 : 0

  async function handleStart() {
    const supabase = createClient()
    await supabase.from('sprints').update({ status: 'active' }).eq('id', sprint.id)
    setSprints(sprints.map((s) => (s.id === sprint.id ? { ...s, status: 'active' } : s)))
  }

  async function handleComplete() {
    const supabase = createClient()
    await supabase.from('sprints').update({ status: 'completed' }).eq('id', sprint.id)
    setSprints(sprints.map((s) => (s.id === sprint.id ? { ...s, status: 'completed' } : s)))
  }

  const borderColor = {
    planned: 'border-slate-500/30',
    active: 'border-indigo-500/40',
    completed: 'border-emerald-500/30',
  }[sprint.status]

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Card className={cn('rounded-xl', borderColor)}>
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-semibold">{sprint.name}</h3>
                {sprint.status === 'active' ? (
                  <Badge variant="default">Aktif</Badge>
                ) : sprint.status === 'completed' ? (
                  <Badge variant="secondary">Tamamlandı</Badge>
                ) : (
                  <Badge variant="secondary">Planlandı</Badge>
                )}
              </div>
              {sprint.goal && (
                <p className="text-sm text-muted-foreground">{sprint.goal}</p>
              )}
              {sprint.start_date && sprint.end_date && (
                <div className="flex items-center gap-1.5 mt-1 text-xs text-muted-foreground">
                  <Calendar size={11} />
                  {format(parseISO(sprint.start_date), 'd MMM', { locale: tr })} —{' '}
                  {format(parseISO(sprint.end_date), 'd MMM yyyy', { locale: tr })}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {sprint.status === 'planned' && (
                <Button
                  size="sm"
                  onClick={handleStart}
                  className="h-8 text-xs bg-indigo-600 hover:bg-indigo-500"
                >
                  <Play size={12} className="mr-1" />
                  Başlat
                </Button>
              )}
              {sprint.status === 'active' && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={handleComplete}
                  className="h-8 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                >
                  <CheckCircle size={12} className="mr-1" />
                  Tamamla
                </Button>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <div className="flex items-center gap-3">
            <Progress value={progress} className="flex-1 h-1.5" />
            <span className="text-xs text-muted-foreground">
              {doneIssues}/{issues.length}
            </span>
          </div>
        </CardContent>

        {currentProject && (
          <Collapsible open={issuesOpen} onOpenChange={setIssuesOpen}>
            <CollapsibleTrigger className="w-full flex items-center gap-2 px-4 py-2 border-t border-border hover:bg-muted/30 transition-colors">
              <motion.div animate={{ rotate: issuesOpen ? 90 : 0 }} transition={{ duration: 0.15 }}>
                <ChevronRight size={12} className="text-muted-foreground" />
              </motion.div>
              <span className="text-[11px] text-muted-foreground">
                Issue&apos;lar ({issues.length})
              </span>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="px-2 pb-2">
                {issues.length === 0 ? (
                  <p className="text-[12px] text-muted-foreground text-center py-3">
                    Issue yok — backlog&apos;dan sağ tıkla ekle
                  </p>
                ) : (
                  issues.map((issue) => (
                    <IssueRow key={issue.id} issue={issue} project={currentProject} />
                  ))
                )}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}
      </Card>
    </motion.div>
  )
}

'use client'
import { motion } from 'framer-motion'
import { Play, CheckCircle, Calendar } from 'lucide-react'
import type { Sprint, Issue } from '@/lib/supabase/types'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { createClient } from '@/lib/supabase/client'
import { useProjectStore } from '@/lib/stores/project.store'
import { format, parseISO } from 'date-fns'
import { tr } from 'date-fns/locale'
import { cn } from '@/lib/utils'

interface SprintCardProps {
  sprint: Sprint
  issues: Issue[]
}

export function SprintCard({ sprint, issues }: SprintCardProps) {
  const { setSprints, sprints } = useProjectStore()
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
      className={cn('bg-card border rounded-xl p-5', borderColor)}
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-semibold">{sprint.name}</h3>
            <span
              className={cn(
                'text-xs px-2 py-0.5 rounded-full font-medium',
                sprint.status === 'active'
                  ? 'bg-indigo-500/15 text-indigo-400'
                  : sprint.status === 'completed'
                  ? 'bg-emerald-500/15 text-emerald-400'
                  : 'bg-slate-500/15 text-slate-400'
              )}
            >
              {sprint.status === 'active'
                ? 'Aktif'
                : sprint.status === 'completed'
                ? 'Tamamlandı'
                : 'Planlandı'}
            </span>
          </div>
          {sprint.goal && (
            <p className="text-sm text-muted">{sprint.goal}</p>
          )}
          {sprint.start_date && sprint.end_date && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-muted">
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

      <div className="flex items-center gap-3">
        <Progress value={progress} className="flex-1 h-1.5" />
        <span className="text-xs text-muted">
          {doneIssues}/{issues.length}
        </span>
      </div>
    </motion.div>
  )
}

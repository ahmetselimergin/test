'use client'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'
import type { Sprint, Issue } from '@/lib/supabase/types'
import {
  eachDayOfInterval,
  format,
  parseISO,
  differenceInDays,
  isAfter,
} from 'date-fns'
import { tr } from 'date-fns/locale'

interface BurndownChartProps {
  sprint: Sprint
  issues: Issue[]
}

export function BurndownChart({ sprint, issues }: BurndownChartProps) {
  if (!sprint.start_date || !sprint.end_date) return null

  const start = parseISO(sprint.start_date)
  const end = parseISO(sprint.end_date)
  const today = new Date()

  const totalPoints = issues.reduce((sum, i) => sum + (i.estimate ?? 1), 0)
  const donePoints = issues
    .filter((i) => i.status === 'done')
    .reduce((sum, i) => sum + (i.estimate ?? 1), 0)
  const remaining = totalPoints - donePoints
  const days = eachDayOfInterval({ start, end })
  const sprintLength = Math.max(days.length - 1, 1)
  const daysPassed = Math.max(
    0,
    Math.min(differenceInDays(today, start), sprintLength)
  )

  const data = days.map((day, i) => {
    const ideal = Math.round(totalPoints - (totalPoints / sprintLength) * i)
    let actual: number | undefined
    if (!isAfter(day, today)) {
      actual =
        daysPassed === 0
          ? totalPoints
          : Math.max(
              0,
              Math.round(totalPoints - (totalPoints - remaining) * (i / daysPassed))
            )
    }
    return {
      date: format(day, 'd MMM', { locale: tr }),
      ideal,
      actual,
    }
  })

  return (
    <div className="bg-card border border-border rounded-xl p-5">
      <h3 className="text-sm font-medium mb-4">Burndown Chart</h3>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
          <XAxis
            dataKey="date"
            tick={{ fontSize: 11, fill: 'rgb(148, 163, 184)' }}
          />
          <YAxis tick={{ fontSize: 11, fill: 'rgb(148, 163, 184)' }} />
          <Tooltip
            contentStyle={{
              background: 'rgb(26, 26, 46)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 8,
              fontSize: 12,
              color: 'rgb(248, 250, 252)',
            }}
          />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="rgba(99,102,241,0.4)"
            strokeDasharray="5 5"
            dot={false}
            name="İdeal"
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="rgb(99,102,241)"
            strokeWidth={2}
            dot={{ fill: 'rgb(99,102,241)', r: 3 }}
            connectNulls={false}
            name="Gerçek"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

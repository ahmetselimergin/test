'use client'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { motion } from 'framer-motion'
import { Plus, MoreHorizontal } from 'lucide-react'
import type { BoardColumn as BoardColumnType, Issue, Project } from '@/lib/supabase/types'
import { IssueCard } from '@/components/issues/IssueCard'
import { cn } from '@/lib/utils'

interface BoardColumnProps {
  column: BoardColumnType
  issues: Issue[]
  project: Project
}

export function BoardColumn({ column, issues, project }: BoardColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const sorted = [...issues].sort((a, b) => a.order - b.order)
  const isOverLimit = column.wip_limit !== null && issues.length > column.wip_limit

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      className="flex-shrink-0 w-72 flex flex-col"
    >
      {/* Column header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: column.color }} />
          <span className="text-sm font-medium">{column.name}</span>
          <span
            className={cn(
              'text-xs px-1.5 py-0.5 rounded-full font-medium',
              isOverLimit
                ? 'bg-rose-500/15 text-rose-400'
                : 'bg-white/5 text-muted'
            )}
          >
            {issues.length}
            {column.wip_limit != null && `/${column.wip_limit}`}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button className="p-1 rounded hover:bg-white/5 text-muted hover:text-foreground transition-colors">
            <Plus size={14} />
          </button>
          <button className="p-1 rounded hover:bg-white/5 text-muted hover:text-foreground transition-colors">
            <MoreHorizontal size={14} />
          </button>
        </div>
      </div>

      {/* Drop zone */}
      <div
        ref={setNodeRef}
        className={cn(
          'flex-1 rounded-xl p-2 space-y-2 min-h-[200px] transition-colors',
          isOver ? 'bg-indigo-500/5 border border-indigo-500/30' : 'bg-white/[0.02]'
        )}
      >
        <SortableContext
          items={sorted.map((i) => i.id)}
          strategy={verticalListSortingStrategy}
        >
          {sorted.map((issue) => (
            <IssueCard key={issue.id} issue={issue} project={project} />
          ))}
        </SortableContext>
      </div>
    </motion.div>
  )
}

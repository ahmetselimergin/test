'use client'

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { Plus, MoreHorizontal } from 'lucide-react'
import type { BoardColumn as BoardColumnType, Issue, Project, MemberSummary } from '@/lib/supabase/types'
import { IssueCard } from '@/components/issues/IssueCard'
import { CreateIssueDialog } from '@/components/board/CreateIssueDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface BoardColumnProps {
  column: BoardColumnType
  issues: Issue[]
  project: Project
  workspaceSlug: string
  members: MemberSummary[]
}

export function BoardColumn({
  column,
  issues,
  project,
  workspaceSlug,
  members,
}: BoardColumnProps) {
  const [createOpen, setCreateOpen] = useState(false)
  // Droppable covers the ENTIRE column (header + card area) so the user
  // can drag over any part of the column, not just the card container.
  const { setNodeRef, isOver } = useDroppable({ id: column.id })
  const sorted = [...issues].sort((a, b) => a.order - b.order)
  const isOverLimit =
    column.wip_limit !== null && issues.length >= column.wip_limit

  return (
    <div ref={setNodeRef} className="flex-shrink-0 w-[272px] flex flex-col h-full">
      <div className="flex items-center justify-between gap-2 mb-2 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="size-1.5 rounded-full shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <h3 className="text-[11px] font-semibold uppercase tracking-widest text-foreground truncate">
            {column.name}
          </h3>
          <span
            className={cn(
              'text-[11px] font-mono px-1 py-0 rounded tabular-nums',
              isOverLimit
                ? 'bg-rose-500/15 text-rose-400'
                : 'bg-subtle text-muted'
            )}
          >
            {issues.length}
            {column.wip_limit != null && ` / ${column.wip_limit}`}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 text-muted"
            onClick={() => setCreateOpen(true)}
            aria-label="Add issue"
          >
            <Plus size={13} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex size-6 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-foreground">
              <MoreHorizontal size={13} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                Add issue
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Edit column</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <CreateIssueDialog
        project={project}
        column={column}
        workspaceSlug={workspaceSlug}
        members={members}
        open={createOpen}
        onOpenChange={setCreateOpen}
      />

      <div
        className={cn(
          'flex-1 rounded-lg border p-1.5 flex flex-col gap-1.5 min-h-[120px] overflow-y-auto transition-colors',
          isOver
            ? 'border-accent/50 bg-accent/5'
            : 'border-subtle bg-card/40'
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
        {sorted.length === 0 && (
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="w-full py-5 text-xs text-muted hover:text-accent border border-dashed border-subtle rounded-lg hover:border-accent/40 transition-colors"
          >
            + Add issue
          </button>
        )}
      </div>
    </div>
  )
}

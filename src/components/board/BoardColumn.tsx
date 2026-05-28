'use client'

import { useState } from 'react'
import { useSortable, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Plus, MoreHorizontal, Trash2, GripVertical } from 'lucide-react'
import { toast } from 'sonner'
import type { BoardColumn as BoardColumnType, Issue, Project, MemberSummary } from '@/lib/supabase/types'
import { IssueCard } from '@/components/issues/IssueCard'
import { CreateIssueDialog } from '@/components/board/CreateIssueDialog'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useProjectStore } from '@/lib/stores/project.store'
import { useIssueStore } from '@/lib/stores/issue.store'
import { deleteBoardColumn, renameBoardColumn } from '@/app/actions/board'
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
  const [deleting, setDeleting] = useState(false)
  const [name, setName] = useState(column.name)
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
    isOver,
  } = useSortable({ id: column.id, data: { type: 'column' } })
  const removeColumn = useProjectStore((s) => s.removeColumn)
  const { issues: allIssues, setIssues } = useIssueStore()
  const sorted = [...issues].sort((a, b) => a.order - b.order)
  const isOverLimit = column.wip_limit !== null && issues.length >= column.wip_limit

  async function handleDelete() {
    if (issues.length > 0) {
      const confirmed = window.confirm(
        `"${column.name}" kolonunda ${issues.length} issue var. Kolon silinirse bu issue'lar da silinir. Devam edilsin mi?`
      )
      if (!confirmed) return
    }
    setDeleting(true)
    const result = await deleteBoardColumn(column.id, workspaceSlug, project.id)
    if (result.error) {
      toast.error(result.error)
      setDeleting(false)
      return
    }
    removeColumn(column.id)
    setIssues(allIssues.filter((i) => i.board_column_id !== column.id))
    toast.success(`"${column.name}" silindi`)
  }

  async function handleRename() {
    const trimmed = name.trim()
    if (!trimmed || trimmed === column.name) { setName(column.name); return }
    useProjectStore.getState().updateColumn(column.id, { name: trimmed })
    const result = await renameBoardColumn(column.id, trimmed)
    if (result.error) {
      toast.error(result.error)
      setName(column.name)
      useProjectStore.getState().updateColumn(column.id, { name: column.name })
    }
  }

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn('flex-shrink-0 w-[272px] flex flex-col h-full', isDragging && 'opacity-50')}
    >
      <div className="flex items-center justify-between gap-2 mb-3 px-0.5">
        <div className="flex items-center gap-2 min-w-0">
          <button
            {...attributes}
            {...listeners}
            className="shrink-0 text-muted hover:text-foreground cursor-grab active:cursor-grabbing"
            aria-label="Drag to reorder"
          >
            <GripVertical size={14} />
          </button>
          <span
            className="size-2 rounded-full shrink-0"
            style={{ backgroundColor: column.color }}
          />
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            onBlur={handleRename}
            onKeyDown={e => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') { setName(column.name); e.currentTarget.blur() }
            }}
            className="bg-transparent text-[12px] font-semibold outline-none focus:ring-1 focus:ring-accent/40 rounded px-1 -mx-1 w-full truncate tracking-tight text-foreground"
          />
          <span
            className={cn(
              'text-[11px] font-semibold px-1.5 py-0 rounded-md tabular-nums',
              isOverLimit
                ? 'bg-rose-500/15 text-rose-400'
                : 'bg-[rgb(var(--bg-subtle))] text-muted'
            )}
          >
            {issues.length}
            {column.wip_limit != null && `/${column.wip_limit}`}
          </span>
        </div>
        <div className="flex items-center gap-0.5">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="size-6 text-muted hover:text-foreground"
            onClick={() => setCreateOpen(true)}
            aria-label="Add issue"
          >
            <Plus size={14} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex size-6 items-center justify-center rounded-md text-muted hover:bg-subtle hover:text-foreground">
              <MoreHorizontal size={14} />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => setCreateOpen(true)}>
                Issue ekle
              </DropdownMenuItem>
              <DropdownMenuItem disabled>Kolonu düzenle</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={handleDelete}
                disabled={deleting}
                className="text-rose-400 focus:text-rose-400"
              >
                <Trash2 size={13} />
                {deleting ? 'Siliniyor...' : 'Kolonu sil'}
              </DropdownMenuItem>
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
          'flex-1 rounded-xl border p-2 flex flex-col gap-2 min-h-[120px] overflow-y-auto transition-all duration-200',
          isOver
            ? 'border-accent/50 bg-accent/5'
            : 'border-subtle bg-[rgb(var(--bg-subtle)/0.4)]'
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

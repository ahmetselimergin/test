'use client'

import { useState } from 'react'
import { Trash2, ExternalLink, ArrowRight, Calendar } from 'lucide-react'
import { toast } from 'sonner'
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuSub,
  ContextMenuSubContent,
  ContextMenuSubTrigger,
  ContextMenuTrigger,
} from '@/components/ui/context-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { useIssueStore } from '@/lib/stores/issue.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { deleteIssue, moveIssueToBoardColumn } from '@/app/actions/board'
import { assignIssueToSprint } from '@/app/actions/sprint'
import { cn, priorityConfig } from '@/lib/utils'
import type { Issue, Priority } from '@/lib/supabase/types'
import { createClient } from '@/lib/supabase/client'

interface IssueCardContextMenuProps {
  issue: Issue
  children: React.ReactNode
}

const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low']

const PRIORITY_DOT: Record<Priority, string> = {
  critical: 'bg-rose-500',
  high: 'bg-orange-500',
  medium: 'bg-amber-400',
  low: 'bg-slate-400',
}

const STATUS_MAP: Record<string, string> = {
  'Todo': 'todo',
  'In Progress': 'in_progress',
  'Review': 'review',
  'Done': 'done',
}

export function IssueCardContextMenu({ issue, children }: IssueCardContextMenuProps) {
  const [deleteOpen, setDeleteOpen] = useState(false)
  const { setSelectedIssue, removeIssue, updateIssue } = useIssueStore()
  const columns = useProjectStore((s) => s.columns)
  const supabase = createClient()

  async function handleMoveToColumn(columnId: string, columnName: string) {
    const newStatus = STATUS_MAP[columnName] ?? issue.status
    updateIssue(issue.id, { board_column_id: columnId, status: newStatus as Issue['status'] })
    const result = await moveIssueToBoardColumn(issue.id, columnId, newStatus)
    if ('error' in result && result.error) {
      updateIssue(issue.id, { board_column_id: issue.board_column_id, status: issue.status })
      toast.error(result.error)
    }
  }

  async function handlePriorityChange(priority: Priority) {
    updateIssue(issue.id, { priority })
    const { error } = await supabase.from('issues').update({ priority }).eq('id', issue.id)
    if (error) {
      updateIssue(issue.id, { priority: issue.priority })
      toast.error(error.message)
    }
  }

  async function handleDelete() {
    removeIssue(issue.id)
    const result = await deleteIssue(issue.id)
    if ('error' in result && result.error) {
      toast.error(result.error)
    }
  }

  const otherColumns = columns.filter((c) => c.id !== issue.board_column_id)

  const sprints = useProjectStore((s) => s.sprints).filter(
    (s) => s.status !== 'completed'
  )

  async function handleSprintAssign(sprintId: string | null) {
    const prevSprintId = issue.sprint_id
    updateIssue(issue.id, { sprint_id: sprintId })
    const result = await assignIssueToSprint(issue.id, sprintId)
    if ('error' in result && result.error) {
      updateIssue(issue.id, { sprint_id: prevSprintId })
      toast.error(result.error)
    }
  }

  return (
    <>
      <ContextMenu>
        <ContextMenuTrigger>{children}</ContextMenuTrigger>
        <ContextMenuContent className="w-52">
          <ContextMenuItem
            className="gap-2 cursor-pointer"
            onClick={() => setSelectedIssue(issue)}
          >
            <ExternalLink size={13} className="text-muted-foreground" />
            Detayı Aç
          </ContextMenuItem>

          <ContextMenuSeparator />

          {/* Move to column */}
          {otherColumns.length > 0 && (
            <ContextMenuSub>
              <ContextMenuSubTrigger className="gap-2 cursor-pointer">
                <ArrowRight size={13} className="text-muted-foreground" />
                Kolona Taşı
              </ContextMenuSubTrigger>
              <ContextMenuSubContent className="w-44">
                {otherColumns.map((col) => (
                  <ContextMenuItem
                    key={col.id}
                    className="gap-2 cursor-pointer"
                    onClick={() => handleMoveToColumn(col.id, col.name)}
                  >
                    <span
                      className="size-2 rounded-full shrink-0"
                      style={{ backgroundColor: col.color }}
                    />
                    {col.name}
                  </ContextMenuItem>
                ))}
              </ContextMenuSubContent>
            </ContextMenuSub>
          )}

          {/* Assign to sprint */}
          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2 cursor-pointer">
              <Calendar size={13} className="text-muted-foreground" />
              Sprint'e Ekle
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-48">
              {sprints.length === 0 ? (
                <ContextMenuItem disabled className="text-[12px] text-muted-foreground">
                  Sprint yok
                </ContextMenuItem>
              ) : (
                sprints.map((sprint) => (
                  <ContextMenuItem
                    key={sprint.id}
                    className="gap-2 cursor-pointer"
                    onClick={() => handleSprintAssign(sprint.id)}
                    disabled={issue.sprint_id === sprint.id}
                  >
                    <span
                      className={cn(
                        'size-1.5 rounded-full shrink-0',
                        sprint.status === 'active' ? 'bg-indigo-400' : 'bg-muted-foreground'
                      )}
                    />
                    <span className="truncate flex-1">{sprint.name}</span>
                    {issue.sprint_id === sprint.id && (
                      <span className="ml-auto text-[11px] text-muted-foreground">✓</span>
                    )}
                  </ContextMenuItem>
                ))
              )}
              {issue.sprint_id && (
                <div className="border-t border-border mt-1 pt-1">
                  <ContextMenuItem
                    className="gap-2 cursor-pointer text-muted-foreground"
                    onClick={() => handleSprintAssign(null)}
                  >
                    Sprint'ten çıkar
                  </ContextMenuItem>
                </div>
              )}
            </ContextMenuSubContent>
          </ContextMenuSub>

          {/* Change priority */}
          <ContextMenuSub>
            <ContextMenuSubTrigger className="gap-2 cursor-pointer">
              <span className={cn('size-2 rounded-full shrink-0', PRIORITY_DOT[issue.priority])} />
              Öncelik Değiştir
            </ContextMenuSubTrigger>
            <ContextMenuSubContent className="w-36">
              {PRIORITIES.map((p) => (
                <ContextMenuItem
                  key={p}
                  className="gap-2 cursor-pointer"
                  onClick={() => handlePriorityChange(p)}
                  disabled={issue.priority === p}
                >
                  <span className={cn('size-2 rounded-full shrink-0', PRIORITY_DOT[p])} />
                  <span className="flex-1">{priorityConfig[p].label}</span>
                  {issue.priority === p && <span className="text-[11px] text-muted-foreground">✓</span>}
                </ContextMenuItem>
              ))}
            </ContextMenuSubContent>
          </ContextMenuSub>

          <ContextMenuSeparator />

          <ContextMenuItem
            className="gap-2 cursor-pointer text-destructive focus:text-destructive focus:bg-destructive/10"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 size={13} />
            Sil
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Issue silinsin mi?</AlertDialogTitle>
            <AlertDialogDescription>
              <span className="font-medium text-foreground">{issue.title}</span> kalıcı olarak silinecek.
              Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Sil
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

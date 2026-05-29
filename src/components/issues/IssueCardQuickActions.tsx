'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useIssueStore } from '@/lib/stores/issue.store'
import { createClient } from '@/lib/supabase/client'
import type { Issue, MemberSummary, Priority } from '@/lib/supabase/types'
import { cn, priorityConfig } from '@/lib/utils'

interface IssueCardQuickActionsProps {
  issue: Issue
  members: MemberSummary[]
}

const PRIORITY_DOT: Record<Priority, string> = {
  critical: 'bg-rose-500',
  high:     'bg-orange-500',
  medium:   'bg-amber-400',
  low:      'bg-slate-400',
}

const PRIORITIES: Priority[] = ['critical', 'high', 'medium', 'low']

export function IssueCardQuickActions({ issue, members }: IssueCardQuickActionsProps) {
  const supabase = createClient()
  const assignee = members.find((m) => m.id === issue.assignee_id)

  async function handlePrioritySelect(selected: Priority) {
    useIssueStore.getState().updateIssue(issue.id, { priority: selected })
    await supabase.from('issues').update({ priority: selected }).eq('id', issue.id)
  }

  async function handleAssigneeSelect(selectedId: string | null) {
    useIssueStore.getState().updateIssue(issue.id, { assignee_id: selectedId })
    await supabase.from('issues').update({ assignee_id: selectedId }).eq('id', issue.id)
  }

  return (
    <>
      {/* Priority popover */}
      <Popover>
        <PopoverTrigger
          render={<span />}
          nativeButton={false}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
          className={cn(
            'size-[6px] rounded-full shrink-0 cursor-pointer transition-all hover:ring-2 hover:ring-current/30 hover:scale-125',
            PRIORITY_DOT[issue.priority],
          )}
          title={priorityConfig[issue.priority].label}
        />
        <PopoverContent className="w-36 p-1" side="top" align="start">
          {PRIORITIES.map((p) => (
            <button
              key={p}
              onClick={() => handlePrioritySelect(p)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors',
                issue.priority === p
                  ? 'bg-accent/10 text-accent'
                  : 'hover:bg-muted text-foreground',
              )}
            >
              <span className={cn('size-2 rounded-full shrink-0', PRIORITY_DOT[p])} />
              <span className="flex-1 text-left">{priorityConfig[p].label}</span>
              {issue.priority === p && <span className="ml-auto text-[11px]">✓</span>}
            </button>
          ))}
        </PopoverContent>
      </Popover>

      {/* Assignee popover */}
      <Popover>
        <PopoverTrigger
          render={<span />}
          nativeButton={false}
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          onPointerDown={(e: React.PointerEvent) => e.stopPropagation()}
          className="shrink-0 cursor-pointer"
        >
          {assignee ? (
            <Avatar className="size-6 border-2 border-card ring-1 ring-border transition-all hover:ring-2 hover:ring-primary/40">
              {assignee.avatar_url ? (
                <img
                  src={assignee.avatar_url}
                  alt={assignee.full_name ?? ''}
                  className="size-full object-cover rounded-full"
                />
              ) : (
                <AvatarFallback className="text-[9px] bg-accent/20 text-accent font-bold">
                  {(assignee.full_name ?? assignee.email ?? '?').slice(0, 2).toUpperCase()}
                </AvatarFallback>
              )}
            </Avatar>
          ) : (
            <span className="size-6 rounded-full border border-dashed border-border block transition-all hover:ring-2 hover:ring-primary/40" />
          )}
        </PopoverTrigger>
        <PopoverContent className="w-52 p-1" side="top" align="end">
          {members.map((m) => (
            <button
              key={m.id}
              onClick={() => handleAssigneeSelect(m.id)}
              className={cn(
                'w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] transition-colors',
                issue.assignee_id === m.id
                  ? 'bg-accent/10 text-accent'
                  : 'hover:bg-muted text-foreground',
              )}
            >
              <Avatar className="size-5 shrink-0">
                {m.avatar_url ? (
                  <img
                    src={m.avatar_url}
                    alt={m.full_name ?? ''}
                    className="size-full object-cover rounded-full"
                  />
                ) : (
                  <AvatarFallback className="text-[8px] bg-accent/20 text-accent font-bold">
                    {(m.full_name ?? m.email ?? '?').slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                )}
              </Avatar>
              <span className="truncate flex-1 text-left">{m.full_name ?? m.email ?? 'Unknown'}</span>
              {issue.assignee_id === m.id && <span className="ml-auto text-[11px]">✓</span>}
            </button>
          ))}
          {members.length === 0 && (
            <p className="px-2.5 py-2 text-[12px] text-muted-foreground">Üye yok</p>
          )}
          <div className="border-t border-border mt-1 pt-1">
            <button
              onClick={() => handleAssigneeSelect(null)}
              className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-[13px] text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
            >
              Atama kaldır
            </button>
          </div>
        </PopoverContent>
      </Popover>
    </>
  )
}

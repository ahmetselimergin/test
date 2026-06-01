'use client'

import { useState } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
import { motion } from 'framer-motion'
import type { Issue, Project, BoardColumn, MemberSummary } from '@/lib/supabase/types'
import { IssueRow } from '@/components/issues/IssueRow'
import { CreateIssueDialog } from '@/components/board/CreateIssueDialog'
import {
  Collapsible,
  CollapsibleTrigger,
  CollapsibleContent,
} from '@/components/ui/collapsible'

interface BacklogGroupProps {
  title: string
  issues: Issue[]
  project: Project
  color?: string
  epicId?: string
  defaultColumn?: BoardColumn
  workspaceSlug?: string
  members?: MemberSummary[]
}

export function BacklogGroup({
  title,
  issues,
  project,
  color,
  epicId,
  defaultColumn,
  workspaceSlug,
  members = [],
}: BacklogGroupProps) {
  const [open, setOpen] = useState(true)
  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <Collapsible open={open} onOpenChange={setOpen} defaultOpen>
        <div className="border border-border rounded-xl overflow-hidden">
          <CollapsibleTrigger className="w-full flex items-center gap-3 px-4 py-3 bg-white/[0.02] hover:bg-white/5 transition-colors">
            <motion.div animate={{ rotate: open ? 90 : 0 }} transition={{ duration: 0.15 }}>
              <ChevronRight size={14} className="text-muted-foreground" />
            </motion.div>
            {color && <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />}
            <span className="text-sm font-medium">{title}</span>
            <span className="text-xs text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded-full ml-auto">
              {issues.length}
            </span>
          </CollapsibleTrigger>

          <CollapsibleContent>
            <div className="px-2 py-1">
              {issues.map((issue) => (
                <IssueRow key={issue.id} issue={issue} project={project} />
              ))}
              {issues.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-3">Issue yok</p>
              )}
              {defaultColumn && workspaceSlug && (
                <button
                  onClick={() => setCreateOpen(true)}
                  className="w-full flex items-center gap-2 px-3 py-2 text-[12px] text-muted-foreground hover:text-foreground hover:bg-muted/40 rounded-lg transition-colors"
                >
                  <Plus size={12} />
                  Issue Ekle
                </button>
              )}
            </div>
          </CollapsibleContent>
        </div>
      </Collapsible>

      {defaultColumn && workspaceSlug && (
        <CreateIssueDialog
          project={project}
          column={defaultColumn}
          workspaceSlug={workspaceSlug}
          members={members}
          open={createOpen}
          onOpenChange={setCreateOpen}
          defaultEpicId={epicId}
        />
      )}
    </>
  )
}

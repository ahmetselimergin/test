'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { X, Trash2, Copy, Link2, ChevronDown, Check } from 'lucide-react'
import { useIssueStore } from '@/lib/stores/issue.store'
import { useProjectStore } from '@/lib/stores/project.store'
import { TypeIcon } from './TypeIcon'
import { PriorityBadge } from './PriorityBadge'
import { StatusBadge } from './StatusBadge'
import { IssueEditor } from './IssueEditor'
import { IssuePropertyRow } from './IssuePropertyRow'
import { formatIssueId, statusConfig, priorityConfig, typeConfig } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Separator } from '@/components/ui/separator'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { createClient } from '@/lib/supabase/client'
import type { Issue, IssueStatus, Priority, MemberSummary } from '@/lib/supabase/types'
import { toast } from 'sonner'
import { MemberPicker } from './MemberPicker'

function IssueDetailContent({
  issue,
  issueKey,
  onClose,
  members,
}: {
  issue: Issue
  issueKey: string | null
  onClose: () => void
  members: MemberSummary[]
}) {
  const { updateIssue, removeIssue } = useIssueStore()

  async function handleDelete() {
    const supabase = createClient()
    await supabase.from('issues').delete().eq('id', issue.id)
    removeIssue(issue.id)
    onClose()
    toast.success('Issue deleted')
  }

  async function handleStatusChange(status: IssueStatus) {
    updateIssue(issue.id, { status })
    const supabase = createClient()
    await supabase.from('issues').update({ status }).eq('id', issue.id)
  }

  async function handlePriorityChange(priority: Priority) {
    updateIssue(issue.id, { priority })
    const supabase = createClient()
    await supabase.from('issues').update({ priority }).eq('id', issue.id)
  }

  async function handleAssigneeChange(id: string | null) {
    updateIssue(issue.id, { assignee_id: id })
    const supabase = createClient()
    await supabase.from('issues').update({ assignee_id: id }).eq('id', issue.id)
  }

  function copyKey() {
    if (issueKey) {
      navigator.clipboard.writeText(issueKey)
      toast.success('Copied to clipboard')
    }
  }

  const statuses = Object.keys(statusConfig) as IssueStatus[]
  const priorities = Object.keys(priorityConfig) as Priority[]

  return (
    <>
      <div className="flex items-center justify-between px-5 h-11 border-b border-subtle shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <TypeIcon type={issue.type} size={18} />
          <button
            type="button"
            onClick={copyKey}
            className="font-mono text-sm text-accent hover:underline flex items-center gap-1"
          >
            {issueKey}
            <Copy size={12} className="opacity-60" />
          </button>
        </div>
        <div className="flex items-center gap-0.5">
          <Button variant="ghost" size="icon" className="size-8" onClick={copyKey}>
            <Link2 size={15} />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 text-destructive"
            onClick={handleDelete}
          >
            <Trash2 size={15} />
          </Button>
          <Button variant="ghost" size="icon" className="size-8" onClick={onClose}>
            <X size={16} />
          </Button>
        </div>
      </div>

      <div className="px-5 py-3 border-b border-subtle">
        <h2 className="text-lg font-semibold leading-snug tracking-tight">
          {issue.title}
        </h2>
      </div>

      <Tabs defaultValue="details" className="flex-1 flex flex-col min-h-0">
        <TabsList
          variant="line"
          className="px-5 w-full justify-start border-b border-subtle rounded-none bg-transparent h-10"
        >
          <TabsTrigger value="details" className="text-xs">
            Details
          </TabsTrigger>
          <TabsTrigger value="activity" className="text-xs">
            Activity
          </TabsTrigger>
          <TabsTrigger value="comments" className="text-xs">
            Comments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="details" className="flex-1 overflow-y-auto px-5 py-2 mt-0">
          <IssuePropertyRow label="Status">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 outline-none hover:opacity-75 transition-opacity">
                <StatusBadge status={issue.status} />
                <ChevronDown size={11} className="text-muted" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-44">
                {statuses.map((s) => (
                  <DropdownMenuItem key={s} onClick={() => handleStatusChange(s)}>
                    <StatusBadge status={s} />
                    {issue.status === s && <Check size={12} className="ml-auto text-accent shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </IssuePropertyRow>

          <IssuePropertyRow label="Priority">
            <DropdownMenu>
              <DropdownMenuTrigger className="flex items-center gap-1.5 outline-none hover:opacity-75 transition-opacity">
                <PriorityBadge priority={issue.priority} showLabel />
                <ChevronDown size={11} className="text-muted" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-40">
                {priorities.map((p) => (
                  <DropdownMenuItem key={p} onClick={() => handlePriorityChange(p)}>
                    <PriorityBadge priority={p} showLabel />
                    {issue.priority === p && <Check size={12} className="ml-auto text-accent shrink-0" />}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </IssuePropertyRow>

          <IssuePropertyRow label="Atanan">
            <MemberPicker
              members={members}
              value={issue.assignee_id}
              onChange={handleAssigneeChange}
            />
          </IssuePropertyRow>

          <IssuePropertyRow label="Type">
            <Badge variant="secondary" className="gap-1.5 font-normal">
              <TypeIcon type={issue.type} size={12} />
              {typeConfig[issue.type].label}
            </Badge>
          </IssuePropertyRow>

          <IssuePropertyRow label="Description">
            <IssueEditor
              mode="edit"
              issueId={issue.id}
              initialContent={issue.description ?? ''}
            />
          </IssuePropertyRow>

          {issue.labels.length > 0 && (
            <IssuePropertyRow label="Labels">
              <div className="flex flex-wrap gap-1.5">
                {issue.labels.map((label) => (
                  <Badge key={label} variant="outline">
                    {label}
                  </Badge>
                ))}
              </div>
            </IssuePropertyRow>
          )}
        </TabsContent>

        <TabsContent value="activity" className="flex-1 overflow-y-auto px-5 py-6 mt-0">
          <p className="text-sm text-muted text-center">Activity timeline coming soon</p>
        </TabsContent>

        <TabsContent value="comments" className="flex-1 overflow-y-auto px-5 py-6 mt-0">
          <p className="text-sm text-muted text-center">Comments coming soon</p>
        </TabsContent>
      </Tabs>

      <Separator />
      <div className="px-5 py-3 text-[11px] text-muted flex justify-between shrink-0">
        <span>Updated {new Date(issue.updated_at).toLocaleDateString('tr-TR')}</span>
        <span className="font-mono">#{issue.issue_number}</span>
      </div>
    </>
  )
}

export function IssueDetailPanel() {
  const { selectedIssue, setSelectedIssue } = useIssueStore()
  const currentProject = useProjectStore((s) => s.currentProject)
  const members = useProjectStore((s) => s.members)

  const issueKey =
    selectedIssue && currentProject
      ? formatIssueId(currentProject.key, selectedIssue.issue_number)
      : null

  return (
    <AnimatePresence>
      {selectedIssue && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]"
            onClick={() => setSelectedIssue(null)}
          />
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 36, stiffness: 420 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-[480px] z-50 flex flex-col surface-elevated border-l border-subtle shadow-panel"
          >
            <IssueDetailContent
              key={selectedIssue.id}
              issue={selectedIssue}
              issueKey={issueKey}
              onClose={() => setSelectedIssue(null)}
              members={members}
            />
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  )
}

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { createIssue } from '@/app/actions/board'
import { useIssueStore } from '@/lib/stores/issue.store'
import type { BoardColumn, Project } from '@/lib/supabase/types'

interface Props {
  project: Project
  column: BoardColumn
  workspaceSlug: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateIssueDialog({
  project,
  column,
  workspaceSlug,
  open,
  onOpenChange,
}: Props) {
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const addIssue = useIssueStore((s) => s.addIssue)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('project_id', project.id)
    formData.set('board_column_id', column.id)
    formData.set('workspace_slug', workspaceSlug)

    const result = await createIssue(formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (result.issue) {
      addIssue(result.issue)
    }
    toast.success('Görev oluşturuldu')
    onOpenChange(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {column.name} — Yeni Görev
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="issue-title">Başlık</Label>
            <Input
              id="issue-title"
              name="title"
              required
              autoFocus
              placeholder="Ne yapılacak?"
              className="bg-[rgb(var(--bg-card))] border-[rgb(var(--border-strong))]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="issue-type">Tür</Label>
              <select
                id="issue-type"
                name="type"
                defaultValue="task"
                className="w-full h-10 rounded-lg border border-[rgb(var(--border-strong))] bg-[rgb(var(--bg-card))] px-3 text-sm"
              >
                <option value="task">Task</option>
                <option value="story">Story</option>
                <option value="bug">Bug</option>
                <option value="feature">Feature</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="issue-priority">Öncelik</Label>
              <select
                id="issue-priority"
                name="priority"
                defaultValue="medium"
                className="w-full h-10 rounded-lg border border-[rgb(var(--border-strong))] bg-[rgb(var(--bg-card))] px-3 text-sm"
              >
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-accent text-white hover:opacity-90"
          >
            {loading ? 'Oluşturuluyor...' : 'Görev Ekle'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

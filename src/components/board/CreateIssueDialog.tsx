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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
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
  const [type, setType] = useState('task')
  const [priority, setPriority] = useState('medium')
  const router = useRouter()
  const addIssue = useIssueStore((s) => s.addIssue)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('project_id', project.id)
    formData.set('board_column_id', column.id)
    formData.set('workspace_slug', workspaceSlug)
    formData.set('type', type)
    formData.set('priority', priority)

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
              <Label>Tür</Label>
              <Select value={type} onValueChange={(v) => v && setType(v)}>
                <SelectTrigger className="w-full bg-[rgb(var(--bg-card))] border-[rgb(var(--border-strong))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="task">Task</SelectItem>
                  <SelectItem value="story">Story</SelectItem>
                  <SelectItem value="bug">Bug</SelectItem>
                  <SelectItem value="feature">Feature</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>Öncelik</Label>
              <Select value={priority} onValueChange={(v) => v && setPriority(v)}>
                <SelectTrigger className="w-full bg-[rgb(var(--bg-card))] border-[rgb(var(--border-strong))]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
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

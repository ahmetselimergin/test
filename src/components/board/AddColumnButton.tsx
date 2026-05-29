'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { createBoardColumn } from '@/app/actions/board'
import { useProjectStore } from '@/lib/stores/project.store'
import type { Project } from '@/lib/supabase/types'

const COLORS = ['#64748b', '#6366f1', '#f59e0b', '#10b981', '#8b5cf6', '#ec4899']

interface Props {
  project: Project
  workspaceSlug: string
}

export function AddColumnButton({ project, workspaceSlug }: Props) {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const addColumn = useProjectStore((s) => s.addColumn)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    const formData = new FormData(e.currentTarget)
    formData.set('project_id', project.id)
    formData.set('workspace_slug', workspaceSlug)

    const result = await createBoardColumn(formData)
    setLoading(false)

    if (result.error) {
      toast.error(result.error)
      return
    }

    if (result.column) {
      addColumn(result.column)
    }
    toast.success('Kolon eklendi')
    setOpen(false)
    router.refresh()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger className="flex-shrink-0 w-[272px] min-h-[120px] rounded-lg border border-dashed border-border flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-primary hover:border-primary/40 hover:bg-muted/20 transition-colors">
        <Plus size={16} />
        Add column
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Yeni Kolon</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="column-name">Kolon adı</Label>
            <Input
              id="column-name"
              name="name"
              required
              placeholder="Ör: Testing"
              className="border-foreground/20"
            />
          </div>
          <div className="space-y-1.5">
            <Label>Rengi</Label>
            <div className="flex gap-2 flex-wrap">
              {COLORS.map((color) => (
                <label key={color} className="cursor-pointer">
                  <input
                    type="radio"
                    name="color"
                    value={color}
                    defaultChecked={color === '#6366f1'}
                    className="sr-only peer"
                  />
                  <span
                    className="block w-8 h-8 rounded-lg border-2 border-transparent peer-checked:border-white"
                    style={{ backgroundColor: color }}
                  />
                </label>
              ))}
            </div>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading ? 'Ekleniyor...' : 'Kolon Oluştur'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

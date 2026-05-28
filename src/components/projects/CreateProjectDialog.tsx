'use client'

import { Plus } from 'lucide-react'
import { createProjectAction } from '@/app/actions/workspace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'

interface Props {
  workspaceId: string
}

export function CreateProjectDialog({ workspaceId }: Props) {
  return (
    <Dialog>
      <DialogTrigger className="inline-flex items-center gap-2 h-9 px-4 rounded-lg bg-accent text-sm font-medium text-white hover:opacity-90 transition-opacity">
        <Plus size={16} />
        Yeni Proje
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Proje Oluştur</DialogTitle>
        </DialogHeader>
        <form
          action={createProjectAction as unknown as (formData: FormData) => void}
          className="space-y-4"
        >
          <input type="hidden" name="workspace_id" value={workspaceId} />
          <div className="space-y-1.5">
            <Label htmlFor="name">Proje Adı</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ör: Mobile App"
              className="bg-white/5 border-white/10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="key">Proje Kodu</Label>
            <Input
              id="key"
              name="key"
              required
              maxLength={5}
              placeholder="MA"
              className="bg-white/5 border-white/10 uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="methodology">Metodoloji</Label>
            <select
              id="methodology"
              name="methodology"
              defaultValue="both"
              className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm"
            >
              <option value="both">Kanban + Scrum</option>
              <option value="kanban">Kanban</option>
              <option value="scrum">Scrum</option>
            </select>
          </div>
          <Button
            type="submit"
            className="w-full bg-accent text-white hover:opacity-90"
          >
            Oluştur
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

'use client'

import { useState } from 'react'
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

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#1e293b',
]

interface Props {
  workspaceId: string
}

export function CreateProjectDialog({ workspaceId }: Props) {
  const [color, setColor] = useState('#6366f1')
  const [name, setName] = useState('')
  const [key, setKey] = useState('')

  const autoKey = (n: string) =>
    n.split(' ').map((w) => w[0]).join('').slice(0, 4).toUpperCase()

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
          <input type="hidden" name="color" value={color} />

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-subtle bg-subtle/40">
            <div
              className="size-11 rounded-xl flex items-center justify-center text-white font-bold text-base shrink-0 transition-colors"
              style={{ backgroundColor: color }}
            >
              {key || autoKey(name) || '?'}
            </div>
            <div>
              <p className="text-[13px] font-semibold text-foreground">{name || 'Proje adı'}</p>
              <p className="text-[11px] text-muted">Önizleme</p>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="name">Proje Adı</Label>
            <Input
              id="name"
              name="name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                if (!key) setKey(autoKey(e.target.value))
              }}
              placeholder="Ör: Mobile App"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="key">Proje Kodu</Label>
            <Input
              id="key"
              name="key"
              required
              maxLength={5}
              value={key}
              onChange={(e) => setKey(e.target.value.toUpperCase())}
              placeholder="MA"
              className="uppercase"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="methodology">Metodoloji</Label>
            <select
              id="methodology"
              name="methodology"
              defaultValue="both"
              className="w-full h-10 rounded-lg border border-subtle bg-subtle/40 px-3 text-sm text-foreground"
            >
              <option value="both">Kanban + Scrum</option>
              <option value="kanban">Kanban</option>
              <option value="scrum">Scrum</option>
            </select>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Renk</Label>
            <div className="flex flex-wrap gap-2">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className="size-7 rounded-lg transition-all hover:scale-110"
                  style={{ backgroundColor: c, outline: color === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
                />
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full bg-accent text-white hover:opacity-90">
            Oluştur
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

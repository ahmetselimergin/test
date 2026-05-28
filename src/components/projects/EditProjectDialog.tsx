'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Settings2, Loader2 } from 'lucide-react'
import { updateProjectSettings } from '@/app/actions/workspace'
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

const PRESET_ICONS = ['🚀', '⚡', '🔥', '💡', '🎯', '🛠️', '📱', '🌐', '🔐', '💎', '🎨', '📊']

interface Props {
  project: {
    id: string
    name: string
    key: string
    color: string
    icon: string | null
  }
}

export function EditProjectDialog({ project }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(updateProjectSettings, null)
  const [name, setName] = useState(project.name)
  const [color, setColor] = useState(project.color)
  const [icon, setIcon] = useState(project.icon ?? '')
  const toastId = useRef<string | number | null>(null)

  useEffect(() => {
    if (!open) return
    setName(project.name)
    setColor(project.color)
    setIcon(project.icon ?? '')
  }, [open, project])

  useEffect(() => {
    if (pending) {
      toastId.current = toast.loading('Kaydediliyor...')
    } else {
      if (toastId.current) { toast.dismiss(toastId.current); toastId.current = null }
      if (state?.error) toast.error(state.error)
      if (state?.success) {
        toast.success('Proje güncellendi')
        setOpen(false)
        router.refresh()
      }
    }
  }, [pending, state, router])

  const preview = icon || project.key.slice(0, 2)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true) }}
        className="size-7 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/15 transition-colors"
        title="Düzenle"
      >
        <Settings2 size={13} />
      </button>
      <DialogContent className="max-w-md bg-card border-subtle">
        <DialogHeader>
          <DialogTitle>Projeyi Düzenle</DialogTitle>
        </DialogHeader>

        <form action={action} className="space-y-4">
          <input type="hidden" name="project_id" value={project.id} />
          <input type="hidden" name="color" value={color} />
          <input type="hidden" name="icon" value={icon} />

          {/* Preview */}
          <div className="flex items-center gap-3 p-3 rounded-xl border border-subtle bg-subtle/40">
            <div
              className="size-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0 transition-colors"
              style={{ backgroundColor: color }}
            >
              {preview}
            </div>
            <div>
              <p className="text-[14px] font-semibold text-foreground">{name || 'Proje adı'}</p>
              <p className="text-[11px] text-muted font-mono">{project.key}</p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <Label htmlFor="edit-name" className="text-[12px]">Proje Adı</Label>
            <Input
              id="edit-name"
              name="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={pending}
              className="h-9"
            />
          </div>

          {/* Emoji icon */}
          <div className="space-y-2">
            <Label className="text-[12px]">İkon (emoji)</Label>
            <div className="flex flex-wrap gap-1.5">
              {PRESET_ICONS.map((em) => (
                <button
                  key={em}
                  type="button"
                  onClick={() => setIcon(icon === em ? '' : em)}
                  className={`size-9 rounded-lg text-lg flex items-center justify-center transition-all border ${
                    icon === em
                      ? 'border-accent bg-accent/10'
                      : 'border-subtle hover:border-foreground/20 hover:bg-subtle/60'
                  }`}
                >
                  {em}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-muted">Seçilmezse proje kodu gösterilir</p>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label className="text-[12px]">Renk</Label>
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

          <Button type="submit" disabled={pending} className="w-full bg-accent text-white h-9">
            {pending ? (
              <span className="flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" />
                Kaydediliyor
              </span>
            ) : 'Kaydet'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

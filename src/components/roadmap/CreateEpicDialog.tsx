'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { createEpic } from '@/app/actions/roadmap'
import { useProjectStore } from '@/lib/stores/project.store'
import { cn } from '@/lib/utils'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#06b6d4',
]

interface CreateEpicDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateEpicDialog({
  projectId,
  open,
  onOpenChange,
}: CreateEpicDialogProps) {
  const [title, setTitle] = useState('')
  const [color, setColor] = useState(PRESET_COLORS[0])
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const addEpic = useProjectStore((s) => s.addEpic)

  function handleClose() {
    setTitle(''); setStartDate(''); setEndDate('')
    onOpenChange(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return
    setLoading(true)
    const result = await createEpic({
      projectId,
      title: title.trim(),
      color,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    setLoading(false)
    if ('error' in result && result.error) { toast.error(result.error); return }
    if ('epic' in result && result.epic) {
      addEpic(result.epic)
      toast.success('Epic oluşturuldu')
      handleClose()
    }
  }

  const inputCls =
    'w-full h-9 rounded-lg border border-border bg-card px-3 text-[13px] text-foreground outline-none focus:border-primary/50 transition-colors'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Epic Oluştur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-[12px] font-medium text-foreground block mb-1.5">
              Başlık *
            </label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Epic başlığı..."
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-foreground block mb-1.5">
              Renk
            </label>
            <div className="flex gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={cn(
                    'size-7 rounded-full transition-all',
                    color === c
                      ? 'ring-2 ring-offset-2 ring-offset-background ring-white/40 scale-110'
                      : 'hover:scale-105'
                  )}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[12px] font-medium text-foreground block mb-1.5">
                Başlangıç
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className="text-[12px] font-medium text-foreground block mb-1.5">
                Bitiş
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className={inputCls}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="ghost" size="sm" onClick={handleClose}>
              İptal
            </Button>
            <Button type="submit" size="sm" disabled={loading || !title.trim()}>
              {loading ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

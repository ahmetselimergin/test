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
import { createSprint } from '@/app/actions/sprint'
import { useProjectStore } from '@/lib/stores/project.store'

interface CreateSprintDialogProps {
  projectId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function CreateSprintDialog({
  projectId,
  open,
  onOpenChange,
}: CreateSprintDialogProps) {
  const [name, setName] = useState('')
  const [goal, setGoal] = useState('')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [loading, setLoading] = useState(false)
  const addSprint = useProjectStore((s) => s.addSprint)

  function handleClose() {
    setName(''); setGoal(''); setStartDate(''); setEndDate('')
    onOpenChange(false)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    const result = await createSprint({
      projectId,
      name: name.trim(),
      goal: goal.trim() || undefined,
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    })
    setLoading(false)
    if ('error' in result && result.error) { toast.error(result.error); return }
    if ('sprint' in result && result.sprint) {
      addSprint(result.sprint)
      toast.success('Sprint oluşturuldu')
      handleClose()
    }
  }

  const inputCls =
    'w-full h-9 rounded-lg border border-border bg-card px-3 text-[13px] text-foreground outline-none focus:border-primary/50 transition-colors'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Sprint Oluştur</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          <div>
            <label className="text-[12px] font-medium text-foreground block mb-1.5">
              İsim *
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Sprint 1"
              className={inputCls}
              autoFocus
            />
          </div>
          <div>
            <label className="text-[12px] font-medium text-foreground block mb-1.5">
              Hedef
            </label>
            <input
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="Bu sprint'te neyi tamamlıyoruz?"
              className={inputCls}
            />
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
            <Button type="submit" size="sm" disabled={loading || !name.trim()}>
              {loading ? 'Oluşturuluyor...' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

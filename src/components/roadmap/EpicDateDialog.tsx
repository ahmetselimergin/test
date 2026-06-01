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
import { updateEpicDates } from '@/app/actions/roadmap'
import { useProjectStore } from '@/lib/stores/project.store'
import type { Epic } from '@/lib/supabase/types'

interface EpicDateDialogProps {
  epic: Epic
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EpicDateDialog({ epic, open, onOpenChange }: EpicDateDialogProps) {
  const [startDate, setStartDate] = useState(epic.start_date?.slice(0, 10) ?? '')
  const [endDate, setEndDate] = useState(epic.end_date?.slice(0, 10) ?? '')
  const [loading, setLoading] = useState(false)
  const updateEpic = useProjectStore((s) => s.updateEpic)

  async function handleSave() {
    setLoading(true)
    updateEpic(epic.id, {
      start_date: startDate || null,
      end_date: endDate || null,
    })
    const result = await updateEpicDates(
      epic.id,
      startDate || null,
      endDate || null
    )
    setLoading(false)
    if ('error' in result && result.error) {
      updateEpic(epic.id, { start_date: epic.start_date, end_date: epic.end_date })
      toast.error(result.error)
      return
    }
    onOpenChange(false)
  }

  const inputCls =
    'w-full h-9 rounded-lg border border-border bg-card px-3 text-[13px] text-foreground outline-none focus:border-primary/50 transition-colors'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xs">
        <DialogHeader>
          <DialogTitle className="truncate text-[14px]">{epic.title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 pt-1">
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1.5">
              Başlangıç Tarihi
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground block mb-1.5">
              Bitiş Tarihi
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className={inputCls}
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              İptal
            </Button>
            <Button type="button" size="sm" disabled={loading} onClick={handleSave}>
              {loading ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

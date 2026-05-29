'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updateWorkspaceSettings } from '@/app/actions/workspace'
import { useWorkspaceStore } from '@/lib/stores/workspace.store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const PRESET_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#ef4444',
  '#f97316', '#eab308', '#22c55e', '#14b8a6',
  '#3b82f6', '#06b6d4', '#64748b', '#1e293b',
]

interface Props {
  workspaceId: string
  name: string
  color: string
}

export function WorkspaceSettingsForm({ workspaceId, name, color }: Props) {
  const router = useRouter()
  const [state, action, pending] = useActionState(updateWorkspaceSettings, null)
  const [nameValue, setNameValue] = useState(name)
  const [selectedColor, setSelectedColor] = useState(color)
  const toastId = useRef<string | number | null>(null)

  useEffect(() => {
    if (pending) {
      toastId.current = toast.loading('Kaydediliyor...')
    } else {
      if (toastId.current) { toast.dismiss(toastId.current); toastId.current = null }
      if (state?.error) toast.error(state.error)
      if (state?.success) {
        toast.success('Kaydedildi')
        // Store'u anında güncelle (sidebar + accent rengi hemen değişsin)
        const store = useWorkspaceStore.getState()
        if (store.currentWorkspace) {
          const updated = { ...store.currentWorkspace, name: nameValue, color: selectedColor }
          store.setCurrentWorkspace(updated)
          store.setWorkspaces(store.workspaces.map((w) => w.id === updated.id ? updated : w))
        }
        router.refresh()
      }
    }
  }, [pending, state, router])

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <input type="hidden" name="color" value={selectedColor} />

      {/* Preview */}
      <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/60 border border-border">
        <div
          className="size-10 rounded-xl flex items-center justify-center text-white font-bold text-[15px] shrink-0 transition-colors"
          style={{ backgroundColor: selectedColor }}
        >
          {nameValue.slice(0, 2).toUpperCase() || 'WS'}
        </div>
        <div>
          <p className="text-[13px] font-semibold text-foreground">{nameValue || 'Workspace adı'}</p>
          <p className="text-[11px] text-muted-foreground">Workspace önizlemesi</p>
        </div>
      </div>

      {/* Name */}
      <div className="space-y-1.5">
        <Label htmlFor="name" className="text-[12px]">Workspace adı</Label>
        <Input
          id="name"
          name="name"
          required
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          disabled={pending}
          className="h-9"
        />
      </div>

      {/* Color picker */}
      <div className="space-y-2">
        <Label className="text-[12px]">Renk</Label>
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setSelectedColor(c)}
              className="size-7 rounded-lg transition-all hover:scale-110"
              style={{ backgroundColor: c, outline: selectedColor === c ? `2px solid ${c}` : 'none', outlineOffset: '2px' }}
            />
          ))}
        </div>
      </div>

      <Button type="submit" disabled={pending} className="min-w-24 h-9">
        {pending ? (
          <span className="flex items-center gap-2">
            <Loader2 size={13} className="animate-spin" />
            Kaydediliyor
          </span>
        ) : 'Kaydet'}
      </Button>
    </form>
  )
}

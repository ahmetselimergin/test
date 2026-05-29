'use client'

import { useActionState, useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'
import { Loader2, Trash2, AlertTriangle } from 'lucide-react'
import { deleteWorkspace } from '@/app/actions/workspace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  workspaceId: string
  workspaceName: string
}

export function DangerZone({ workspaceId, workspaceName }: Props) {
  const [open, setOpen] = useState(false)
  const [state, action, pending] = useActionState(deleteWorkspace, null)
  const [confirmation, setConfirmation] = useState('')
  const toastId = useRef<string | number | null>(null)

  useEffect(() => {
    if (pending) {
      toastId.current = toast.loading('Workspace siliniyor...')
    } else {
      if (toastId.current) { toast.dismiss(toastId.current); toastId.current = null }
      if (state?.error) toast.error(state.error)
    }
  }, [pending, state])

  if (!open) {
    return (
      <Button
        variant="ghost"
        type="button"
        onClick={() => setOpen(true)}
        className="text-rose-500 hover:bg-rose-500/10 hover:text-rose-500 h-9 text-[13px] gap-2"
      >
        <Trash2 size={14} />
        Workspace'i Sil
      </Button>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-2.5 p-3 rounded-xl bg-rose-500/8 border border-rose-500/20">
        <AlertTriangle size={15} className="text-rose-400 mt-0.5 shrink-0" />
        <div>
          <p className="text-[13px] font-medium text-rose-400">Bu işlem geri alınamaz</p>
          <p className="text-[12px] text-muted-foreground mt-0.5">
            <span className="font-semibold text-foreground">{workspaceName}</span> workspace'i ve içindeki tüm projeler, issue'lar kalıcı olarak silinecek.
          </p>
        </div>
      </div>

      <form action={action} className="space-y-3">
        <input type="hidden" name="workspace_id" value={workspaceId} />
        <div className="space-y-1.5">
          <Label htmlFor="confirmation" className="text-[12px]">
            Onaylamak için <span className="font-mono font-semibold text-foreground">SİL</span> yazın
          </Label>
          <Input
            id="confirmation"
            name="confirmation"
            value={confirmation}
            onChange={(e) => setConfirmation(e.target.value)}
            placeholder="SİL"
            disabled={pending}
            className="h-9 font-mono"
          />
        </div>
        <div className="flex gap-2">
          <Button
            type="submit"
            variant="destructive"
            disabled={pending || confirmation !== 'SİL'}
            className="h-9 text-[13px] min-w-28"
          >
            {pending ? (
              <span className="flex items-center gap-2">
                <Loader2 size={13} className="animate-spin" />
                Siliniyor
              </span>
            ) : 'Workspace\'i Sil'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => { setOpen(false); setConfirmation('') }}
            disabled={pending}
            className="h-9 text-[13px]"
          >
            İptal
          </Button>
        </div>
      </form>
    </div>
  )
}

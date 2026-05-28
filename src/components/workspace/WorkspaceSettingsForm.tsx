'use client'

import { useActionState, useEffect, useRef } from 'react'
import { toast } from 'sonner'
import { Loader2 } from 'lucide-react'
import { updateWorkspaceSettings } from '@/app/actions/workspace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  workspaceId: string
  name: string
  slug: string
}

export function WorkspaceSettingsForm({ workspaceId, name, slug }: Props) {
  const [state, action, pending] = useActionState(updateWorkspaceSettings, null)
  const toastId = useRef<string | number | null>(null)

  useEffect(() => {
    if (pending) {
      toastId.current = toast.loading('Kaydediliyor...')
    } else {
      if (toastId.current) {
        toast.dismiss(toastId.current)
        toastId.current = null
      }
      if (state?.error) toast.error(state.error)
    }
  }, [pending, state])

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="workspace_id" value={workspaceId} />

      <div className="space-y-2">
        <Label htmlFor="name">Workspace adı</Label>
        <Input
          id="name"
          name="name"
          required
          defaultValue={name}
          disabled={pending}
          className="h-10"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="slug">URL slug</Label>
        <div className="flex items-center gap-2">
          <span className="text-[13px] text-muted shrink-0">localhost:3000/</span>
          <Input
            id="slug"
            name="slug"
            required
            defaultValue={slug}
            disabled={pending}
            className="h-10 font-mono text-sm"
            pattern="[a-z0-9-]+"
            title="Sadece küçük harf, rakam ve tire kullanılabilir"
          />
        </div>
        <p className="text-[11px] text-muted">Değiştirirsen URL'in değişir.</p>
      </div>

      <Button type="submit" disabled={pending} className="bg-accent text-white min-w-24">
        {pending ? (
          <span className="flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" />
            Kaydediliyor
          </span>
        ) : (
          'Kaydet'
        )}
      </Button>
    </form>
  )
}

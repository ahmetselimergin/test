'use client'

import { useActionState } from 'react'
import { useEffect } from 'react'
import { toast } from 'sonner'
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

  useEffect(() => {
    if (state?.error) toast.error(state.error)
  }, [state])

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
            className="h-10 font-mono text-sm"
            pattern="[a-z0-9-]+"
            title="Sadece küçük harf, rakam ve tire kullanılabilir"
          />
        </div>
        <p className="text-[11px] text-muted">Değiştirirsen URL'in değişir.</p>
      </div>

      <Button type="submit" disabled={pending} className="bg-accent text-white">
        {pending ? 'Kaydediliyor...' : 'Kaydet'}
      </Button>
    </form>
  )
}

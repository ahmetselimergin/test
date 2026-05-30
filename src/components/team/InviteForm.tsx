'use client'

import { useActionState } from 'react'
import { inviteTeamMember } from '@/app/actions/workspace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Loader2 } from 'lucide-react'

interface InviteFormProps {
  workspaceId: string
}

export function InviteForm({ workspaceId }: InviteFormProps) {
  const [state, action, pending] = useActionState(inviteTeamMember, null)

  return (
    <form action={action} className="flex flex-col gap-3">
      <input type="hidden" name="workspace_id" value={workspaceId} />
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="flex-1 space-y-2">
          <Label htmlFor="email" className="sr-only">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="teammate@company.com"
            className="h-10"
          />
        </div>
        <select
          name="role"
          defaultValue="member"
          className="h-10 rounded-lg border border-border bg-card px-3 text-sm sm:w-36"
        >
          <option value="member">Üye</option>
          <option value="admin">Yönetici</option>
          <option value="viewer">İzleyici</option>
        </select>
        <Button type="submit" disabled={pending} className="shrink-0">
          {pending ? <Loader2 className="animate-spin" size={15} /> : 'Davet Et'}
        </Button>
      </div>
      {state?.error && (
        <p className="text-sm text-destructive bg-destructive/10 rounded-lg px-3 py-2">
          {state.error}
        </p>
      )}
      {state?.success && (
        <p className="text-sm text-emerald-600 bg-emerald-500/10 rounded-lg px-3 py-2">
          Üye başarıyla eklendi.
        </p>
      )}
      <p className="text-xs text-muted-foreground">
        Kullanıcının bu e-posta ile FlowTrack hesabı olması gerekiyor.
      </p>
    </form>
  )
}

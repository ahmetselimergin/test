'use client'

import { useActionState } from 'react'
import { createWorkspace } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type State = { error: string } | null

async function action(prev: State, formData: FormData): Promise<State> {
  const result = await createWorkspace(formData)
  return result ?? prev
}

export function CreateWorkspaceForm() {
  const [state, formAction, isPending] = useActionState(action, null)

  return (
    <form action={formAction} className="space-y-4">
      {state?.error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg px-3 py-2">
          {state.error}
        </div>
      )}
      <div className="space-y-2">
        <Label htmlFor="name">Workspace name</Label>
        <Input
          id="name"
          name="name"
          required
          placeholder="Acme Engineering"
          className="h-10"
        />
      </div>
      <Button
        type="submit"
        disabled={isPending}
        className="w-full h-10 bg-accent text-white hover:opacity-90"
      >
        {isPending ? 'Creating…' : 'Create workspace'}
      </Button>
    </form>
  )
}

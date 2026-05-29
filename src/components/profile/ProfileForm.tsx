'use client'

import { useActionState } from 'react'
import { updateProfile } from '@/app/actions/workspace'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface ProfileFormProps {
  displayName: string
  jobTitle: string
  email: string
}

export function ProfileForm({ displayName, jobTitle, email }: ProfileFormProps) {
  const [state, formAction] = useActionState(updateProfile, null)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Full name</Label>
        <Input
          id="full_name"
          name="full_name"
          required
          defaultValue={displayName}
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="job_title">Ünvan / Rol</Label>
        <Input
          id="job_title"
          name="job_title"
          defaultValue={jobTitle}
          placeholder="Developer, QA Engineer, Designer, PM..."
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} disabled className="h-10 opacity-60" />
      </div>
      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}
      <Button type="submit">
        Save profile
      </Button>
    </form>
  )
}

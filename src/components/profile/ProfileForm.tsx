'use client'

import { useActionState, useState } from 'react'
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
  const [fullName, setFullName] = useState(displayName)
  const [title, setTitle] = useState(jobTitle)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="full_name">Ad Soyad</Label>
        <Input
          id="full_name"
          name="full_name"
          required
          value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="job_title">Ünvan / Rol</Label>
        <Input
          id="job_title"
          name="job_title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Developer, QA Engineer, Designer, PM..."
          className="h-10"
        />
      </div>
      <div className="space-y-2">
        <Label>Email</Label>
        <Input value={email} readOnly className="h-10 opacity-60 cursor-default" />
      </div>
      {state?.error && (
        <p className="text-sm text-red-500">{state.error}</p>
      )}
      <Button type="submit">
        Profili Kaydet
      </Button>
    </form>
  )
}

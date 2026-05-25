import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { updateProfile } from '@/app/actions/workspace'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default async function ProfilePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const fullNameMeta =
    (user.user_metadata?.full_name as string | undefined) ?? ''

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  if (!profile) {
    await supabase.from('profiles').upsert({
      id: user.id,
      email: user.email ?? null,
      full_name: fullNameMeta || null,
    })
  }

  const displayName = profile?.full_name ?? fullNameMeta
  const initials = displayName
    ? displayName
        .split(' ')
        .map((n: string) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase()
    : user.email?.[0]?.toUpperCase() ?? '?'

  return (
    <div className="p-8 max-w-lg mx-auto">
      <PageHeader title="Profile" description="Your personal account settings" />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="size-14">
              <AvatarFallback className="bg-accent-muted text-accent text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{displayName || 'Unnamed'}</CardTitle>
              <p className="text-sm text-muted">{user.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <form
            action={updateProfile as unknown as (formData: FormData) => void}
            className="space-y-4"
          >
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
                defaultValue={profile?.job_title ?? ''}
                placeholder="Developer, QA Engineer, Designer, PM..."
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={user.email ?? ''} disabled className="h-10 opacity-60" />
            </div>
            <Button type="submit" className="bg-accent text-white">
              Save profile
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

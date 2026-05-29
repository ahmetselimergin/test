import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { ProfileForm } from '@/components/profile/ProfileForm'

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
    <div className="p-8 max-w-2xl mx-auto">
      <PageHeader title="Profile" description="Your personal account settings" />

      <Card>
        <CardHeader>
          <div className="flex items-center gap-4">
            <Avatar className="size-20">
              <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div>
              <CardTitle className="text-base">{displayName || 'Unnamed'}</CardTitle>
              <p className="text-sm text-muted-foreground">{user.email}</p>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ProfileForm
            displayName={displayName}
            jobTitle={profile?.job_title ?? ''}
            email={user.email ?? ''}
          />
        </CardContent>
      </Card>
    </div>
  )
}

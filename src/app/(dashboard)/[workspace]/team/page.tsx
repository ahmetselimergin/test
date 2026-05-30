import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { removeTeamMember } from '@/app/actions/workspace'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InviteForm } from '@/components/team/InviteForm'
import type { Role } from '@/lib/supabase/types'

const roleLabels: Record<Role, string> = {
  owner: 'Sahip',
  admin: 'Yönetici',
  member: 'Üye',
  viewer: 'İzleyici',
}

export default async function TeamPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace: slug } = await params
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!workspace) redirect('/')

  const { data: myMembership } = await supabase
    .from('workspace_members')
    .select('role')
    .eq('workspace_id', workspace.id)
    .eq('user_id', user.id)
    .single()

  const canManage =
    myMembership?.role === 'owner' || myMembership?.role === 'admin'

  const { data: members } = await supabase
    .from('workspace_members')
    .select('user_id, role, joined_at')
    .eq('workspace_id', workspace.id)
    .order('joined_at')

  const userIds = members?.map((m) => m.user_id) ?? []
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('*').in('id', userIds)
    : { data: [] }

  const profileMap = new Map(profiles?.map((p) => [p.id, p]) ?? [])

  return (
    <div className="p-8 max-w-3xl mx-auto">
      <PageHeader
        title="Team"
        description="Manage who has access to this workspace"
      />

      {canManage && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Üye davet et</CardTitle>
          </CardHeader>
          <CardContent>
            <InviteForm workspaceId={workspace.id} />
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Üyeler ({members?.length ?? 0})
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ul className="divide-y divide-border">
            {members?.map((member) => {
              const profile = profileMap.get(member.user_id)
              const name =
                profile?.full_name ?? profile?.email ?? member.user_id.slice(0, 8)
              const initials = name.slice(0, 2).toUpperCase()
              const isSelf = member.user_id === user.id

              return (
                <li
                  key={member.user_id}
                  className="flex items-center gap-4 px-6 py-4"
                >
                  <Avatar>
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">
                      {name}
                      {isSelf && (
                        <span className="text-muted-foreground font-normal ml-1">(you)</span>
                      )}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">{profile?.email}</p>
                  </div>
                  <Badge variant="secondary">{roleLabels[member.role as Role]}</Badge>
                  {canManage && !isSelf && member.role !== 'owner' && (
                    <form
                      action={
                        removeTeamMember as unknown as (formData: FormData) => void
                      }
                    >
                      <input type="hidden" name="workspace_id" value={workspace.id} />
                      <input type="hidden" name="user_id" value={member.user_id} />
                      <Button
                        type="submit"
                        variant="ghost"
                        size="sm"
                        className="text-destructive"
                      >
                        Çıkar
                      </Button>
                    </form>
                  )}
                </li>
              )
            })}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

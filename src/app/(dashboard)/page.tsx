import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { CreateWorkspaceForm } from '@/components/workspace/CreateWorkspaceForm'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

export default async function DashboardPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: memberRows } = await supabase
    .from('workspace_members')
    .select('workspace_id')
    .eq('user_id', user.id)

  if (!memberRows?.length) {
    return (
      <div className="flex items-center justify-center h-full p-6">
        <Card className="w-full max-w-md shadow-lg">
          <CardHeader className="text-center">
            <div className="size-12 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
              <span className="text-2xl">🚀</span>
            </div>
            <CardTitle>Create your workspace</CardTitle>
            <CardDescription>
              Set up a space for your team to track issues and sprints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CreateWorkspaceForm />
          </CardContent>
        </Card>
      </div>
    )
  }

  const workspaceId = memberRows[0].workspace_id
  const { data: workspace } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()

  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('workspace_id', workspaceId)
    .limit(1)

  if (projects?.length) {
    redirect(`/${workspace?.slug}/projects`)
  }

  redirect(`/${workspace?.slug}`)
}

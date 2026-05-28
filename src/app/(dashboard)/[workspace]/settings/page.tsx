import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkspaceSettingsForm } from '@/components/workspace/WorkspaceSettingsForm'

export default async function WorkspaceSettingsPage({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace: slug } = await params
  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!workspace) redirect('/')

  return (
    <div className="p-8 max-w-lg mx-auto">
      <PageHeader
        title="Settings"
        description="Workspace configuration and preferences"
      />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">General</CardTitle>
          <CardDescription>Basic workspace information</CardDescription>
        </CardHeader>
        <CardContent>
          <WorkspaceSettingsForm
            workspaceId={workspace.id}
            name={workspace.name}
            slug={workspace.slug}
          />
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">Account</CardTitle>
        </CardHeader>
        <CardContent>
          <Link href="/profile" className="text-sm text-accent hover:underline">
            Manage your profile →
          </Link>
        </CardContent>
      </Card>
    </div>
  )
}

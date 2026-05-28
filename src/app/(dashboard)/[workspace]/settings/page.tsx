import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { updateWorkspaceSettings } from '@/app/actions/workspace'
import { PageHeader } from '@/components/layout/PageHeader'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

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
          <form
            action={
              updateWorkspaceSettings as unknown as (formData: FormData) => void
            }
            className="space-y-4"
          >
            <input type="hidden" name="workspace_id" value={workspace.id} />
            <div className="space-y-2">
              <Label htmlFor="name">Workspace name</Label>
              <Input
                id="name"
                name="name"
                required
                defaultValue={workspace.name}
                className="h-10"
              />
            </div>
            <div className="space-y-2">
              <Label>URL slug</Label>
              <Input
                value={workspace.slug}
                disabled
                className="h-10 font-mono text-sm opacity-60"
              />
            </div>
            <Button type="submit" className="bg-accent text-white">
              Save changes
            </Button>
          </form>
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

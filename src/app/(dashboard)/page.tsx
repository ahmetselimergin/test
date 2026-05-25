import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createWorkspace } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

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
      <div className="flex items-center justify-center h-full">
        <div
          className="w-full max-w-md p-8 bg-card border border-subtle rounded-2xl glass"
          style={{
            background:
              'radial-gradient(ellipse at 50% 0%, rgba(99,102,241,0.1) 0%, transparent 70%)',
          }}
        >
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl">🚀</span>
            </div>
            <h2 className="text-xl font-semibold mb-1">İlk Workspace&apos;ini Oluştur</h2>
            <p className="text-sm text-muted">
              Ekibinle çalışmaya başlamak için bir workspace oluştur
            </p>
          </div>

          <form action={createWorkspace as unknown as (formData: FormData) => void} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Workspace Adı</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Şirket Adı veya Takım Adı"
                className="bg-white/5 border-white/10"
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-500"
            >
              Workspace Oluştur
            </Button>
          </form>
        </div>
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
    redirect(`/${workspace?.slug}/${projects[0].id}/board`)
  }

  redirect(`/${workspace?.slug}`)
}

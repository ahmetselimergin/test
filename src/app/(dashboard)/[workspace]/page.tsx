import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { createProject } from '@/app/actions/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default async function WorkspacePage({
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

  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('workspace_id', workspace.id)
    .limit(1)

  if (projects?.length) {
    redirect(`/${slug}/${projects[0].id}/board`)
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w-md p-8 bg-card border border-subtle rounded-2xl glass">
        <div className="text-center mb-8">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
            <span className="text-xl font-bold text-indigo-400">
              {workspace.name[0]}
            </span>
          </div>
          <h2 className="text-xl font-semibold mb-1">İlk Projeyi Oluştur</h2>
          <p className="text-sm text-muted">
            {workspace.name} workspace&apos;inde ilk projeyi oluştur
          </p>
        </div>

        <form action={createProject as unknown as (formData: FormData) => void} className="space-y-4">
          <input type="hidden" name="workspace_id" value={workspace.id} />

          <div className="space-y-1.5">
            <Label htmlFor="name">Proje Adı</Label>
            <Input
              id="name"
              name="name"
              required
              placeholder="Ör: FlowTrack Web App"
              className="bg-white/5 border-white/10"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="key">Proje Kodu</Label>
            <Input
              id="key"
              name="key"
              required
              placeholder="Ör: FT"
              maxLength={5}
              className="bg-white/5 border-white/10 uppercase"
            />
            <p className="text-xs text-muted">
              Issue ID&apos;lerde kullanılır (FT-1, FT-2...)
            </p>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="methodology">Metodoloji</Label>
            <select
              id="methodology"
              name="methodology"
              defaultValue="both"
              className="w-full h-10 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
            >
              <option value="both">Kanban + Scrum</option>
              <option value="kanban">Sadece Kanban</option>
              <option value="scrum">Sadece Scrum</option>
            </select>
          </div>

          <Button
            type="submit"
            className="w-full bg-indigo-600 hover:bg-indigo-500"
          >
            Proje Oluştur
          </Button>
        </form>
      </div>
    </div>
  )
}

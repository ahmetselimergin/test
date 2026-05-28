import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Kanban, ArrowRight } from 'lucide-react'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'
import { PageHeader } from '@/components/layout/PageHeader'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'

export default async function ProjectsPage({
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
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <PageHeader
        title="Projects"
        description={`All delivery workstreams in ${workspace.name}`}
        actions={<CreateProjectDialog workspaceId={workspace.id} />}
      />

      {!projects?.length ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center">
            <p className="text-muted mb-4">No projects yet. Create one to open a board.</p>
            <CreateProjectDialog workspaceId={workspace.id} />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-3">
          {projects.map((project) => (
            <Link key={project.id} href={`/${slug}/${project.id}/board`}>
              <Card className="hover:border-strong hover:shadow-sm transition-all group">
                <CardContent className="flex items-center gap-4 p-4">
                  <div
                    className="size-11 rounded-lg flex items-center justify-center text-sm font-bold text-white shrink-0"
                    style={{ backgroundColor: project.color }}
                  >
                    {project.key}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold group-hover:text-accent transition-colors">
                      {project.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="font-mono text-[10px]">
                        {project.key}
                      </Badge>
                      <span className="text-xs text-muted capitalize">
                        {project.methodology}
                      </span>
                    </div>
                  </div>
                  <Kanban size={18} className="text-muted group-hover:text-accent shrink-0" />
                  <ArrowRight
                    size={16}
                    className="text-muted opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

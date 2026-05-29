import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Kanban, ArrowUpRight } from 'lucide-react'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'
import { EditProjectDialog } from '@/components/projects/EditProjectDialog'
import { ProjectCardActions } from '@/components/projects/ProjectCardActions'
import { PageHeader } from '@/components/layout/PageHeader'
import { getPattern } from '@/lib/patterns'

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
    .select('*, issues(count)')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: false })

  return (
    <div className="p-8">
      <PageHeader
        title="Projeler"
        description={`${workspace.name} workspace'indeki tüm projeler`}
        actions={<CreateProjectDialog workspaceId={workspace.id} />}
      />

      {!projects?.length ? (
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-border rounded-2xl text-center">
          <div className="size-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
            <Kanban size={24} className="text-primary" />
          </div>
          <p className="text-[15px] font-semibold text-foreground mb-1">Henüz proje yok</p>
          <p className="text-sm text-muted-foreground mb-5">İlk projeyi oluşturarak başla</p>
          <CreateProjectDialog workspaceId={workspace.id} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {projects.map((project) => {
            const issueCount = (project.issues as { count: number }[])?.[0]?.count ?? 0
            return (
              <ProjectCard
                key={project.id}
                project={project}
                slug={slug}
                issueCount={issueCount}
              />
            )
          })}

          {/* Yeni proje yer tutucu */}
          <div className="rounded-2xl border border-dashed border-border hover:border-primary/40 hover:bg-muted/40 transition-all flex items-center justify-center min-h-[220px]">
            <CreateProjectDialog workspaceId={workspace.id} />
          </div>
        </div>
      )}
    </div>
  )
}

function ProjectCard({
  project,
  slug,
  issueCount,
}: {
  project: { id: string; name: string; key: string; color: string; methodology: string; icon: string | null; logo_url: string | null; pattern: string | null }
  slug: string
  issueCount: number
}) {
  const methodologyLabel: Record<string, string> = {
    kanban: 'Kanban',
    scrum: 'Scrum',
    both: 'Kanban + Scrum',
  }

  const hasLogo = !!project.logo_url
  const displayKey = project.key.slice(0, 2).toUpperCase()
  const pat = getPattern(project.pattern)

  return (
    <div className="group rounded-2xl border border-border bg-card overflow-hidden hover:border-foreground/20 hover:shadow-lg transition-all">
      {/* Colored header */}
      <div
        className="relative h-28 flex items-start justify-end p-3"
        style={{ backgroundColor: project.color }}
      >
        {/* Pattern overlay */}
        {pat.backgroundImage !== 'none' && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: pat.backgroundImage,
              backgroundSize: pat.backgroundSize,
              backgroundPosition: pat.backgroundPosition ?? '0 0',
              opacity: pat.opacity,
            }}
          />
        )}

        {/* Edit button — top right */}
        <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <EditProjectDialog project={{ id: project.id, name: project.name, key: project.key, color: project.color, logo_url: project.logo_url, pattern: project.pattern }} />
        </div>

        {/* Logo / icon — bottom left */}
        <Link
          href={`/${slug}/${project.id}/board`}
          className="absolute bottom-3 left-4"
        >
          <div className="size-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white font-bold overflow-hidden">
            {hasLogo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={project.logo_url!} alt={project.name} className="size-full object-cover" />
            ) : (
              <span className="text-[15px] tracking-wide">{displayKey}</span>
            )}
          </div>
        </Link>

        {/* Arrow */}
        <Link href={`/${slug}/${project.id}/board`} className="absolute bottom-3 right-3">
          <ArrowUpRight size={15} className="text-white/50 opacity-0 group-hover:opacity-100 transition-opacity" />
        </Link>
      </div>

      {/* Content */}
      <div className="p-4">
        <Link href={`/${slug}/${project.id}/board`}>
          <h3 className="font-semibold text-[14px] text-foreground group-hover:text-primary transition-colors truncate mb-0.5">
            {project.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
            {project.key}
          </span>
          <span className="text-[11px] text-muted-foreground">
            {methodologyLabel[project.methodology] ?? project.methodology}
          </span>
          {issueCount > 0 && (
            <>
              <span className="text-muted-foreground/40">·</span>
              <span className="text-[11px] text-muted-foreground">{issueCount} issue</span>
            </>
          )}
        </div>

        <ProjectCardActions slug={slug} projectId={project.id} />
      </div>
    </div>
  )
}

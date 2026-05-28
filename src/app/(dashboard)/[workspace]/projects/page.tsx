import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import { Kanban, ListTodo, Map, Timer, ArrowUpRight } from 'lucide-react'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'
import { EditProjectDialog } from '@/components/projects/EditProjectDialog'
import { PageHeader } from '@/components/layout/PageHeader'

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
        <div className="flex flex-col items-center justify-center py-24 border border-dashed border-subtle rounded-2xl text-center">
          <div className="size-14 rounded-2xl bg-accent/10 flex items-center justify-center mb-4">
            <Kanban size={24} className="text-accent" />
          </div>
          <p className="text-[15px] font-semibold text-foreground mb-1">Henüz proje yok</p>
          <p className="text-sm text-muted mb-5">İlk projeyi oluşturarak başla</p>
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
          <div className="rounded-2xl border border-dashed border-subtle hover:border-accent/40 hover:bg-subtle/40 transition-all flex items-center justify-center min-h-[220px]">
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
  project: { id: string; name: string; key: string; color: string; methodology: string; icon: string | null }
  slug: string
  issueCount: number
}) {
  const views = [
    { href: 'board', icon: Kanban, label: 'Board' },
    { href: 'backlog', icon: ListTodo, label: 'Backlog' },
    { href: 'sprint', icon: Timer, label: 'Sprint' },
    { href: 'roadmap', icon: Map, label: 'Roadmap' },
  ]

  const methodologyLabel: Record<string, string> = {
    kanban: 'Kanban',
    scrum: 'Scrum',
    both: 'Kanban + Scrum',
  }

  const displayIcon = project.icon || project.key.slice(0, 2)

  return (
    <div className="group rounded-2xl border border-subtle bg-card overflow-hidden hover:border-strong hover:shadow-lg transition-all">
      {/* Colored header */}
      <div
        className="relative h-28 flex items-start justify-end p-3"
        style={{ backgroundColor: project.color }}
      >
        {/* Dot pattern overlay */}
        <div
          className="absolute inset-0 opacity-15 pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle, white 1px, transparent 1px)`,
            backgroundSize: '20px 20px',
          }}
        />

        {/* Edit button — top right */}
        <div className="relative z-10 opacity-0 group-hover:opacity-100 transition-opacity">
          <EditProjectDialog project={project} />
        </div>

        {/* Icon — bottom left */}
        <Link
          href={`/${slug}/${project.id}/board`}
          className="absolute bottom-3 left-4 size-13 flex"
        >
          <div className="size-12 rounded-xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center text-white font-bold text-xl">
            {displayIcon}
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
          <h3 className="font-semibold text-[14px] text-foreground group-hover:text-accent transition-colors truncate mb-0.5">
            {project.name}
          </h3>
        </Link>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[10px] text-muted bg-subtle px-1.5 py-0.5 rounded">
            {project.key}
          </span>
          <span className="text-[11px] text-muted">
            {methodologyLabel[project.methodology] ?? project.methodology}
          </span>
          {issueCount > 0 && (
            <>
              <span className="text-muted/40">·</span>
              <span className="text-[11px] text-muted">{issueCount} issue</span>
            </>
          )}
        </div>

        {/* Quick links */}
        <div className="flex gap-1">
          {views.map(({ href, icon: Icon, label }) => (
            <Link
              key={href}
              href={`/${slug}/${project.id}/${href}`}
              title={label}
              className="flex-1 flex items-center justify-center h-8 rounded-lg text-muted hover:text-accent hover:bg-accent/8 transition-colors"
            >
              <Icon size={14} />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}

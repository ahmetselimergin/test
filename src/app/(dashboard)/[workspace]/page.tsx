import { createClient, createAdminClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { DashboardHero } from '@/components/dashboard/DashboardHero'
import { ProjectCard } from '@/components/dashboard/ProjectCard'
import { ActivityFeed } from '@/components/dashboard/ActivityFeed'
import type { ActivityItem } from '@/components/dashboard/ActivityFeed'
import { CreateProjectDialog } from '@/components/projects/CreateProjectDialog'

export default async function WorkspaceDashboard({
  params,
}: {
  params: Promise<{ workspace: string }>
}) {
  const { workspace: slug } = await params
  const supabase = await createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const [{ data: workspace }, { data: profile }] = await Promise.all([
    supabase.from('workspaces').select('*').eq('slug', slug).single(),
    supabase.from('profiles').select('full_name, email').eq('id', user.id).single(),
  ])

  if (!workspace) redirect('/')

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('workspace_id', workspace.id)
    .order('created_at', { ascending: true })

  const projectList = projects ?? []
  const firstProjectId = projectList[0]?.id ?? null
  const projectIds = projectList.map(p => p.id)

  // Per-project issue counts — 2 aggregate queries instead of 2N
  const [{ data: allIssues }, { data: doneIssues }] = projectIds.length > 0
    ? await Promise.all([
        supabase.from('issues').select('project_id').in('project_id', projectIds),
        supabase.from('issues').select('project_id').in('project_id', projectIds).eq('status', 'done'),
      ])
    : [{ data: [] as { project_id: string }[] }, { data: [] as { project_id: string }[] }]

  const issueCounts = projectList.map(project => ({
    projectId: project.id,
    total: allIssues?.filter(i => i.project_id === project.id).length ?? 0,
    done: doneIssues?.filter(i => i.project_id === project.id).length ?? 0,
  }))

  // Quick stats
  const startOfToday = new Date()
  startOfToday.setHours(0, 0, 0, 0)

  const [
    { count: assignedCount },
    { count: doneTodayCount },
    { count: criticalBugCount },
  ] = await Promise.all([
    supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('assignee_id', user.id)
      .neq('status', 'done'),
    supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'done')
      .gte('updated_at', startOfToday.toISOString()),
    supabase
      .from('issues')
      .select('*', { count: 'exact', head: true })
      .in('project_id', projectIds)
      .eq('priority', 'critical')
      .eq('type', 'bug')
      .neq('status', 'done'),
  ])

  // Activity feed — last 24 hours
  // adminClient bypasses RLS to read all workspace activity
  const adminClient = createAdminClient()
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()

  let rawActivity: unknown[] = []
  if (projectIds.length > 0) {
    const { data: issueIds } = await adminClient
      .from('issues')
      .select('id')
      .in('project_id', projectIds)
    const ids = (issueIds ?? []).map((i) => i.id)
    if (ids.length > 0) {
      const { data } = await adminClient
        .from('activity_logs')
        .select('*, issue:issues(title, project_id), actor:profiles(full_name, avatar_url)')
        .in('issue_id', ids)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(20)
      rawActivity = data ?? []
    }
  }

  const activityItems: ActivityItem[] = ((rawActivity ?? []) as any[])
    .filter((row) => {
      const issue = Array.isArray(row.issue) ? row.issue[0] : row.issue
      return issue && projectIds.includes(issue.project_id)
    })
    .map((row) => ({
      id: row.id,
      action: row.action,
      old_value: row.old_value,
      new_value: row.new_value,
      created_at: row.created_at,
      issue: Array.isArray(row.issue) ? row.issue[0] ?? null : row.issue,
      actor: Array.isArray(row.actor) ? row.actor[0] ?? null : row.actor,
    }))

  const userName = profile?.full_name ?? profile?.email ?? 'Kullanıcı'

  const heroHref = (path: string) =>
    firstProjectId ? `/${slug}/${firstProjectId}${path}` : '#'

  return (
    <div className="h-full flex flex-col overflow-hidden">
      <DashboardHero
        userName={userName}
        assignedCount={assignedCount ?? 0}
        doneTodayCount={doneTodayCount ?? 0}
        criticalBugCount={criticalBugCount ?? 0}
        assignedHref={heroHref('/backlog?assignee=me')}
        doneTodayHref={heroHref('/backlog?status=done&since=today')}
        criticalBugHref={heroHref('/backlog?priority=critical&type=bug')}
      />

      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Projects list */}
        <div className="flex-[3] overflow-y-auto px-8 py-6 border-r border-border">
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                Projeler
              </p>
              <p className="text-[13px] font-semibold text-foreground mt-0.5">
                {projectList.length} aktif proje
              </p>
            </div>
            <Link
              href={`/${slug}/projects`}
              className="text-[12px] font-medium text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
            >
              Tümünü gör
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </Link>
          </div>

          {projectList.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center border border-dashed border-border rounded-2xl bg-muted/20">
              <div className="size-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
                <span className="text-[24px]">📁</span>
              </div>
              <p className="text-[14px] font-semibold text-foreground mb-1">Henüz proje yok</p>
              <p className="text-[12px] text-muted-foreground mb-5">İlk projeyi oluşturarak başla</p>
              <CreateProjectDialog workspaceId={workspace.id} />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {projectList.map((project) => {
                const counts = issueCounts.find((c) => c.projectId === project.id)
                return (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    totalIssues={counts?.total ?? 0}
                    doneIssues={counts?.done ?? 0}
                    workspaceSlug={slug}
                  />
                )
              })}
            </div>
          )}
        </div>

        {/* Activity feed */}
        <div className="flex-[2] overflow-y-auto px-6 py-6">
          <div className="mb-5">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              Aktivite
            </p>
            <p className="text-[13px] font-semibold text-foreground mt-0.5">Son 24 saat</p>
          </div>
          <ActivityFeed items={activityItems} />
        </div>
      </div>
    </div>
  )
}

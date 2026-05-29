import { createClient } from '@/lib/supabase/server'
import { getWorkspaceMembers } from '@/app/actions/workspace'
import { BoardView } from '@/components/board/BoardView'

export default async function BoardPage({
  params,
}: {
  params: Promise<{ workspace: string; project: string }>
}) {
  const { workspace, project: projectId } = await params
  const supabase = await createClient()

  const [
    { data: project },
    { data: columns },
    { data: issues },
    members,
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase.from('board_columns').select('*').eq('project_id', projectId).order('order'),
    supabase.from('issues').select('*').eq('project_id', projectId).order('order'),
    getWorkspaceMembers(workspace),
  ])

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Proje bulunamadı
      </div>
    )
  }

  return (
    <BoardView
      project={project}
      workspaceSlug={workspace}
      columns={columns ?? []}
      issues={issues ?? []}
      members={members}
    />
  )
}

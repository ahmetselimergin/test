import { createClient } from '@/lib/supabase/server'
import { SprintView } from '@/components/sprint/SprintView'
import { BoardDataLoader } from '@/components/board/BoardDataLoader'

export default async function SprintPage({
  params,
}: {
  params: Promise<{ workspace: string; project: string }>
}) {
  const { project: projectId } = await params
  const supabase = await createClient()

  const [
    { data: project },
    { data: columns },
    { data: issues },
    { data: sprints },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase
      .from('board_columns')
      .select('*')
      .eq('project_id', projectId)
      .order('order'),
    supabase.from('issues').select('*').eq('project_id', projectId),
    supabase
      .from('sprints')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false }),
  ])

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        Proje bulunamadı
      </div>
    )
  }

  return (
    <BoardDataLoader
      project={project}
      columns={columns ?? []}
      issues={issues ?? []}
      sprints={sprints ?? []}
    >
      <SprintView />
    </BoardDataLoader>
  )
}

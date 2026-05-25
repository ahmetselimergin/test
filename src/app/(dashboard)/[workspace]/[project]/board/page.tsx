import { createClient } from '@/lib/supabase/server'
import { KanbanBoard } from '@/components/board/KanbanBoard'
import { BoardDataLoader } from '@/components/board/BoardDataLoader'

export default async function BoardPage({
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
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase
      .from('board_columns')
      .select('*')
      .eq('project_id', projectId)
      .order('order'),
    supabase
      .from('issues')
      .select('*')
      .eq('project_id', projectId)
      .order('order'),
  ])

  if (!project) {
    return (
      <div className="flex items-center justify-center h-full text-muted">
        Proje bulunamadı
      </div>
    )
  }

  return (
    <BoardDataLoader
      project={project}
      columns={columns ?? []}
      issues={issues ?? []}
    >
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between p-6 pb-0">
          <h1 className="text-xl font-semibold">{project.name} — Board</h1>
        </div>
        <div className="flex-1 overflow-hidden">
          <KanbanBoard project={project} />
        </div>
      </div>
    </BoardDataLoader>
  )
}

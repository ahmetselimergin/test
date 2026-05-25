import { createClient } from '@/lib/supabase/server'
import { RoadmapView } from '@/components/roadmap/RoadmapView'
import { BoardDataLoader } from '@/components/board/BoardDataLoader'

export default async function RoadmapPage({
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
    { data: epics },
  ] = await Promise.all([
    supabase.from('projects').select('*').eq('id', projectId).single(),
    supabase
      .from('board_columns')
      .select('*')
      .eq('project_id', projectId)
      .order('order'),
    supabase.from('issues').select('*').eq('project_id', projectId),
    supabase.from('epics').select('*').eq('project_id', projectId),
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
      epics={epics ?? []}
    >
      <RoadmapView />
    </BoardDataLoader>
  )
}

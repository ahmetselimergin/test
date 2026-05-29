import { createClient } from '@/lib/supabase/server'
import { BacklogView } from '@/components/backlog/BacklogView'
import { BoardDataLoader } from '@/components/board/BoardDataLoader'

export default async function BacklogPage({
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
    supabase
      .from('issues')
      .select('*')
      .eq('project_id', projectId)
      .order('order'),
    supabase.from('epics').select('*').eq('project_id', projectId),
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
      epics={epics ?? []}
    >
      <BacklogView project={project} />
    </BoardDataLoader>
  )
}

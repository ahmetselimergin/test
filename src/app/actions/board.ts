'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function createBoardColumn(formData: FormData) {
  const supabase = await createClient()
  const projectId = formData.get('project_id') as string
  const name = (formData.get('name') as string)?.trim()
  const color = (formData.get('color') as string) || '#6366f1'
  const workspaceSlug = formData.get('workspace_slug') as string

  if (!name) return { error: 'Kolon adı gerekli' }

  const { data: existing } = await supabase
    .from('board_columns')
    .select('order')
    .eq('project_id', projectId)
    .order('order', { ascending: false })
    .limit(1)

  const nextOrder = (existing?.[0]?.order ?? -1) + 1

  const { data: column, error } = await supabase
    .from('board_columns')
    .insert({
      project_id: projectId,
      name,
      order: nextOrder,
      color,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  revalidatePath(`/${workspaceSlug}/${projectId}/board`)
  return { success: true, column }
}

export async function deleteBoardColumn(columnId: string, workspaceSlug: string, projectId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Giriş gerekli' }

  const { error } = await supabase
    .from('board_columns')
    .delete()
    .eq('id', columnId)

  if (error) return { error: error.message }

  revalidatePath(`/${workspaceSlug}/${projectId}/board`)
  return { success: true }
}

export async function createIssue(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Giriş gerekli' }

  const projectId = formData.get('project_id') as string
  const boardColumnId = formData.get('board_column_id') as string
  const title = (formData.get('title') as string)?.trim()
  const type = (formData.get('type') as string) || 'task'
  const priority = (formData.get('priority') as string) || 'medium'
  const workspaceSlug = formData.get('workspace_slug') as string
  const description = (formData.get('description') as string)?.trim() || null
  const estimateRaw = formData.get('estimate') as string
  const parsed = estimateRaw ? parseInt(estimateRaw, 10) : NaN
  const estimate = isNaN(parsed) ? null : parsed
  const assigneeId = (formData.get('assignee_id') as string) || null
  let labels: string[] = []
  try {
    const raw = formData.get('labels') as string
    if (raw) labels = JSON.parse(raw)
  } catch {}

  if (!title) return { error: 'Başlık gerekli' }

  const { data: columnIssues } = await supabase
    .from('issues')
    .select('order')
    .eq('board_column_id', boardColumnId)
    .order('order', { ascending: false })
    .limit(1)

  const nextOrder =
    columnIssues?.length ? columnIssues[0].order + 1 : 0

  const statusMap: Record<string, string> = {
    Todo: 'todo',
    'In Progress': 'in_progress',
    Review: 'review',
    Done: 'done',
  }

  const { data: column } = await supabase
    .from('board_columns')
    .select('name')
    .eq('id', boardColumnId)
    .single()

  const status = statusMap[column?.name ?? ''] ?? 'todo'

  const { data: issue, error } = await supabase
    .from('issues')
    .insert({
      project_id: projectId,
      board_column_id: boardColumnId,
      title,
      description,
      type,
      priority,
      labels,
      estimate,
      status,
      reporter_id: user.id,
      assignee_id: assigneeId,
      order: nextOrder,
    })
    .select()
    .single()

  if (error) return { error: error.message }

  // Log issue_created — trigger only fires on UPDATE, so we insert manually here
  await supabase.from('activity_logs').insert({
    issue_id: issue.id,
    actor_id: user.id,
    action: 'issue_created',
    new_value: title,
  })

  revalidatePath(`/${workspaceSlug}/${projectId}/board`)
  return { success: true, issue }
}

export async function renameBoardColumn(columnId: string, name: string) {
  const supabase = await createClient()
  const { error } = await supabase
    .from('board_columns')
    .update({ name })
    .eq('id', columnId)
  if (error) return { error: error.message }
  return { success: true }
}

export async function reorderBoardColumns(
  columns: Array<{ id: string; order: number }>
) {
  const supabase = await createClient()
  await Promise.all(
    columns.map(({ id, order }) =>
      supabase.from('board_columns').update({ order }).eq('id', id)
    )
  )
  return { success: true }
}

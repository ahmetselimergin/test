'use server'

import { createClient } from '@/lib/supabase/server'

export async function createSprint(params: {
  projectId: string
  name: string
  goal?: string
  startDate?: string
  endDate?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Giriş gerekli' }

  const { data: sprint, error } = await supabase
    .from('sprints')
    .insert({
      project_id: params.projectId,
      name: params.name,
      goal: params.goal ?? null,
      start_date: params.startDate ?? null,
      end_date: params.endDate ?? null,
      status: 'planned',
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { sprint }
}

export async function assignIssueToSprint(issueId: string, sprintId: string | null) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Giriş gerekli' }

  const { error } = await supabase
    .from('issues')
    .update({ sprint_id: sprintId })
    .eq('id', issueId)

  if (error) return { error: error.message }
  return { success: true }
}

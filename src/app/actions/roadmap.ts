'use server'

import { createClient } from '@/lib/supabase/server'

export async function createEpic(params: {
  projectId: string
  title: string
  color: string
  startDate?: string
  endDate?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Giriş gerekli' }

  const { data: epic, error } = await supabase
    .from('epics')
    .insert({
      project_id: params.projectId,
      title: params.title,
      color: params.color,
      start_date: params.startDate ?? null,
      end_date: params.endDate ?? null,
      status: 'active',
      description: null,
    })
    .select()
    .single()

  if (error) return { error: error.message }
  return { epic }
}

export async function updateEpicDates(
  epicId: string,
  startDate: string | null,
  endDate: string | null
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Giriş gerekli' }

  const { error } = await supabase
    .from('epics')
    .update({ start_date: startDate, end_date: endDate })
    .eq('id', epicId)

  if (error) return { error: error.message }
  return { success: true }
}

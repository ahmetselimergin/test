'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import type { MemberSummary } from '@/lib/supabase/types'

export async function updateProfile(formData: FormData) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Giriş gerekli' }

  const fullName = (formData.get('full_name') as string)?.trim()
  const jobTitle = (formData.get('job_title') as string)?.trim() || null
  if (!fullName) return { error: 'Ad soyad gerekli' }

  const { error: authError } = await supabase.auth.updateUser({
    data: { full_name: fullName },
  })
  if (authError) return { error: authError.message }

  await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email ?? null,
    full_name: fullName,
    job_title: jobTitle,
  })

  revalidatePath('/profile')
  return { success: true }
}

export async function updateWorkspaceSettings(formData: FormData) {
  const supabase = await createClient()
  const workspaceId = formData.get('workspace_id') as string
  const name = (formData.get('name') as string)?.trim()
  if (!name) return { error: 'Workspace adı gerekli' }

  const { error } = await supabase
    .from('workspaces')
    .update({ name })
    .eq('id', workspaceId)

  if (error) return { error: error.message }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()

  revalidatePath(`/${workspace?.slug}`)
  revalidatePath(`/${workspace?.slug}/settings`)
  return { success: true }
}

export async function inviteTeamMember(formData: FormData) {
  const supabase = await createClient()
  const workspaceId = formData.get('workspace_id') as string
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role = (formData.get('role') as string) || 'member'

  if (!email) return { error: 'E-posta gerekli' }
  if (!['admin', 'member', 'viewer'].includes(role)) {
    return { error: 'Geçersiz rol' }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle()

  if (!profile) {
    return {
      error:
        'Bu e-posta ile kayıtlı kullanıcı bulunamadı. Önce FlowTrack\'e kayıt olmalı.',
    }
  }

  const { error } = await supabase.from('workspace_members').insert({
    workspace_id: workspaceId,
    user_id: profile.id,
    role,
  })

  if (error) {
    if (error.code === '23505') return { error: 'Kullanıcı zaten ekipte' }
    return { error: error.message }
  }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()

  revalidatePath(`/${workspace?.slug}/team`)
  return { success: true }
}

export async function removeTeamMember(formData: FormData) {
  const supabase = await createClient()
  const workspaceId = formData.get('workspace_id') as string
  const userId = formData.get('user_id') as string

  const { error } = await supabase
    .from('workspace_members')
    .delete()
    .eq('workspace_id', workspaceId)
    .eq('user_id', userId)

  if (error) return { error: error.message }

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()

  revalidatePath(`/${workspace?.slug}/team`)
  return { success: true }
}

export async function createProjectAction(formData: FormData) {
  const supabase = await createClient()
  const workspaceId = formData.get('workspace_id') as string
  const name = formData.get('name') as string
  const key = (formData.get('key') as string).toUpperCase()
  const methodology = formData.get('methodology') as string

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      workspace_id: workspaceId,
      name,
      key,
      methodology,
      color: '#6366f1',
    })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from('board_columns').insert([
    { project_id: project.id, name: 'Todo', order: 0, color: '#64748b' },
    { project_id: project.id, name: 'In Progress', order: 1, color: '#6366f1' },
    { project_id: project.id, name: 'Review', order: 2, color: '#f59e0b' },
    { project_id: project.id, name: 'Done', order: 3, color: '#10b981' },
  ])

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('slug')
    .eq('id', workspaceId)
    .single()

  revalidatePath(`/${workspace?.slug}/projects`)
  redirect(`/${workspace?.slug}/${project.id}/board`)
}

export async function getWorkspaceMembers(workspaceSlug: string): Promise<MemberSummary[]> {
  const supabase = await createClient()

  const { data: workspace } = await supabase
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) return []

  const { data, error } = await supabase
    .from('workspace_members')
    .select('user_id, profiles(id, full_name, email, avatar_url, job_title)')
    .eq('workspace_id', workspace.id)

  if (error || !data) return []

  return data.flatMap((row) => {
    const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles
    if (!profile) return []
    return [{
      id: row.user_id,
      full_name: (profile as { full_name: string | null }).full_name ?? null,
      email: (profile as { email: string | null }).email ?? null,
      avatar_url: (profile as { avatar_url: string | null }).avatar_url ?? null,
      job_title: (profile as { job_title: string | null }).job_title ?? null,
    }]
  })
}

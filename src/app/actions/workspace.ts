'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { notifyMemberAdded } from '@/app/actions/notifications'
import type { MemberSummary } from '@/lib/supabase/types'

export async function updateProfile(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
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

  const { error: upsertError } = await supabase.from('profiles').upsert({
    id: user.id,
    email: user.email ?? null,
    full_name: fullName,
    job_title: jobTitle,
  })
  if (upsertError) return { error: upsertError.message }

  revalidatePath('/profile')
  return { success: true }
}

export async function updateWorkspaceSettings(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const supabase = await createClient()
  const workspaceId = formData.get('workspace_id') as string
  const name = (formData.get('name') as string)?.trim()
  const color = (formData.get('color') as string)?.trim() || '#6366f1'

  if (!name) return { error: 'Workspace adı gerekli' }

  const { error } = await supabase
    .from('workspaces')
    .update({ name, color })
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

export async function inviteTeamMember(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const supabase = await createClient()
  const workspaceId = formData.get('workspace_id') as string
  const email = (formData.get('email') as string)?.trim().toLowerCase()
  const role = (formData.get('role') as string) || 'member'

  if (!email) return { error: 'E-posta gerekli' }
  if (!['admin', 'member', 'viewer'].includes(role)) {
    return { error: 'Geçersiz rol' }
  }

  const adminClient = createAdminClient()
  const { data: profile } = await adminClient
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

  const { error } = await adminClient.from('workspace_members').insert({
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

  const { data: { user } } = await supabase.auth.getUser()
  if (user) {
    const { data: newProfile } = await adminClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', profile.id)
      .single()

    notifyMemberAdded(
      workspaceId,
      user.id,
      newProfile?.full_name ?? newProfile?.email ?? email
    )
  }

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
  const color = (formData.get('color') as string) || '#6366f1'
  const logo_url = (formData.get('logo_url') as string)?.trim() || null
  const pattern = (formData.get('pattern') as string) || 'dots'

  const { data: project, error } = await supabase
    .from('projects')
    .insert({
      workspace_id: workspaceId,
      name,
      key,
      methodology,
      color,
      logo_url,
      pattern,
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

export async function updateProjectSettings(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const supabase = await createClient()
  const projectId = formData.get('project_id') as string
  const name = (formData.get('name') as string)?.trim()
  const color = (formData.get('color') as string) || '#6366f1'
  const logo_url = (formData.get('logo_url') as string)?.trim() || null
  const pattern = (formData.get('pattern') as string) || 'dots'

  if (!name) return { error: 'Proje adı gerekli' }

  const { error } = await supabase
    .from('projects')
    .update({ name, color, logo_url, pattern })
    .eq('id', projectId)

  if (error) return { error: error.message }

  const { data: project } = await supabase
    .from('projects')
    .select('workspace_id, workspaces(slug)')
    .eq('id', projectId)
    .single()

  const slug = (project?.workspaces as unknown as { slug: string } | null)?.slug
  if (slug) {
    revalidatePath(`/${slug}/projects`)
    revalidatePath(`/${slug}/${projectId}/board`)
  }
  return { success: true }
}

export async function deleteProject(formData: FormData) {
  const supabase = await createClient()
  const projectId = formData.get('project_id') as string

  const { data: project } = await supabase
    .from('projects')
    .select('workspace_id, workspaces(slug)')
    .eq('id', projectId)
    .single()

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)

  if (error) return { error: error.message }

  const slug = (project?.workspaces as unknown as { slug: string } | null)?.slug
  if (slug) revalidatePath(`/${slug}/projects`)

  redirect(`/${slug}/projects`)
}

export async function deleteWorkspace(
  _prevState: { error?: string; success?: boolean } | null,
  formData: FormData,
) {
  const supabase = await createClient()
  const workspaceId = formData.get('workspace_id') as string
  const confirmation = (formData.get('confirmation') as string)?.trim()

  if (confirmation !== 'SİL') return { error: 'Onay metni hatalı' }

  const { error } = await supabase
    .from('workspaces')
    .delete()
    .eq('id', workspaceId)

  if (error) return { error: error.message }

  redirect('/')
}

export async function getWorkspaceMembers(workspaceSlug: string): Promise<MemberSummary[]> {
  const supabase = await createClient()
  const adminClient = createAdminClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data: workspace } = await adminClient
    .from('workspaces')
    .select('id')
    .eq('slug', workspaceSlug)
    .single()

  if (!workspace) return []

  const { data: memberships } = await adminClient
    .from('workspace_members')
    .select('user_id')
    .eq('workspace_id', workspace.id)

  if (!memberships?.length) return []

  const userIds = memberships.map((m) => m.user_id)
  const { data: profiles } = await adminClient
    .from('profiles')
    .select('id, full_name, email, avatar_url, job_title')
    .in('id', userIds)

  if (!profiles) return []

  return profiles.map((p) => ({
    id: p.id,
    full_name: p.full_name ?? null,
    email: p.email ?? null,
    avatar_url: p.avatar_url ?? null,
    job_title: p.job_title ?? null,
  }))
}

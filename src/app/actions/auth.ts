'use server'
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
  })
  if (error) return { error: error.message }
  redirect('/')
}

export async function signUp(formData: FormData) {
  const supabase = await createClient()
  const { error } = await supabase.auth.signUp({
    email: formData.get('email') as string,
    password: formData.get('password') as string,
    options: {
      data: { full_name: formData.get('name') as string },
    },
  })
  if (error) return { error: error.message }
  redirect('/')
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/login')
}

export async function createWorkspace(formData: FormData) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Giriş gerekli' }

  const name = formData.get('name') as string
  const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

  const { data: workspace, error } = await supabase
    .from('workspaces')
    .insert({ name, slug, owner_id: user.id })
    .select()
    .single()

  if (error) return { error: error.message }

  await supabase.from('workspace_members').insert({
    workspace_id: workspace.id,
    user_id: user.id,
    role: 'owner',
  })

  redirect(`/${workspace.slug}`)
}

export async function createProject(formData: FormData) {
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

  redirect(`/${workspace?.slug}/${project.id}/board`)
}

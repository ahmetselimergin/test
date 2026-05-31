'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

export async function addComment(issueId: string, content: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Giriş gerekli' }

  const adminClient = createAdminClient()
  const { data: comment, error } = await adminClient
    .from('comments')
    .insert({ issue_id: issueId, author_id: user.id, content })
    .select('*, author:profiles(full_name, avatar_url)')
    .single()

  if (error) return { error: error.message }

  // Notify issue participants
  const { data: issueData } = await adminClient
    .from('issues')
    .select('assignee_id, reporter_id, title, project:projects(name, workspace_id)')
    .eq('id', issueId)
    .single()

  if (issueData) {
    const project = Array.isArray(issueData.project)
      ? issueData.project[0]
      : issueData.project as { name: string; workspace_id: string } | null
    const recipients = [...new Set([issueData.assignee_id, issueData.reporter_id])]
      .filter((id): id is string => Boolean(id) && id !== user.id)
    if (recipients.length > 0) {
      await adminClient.from('notifications').insert(
        recipients.map((user_id) => ({
          user_id,
          actor_id: user.id,
          type: 'comment_added',
          issue_id: issueId,
          workspace_id: project?.workspace_id ?? '',
          data: {
            issue_title: issueData.title,
            project_name: project?.name ?? '',
            comment_preview: content.replace(/<[^>]+>/g, '').slice(0, 80),
          },
        }))
      )
    }
  }

  return { comment }
}

export async function logActivity(params: {
  issueId: string
  action: string
  oldValue?: string | null
  newValue?: string | null
}) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const adminClient = createAdminClient()
    await adminClient.from('activity_logs').insert({
      issue_id: params.issueId,
      actor_id: user.id,
      action: params.action,
      old_value: params.oldValue ?? null,
      new_value: params.newValue ?? null,
    })
  } catch {
    // fire-and-forget
  }
}

export async function notifyIssueAssigned(
  issueId: string,
  newAssigneeId: string,
  workspaceId: string,
  data: { issue_title: string; project_name: string }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user || newAssigneeId === user.id) return

    const adminClient = createAdminClient()
    await adminClient.from('notifications').insert({
      user_id: newAssigneeId,
      actor_id: user.id,
      type: 'issue_assigned',
      issue_id: issueId,
      workspace_id: workspaceId,
      data,
    })
  } catch {
    // fire-and-forget
  }
}

export async function notifyIssueUpdated(
  issueId: string,
  workspaceId: string,
  data: {
    issue_title: string
    project_name: string
    new_status: string
    old_status: string
    assignee_id: string | null
    reporter_id: string | null
  }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const recipients = [...new Set([data.assignee_id, data.reporter_id])]
      .filter((id): id is string => Boolean(id) && id !== user.id)

    if (recipients.length === 0) return

    const adminClient = createAdminClient()
    await adminClient.from('notifications').insert(
      recipients.map((user_id) => ({
        user_id,
        actor_id: user.id,
        type: 'issue_updated',
        issue_id: issueId,
        workspace_id: workspaceId,
        data: {
          issue_title: data.issue_title,
          project_name: data.project_name,
          new_status: data.new_status,
          old_status: data.old_status,
        },
      }))
    )
  } catch {
    // fire-and-forget
  }
}

export async function notifyCommentAdded(
  issueId: string,
  workspaceId: string,
  data: {
    issue_title: string
    project_name: string
    comment_preview: string
    assignee_id: string | null
    reporter_id: string | null
  }
) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const recipients = [...new Set([data.assignee_id, data.reporter_id])]
      .filter((id): id is string => Boolean(id) && id !== user.id)

    if (recipients.length === 0) return

    const adminClient = createAdminClient()
    await adminClient.from('notifications').insert(
      recipients.map((user_id) => ({
        user_id,
        actor_id: user.id,
        type: 'comment_added',
        issue_id: issueId,
        workspace_id: workspaceId,
        data: {
          issue_title: data.issue_title,
          project_name: data.project_name,
          comment_preview: data.comment_preview,
        },
      }))
    )
  } catch {
    // fire-and-forget
  }
}

export async function notifyMemberAdded(
  workspaceId: string,
  actorId: string,
  memberName: string
) {
  try {
    const adminClient = createAdminClient()

    const { data: admins } = await adminClient
      .from('workspace_members')
      .select('user_id')
      .eq('workspace_id', workspaceId)
      .in('role', ['owner', 'admin'])

    const recipients = (admins ?? [])
      .map((a) => a.user_id)
      .filter((id) => id !== actorId)

    if (recipients.length === 0) return

    await adminClient.from('notifications').insert(
      recipients.map((user_id) => ({
        user_id,
        actor_id: actorId,
        type: 'member_added',
        issue_id: null,
        workspace_id: workspaceId,
        data: { member_name: memberName },
      }))
    )
  } catch {
    // fire-and-forget
  }
}

'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'

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

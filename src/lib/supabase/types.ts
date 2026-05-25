export type Role = 'owner' | 'admin' | 'member' | 'viewer'
export type IssueType = 'epic' | 'feature' | 'story' | 'task' | 'bug' | 'sub-task'
export type IssueStatus = 'todo' | 'in_progress' | 'review' | 'done'
export type Priority = 'critical' | 'high' | 'medium' | 'low'
export type SprintStatus = 'planned' | 'active' | 'completed'
export type Methodology = 'kanban' | 'scrum' | 'both'

export interface Workspace {
  id: string
  name: string
  slug: string
  logo_url: string | null
  owner_id: string
  created_at: string
}

export interface Project {
  id: string
  workspace_id: string
  name: string
  key: string
  methodology: Methodology
  color: string
  icon: string
  created_at: string
}

export interface BoardColumn {
  id: string
  project_id: string
  name: string
  order: number
  wip_limit: number | null
  color: string
}

export interface Epic {
  id: string
  project_id: string
  title: string
  description: string | null
  color: string
  start_date: string | null
  end_date: string | null
  status: 'active' | 'completed' | 'cancelled'
}

export interface Sprint {
  id: string
  project_id: string
  name: string
  goal: string | null
  start_date: string | null
  end_date: string | null
  status: SprintStatus
}

export interface Issue {
  id: string
  project_id: string
  epic_id: string | null
  parent_id: string | null
  sprint_id: string | null
  board_column_id: string | null
  type: IssueType
  title: string
  description: string | null
  status: IssueStatus
  priority: Priority
  assignee_id: string | null
  reporter_id: string | null
  labels: string[]
  estimate: number | null
  order: number
  issue_number: number
  created_at: string
  updated_at: string
}

export interface Comment {
  id: string
  issue_id: string
  author_id: string
  content: string
  created_at: string
}

export interface ActivityLog {
  id: string
  issue_id: string
  actor_id: string | null
  action: string
  old_value: string | null
  new_value: string | null
  created_at: string
}

export interface WorkspaceMember {
  workspace_id: string
  user_id: string
  role: Role
  joined_at: string
}

export interface Profile {
  id: string
  email: string | null
  full_name: string | null
  avatar_url: string | null
  created_at: string
}

export type WorkspaceMemberWithProfile = WorkspaceMember & {
  profile: Profile | null
}

export interface MemberSummary {
  id: string
  full_name: string | null
  email: string | null
  avatar_url: string | null
  job_title: string | null
}

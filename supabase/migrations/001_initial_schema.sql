create extension if not exists "uuid-ossp";

create table workspaces (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text not null unique,
  logo_url text,
  owner_id uuid references auth.users(id) on delete cascade,
  created_at timestamptz default now()
);

create table workspace_members (
  workspace_id uuid references workspaces(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  role text not null check (role in ('owner','admin','member','viewer')),
  joined_at timestamptz default now(),
  primary key (workspace_id, user_id)
);

create table projects (
  id uuid primary key default uuid_generate_v4(),
  workspace_id uuid references workspaces(id) on delete cascade,
  name text not null,
  key text not null,
  methodology text not null default 'both' check (methodology in ('kanban','scrum','both')),
  color text default '#6366f1',
  icon text default 'folder',
  created_at timestamptz default now(),
  unique(workspace_id, key)
);

create table board_columns (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  "order" integer not null default 0,
  wip_limit integer,
  color text default '#6366f1'
);

create table epics (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  title text not null,
  description text,
  color text default '#8b5cf6',
  start_date date,
  end_date date,
  status text default 'active' check (status in ('active','completed','cancelled'))
);

create table sprints (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  name text not null,
  goal text,
  start_date date,
  end_date date,
  status text default 'planned' check (status in ('planned','active','completed'))
);

create table issues (
  id uuid primary key default uuid_generate_v4(),
  project_id uuid references projects(id) on delete cascade,
  epic_id uuid references epics(id) on delete set null,
  parent_id uuid references issues(id) on delete cascade,
  sprint_id uuid references sprints(id) on delete set null,
  board_column_id uuid references board_columns(id) on delete set null,
  type text not null default 'task' check (type in ('epic','feature','story','task','bug','sub-task')),
  title text not null,
  description text,
  status text not null default 'todo' check (status in ('todo','in_progress','review','done')),
  priority text not null default 'medium' check (priority in ('critical','high','medium','low')),
  assignee_id uuid references auth.users(id) on delete set null,
  reporter_id uuid references auth.users(id) on delete set null,
  labels text[] default '{}',
  estimate integer,
  "order" float not null default 0,
  issue_number serial,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table comments (
  id uuid primary key default uuid_generate_v4(),
  issue_id uuid references issues(id) on delete cascade,
  author_id uuid references auth.users(id) on delete cascade,
  content text not null,
  created_at timestamptz default now()
);

create table activity_logs (
  id uuid primary key default uuid_generate_v4(),
  issue_id uuid references issues(id) on delete cascade,
  actor_id uuid references auth.users(id) on delete set null,
  action text not null,
  old_value text,
  new_value text,
  created_at timestamptz default now()
);

create or replace function update_updated_at()
returns trigger as $$
begin new.updated_at = now(); return new; end;
$$ language plpgsql;

create trigger issues_updated_at before update on issues
  for each row execute function update_updated_at();

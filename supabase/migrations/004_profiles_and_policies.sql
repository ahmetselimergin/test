-- Profiles for display names and team invites
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  avatar_url text,
  created_at timestamptz default now()
);

alter table profiles enable row level security;

create policy "profiles_select" on profiles
  for select using (
    id = auth.uid()
    or id in (
      select wm2.user_id
      from workspace_members wm1
      join workspace_members wm2 on wm2.workspace_id = wm1.workspace_id
      where wm1.user_id = auth.uid()
    )
  );

create policy "profiles_insert" on profiles
  for insert with check (id = auth.uid());

create policy "profiles_update" on profiles
  for update using (id = auth.uid());

-- Workspace settings update (owner / admin)
create policy "workspaces_update" on workspaces
  for update using (
    owner_id = auth.uid()
    or id in (
      select workspace_id from workspace_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

-- Team invites: owner/admin can add other members
drop policy if exists "wm_insert" on workspace_members;

create policy "wm_insert" on workspace_members
  for insert with check (
    user_id = auth.uid()
    or workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "wm_admin_update" on workspace_members
  for update using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
  );

create policy "wm_admin_delete" on workspace_members
  for delete using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid() and role in ('owner', 'admin')
    )
    and user_id <> auth.uid()
  );

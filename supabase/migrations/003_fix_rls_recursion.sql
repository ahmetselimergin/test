-- Fix infinite recursion in workspace_members RLS policy
-- The old wm_select policy queried workspace_members from within a workspace_members policy → infinite loop

drop policy if exists "wm_select" on workspace_members;

-- Security definer function: runs as the function owner (bypasses RLS), so it won't
-- trigger the workspace_members policy again when called from within an RLS policy.
create or replace function get_my_workspace_ids()
returns setof uuid
language sql
security definer
stable
set search_path = public
as $$
  select workspace_id from workspace_members where user_id = auth.uid()
$$;

-- Recreate the select policy using the helper function (no more recursion)
create policy "wm_select" on workspace_members
  for select using (
    workspace_id in (select get_my_workspace_ids())
  );

-- INSERT: a user can only add their own membership row
-- (the createWorkspace server action inserts user_id = auth.uid(), so this allows it)
create policy "wm_insert" on workspace_members
  for insert with check (user_id = auth.uid());

-- UPDATE/DELETE: a member can only modify/remove their own row
create policy "wm_update" on workspace_members
  for update using (user_id = auth.uid());

create policy "wm_delete" on workspace_members
  for delete using (user_id = auth.uid());

-- Fix workspaces SELECT policy:
-- PostgREST's insert().select() first inserts, then SELECTs the row back.
-- The old policy only checked workspace_members, but the member row doesn't exist yet
-- at SELECT time → PostgREST reports it as an RLS violation on the insert.
-- Fix: also allow the workspace owner to see their own workspace directly.
drop policy if exists "workspace_members_select" on workspaces;

create policy "workspaces_select" on workspaces
  for select using (
    owner_id = auth.uid()
    OR id in (select get_my_workspace_ids())
  );

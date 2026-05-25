alter table workspaces enable row level security;
alter table workspace_members enable row level security;
alter table projects enable row level security;
alter table board_columns enable row level security;
alter table epics enable row level security;
alter table sprints enable row level security;
alter table issues enable row level security;
alter table comments enable row level security;
alter table activity_logs enable row level security;

create policy "workspace_members_select" on workspaces
  for select using (
    id in (select workspace_id from workspace_members where user_id = auth.uid())
  );

create policy "workspace_members_insert" on workspaces
  for insert with check (owner_id = auth.uid());

create policy "wm_select" on workspace_members
  for select using (
    workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  );

create policy "projects_select" on projects
  for select using (
    workspace_id in (select workspace_id from workspace_members where user_id = auth.uid())
  );

create policy "projects_all" on projects
  for all using (
    workspace_id in (
      select workspace_id from workspace_members
      where user_id = auth.uid() and role in ('owner','admin','member')
    )
  );

create policy "issues_select" on issues
  for select using (
    project_id in (
      select p.id from projects p
      join workspace_members wm on wm.workspace_id = p.workspace_id
      where wm.user_id = auth.uid()
    )
  );

create policy "issues_all" on issues
  for all using (
    project_id in (
      select p.id from projects p
      join workspace_members wm on wm.workspace_id = p.workspace_id
      where wm.user_id = auth.uid() and wm.role in ('owner','admin','member')
    )
  );

create policy "board_columns_select" on board_columns
  for select using (
    project_id in (
      select p.id from projects p
      join workspace_members wm on wm.workspace_id = p.workspace_id
      where wm.user_id = auth.uid()
    )
  );

create policy "board_columns_all" on board_columns
  for all using (
    project_id in (
      select p.id from projects p
      join workspace_members wm on wm.workspace_id = p.workspace_id
      where wm.user_id = auth.uid() and wm.role in ('owner','admin','member')
    )
  );

create policy "epics_select" on epics for select using (
  project_id in (select p.id from projects p join workspace_members wm on wm.workspace_id = p.workspace_id where wm.user_id = auth.uid())
);
create policy "epics_all" on epics for all using (
  project_id in (select p.id from projects p join workspace_members wm on wm.workspace_id = p.workspace_id where wm.user_id = auth.uid() and wm.role in ('owner','admin','member'))
);

create policy "sprints_select" on sprints for select using (
  project_id in (select p.id from projects p join workspace_members wm on wm.workspace_id = p.workspace_id where wm.user_id = auth.uid())
);
create policy "sprints_all" on sprints for all using (
  project_id in (select p.id from projects p join workspace_members wm on wm.workspace_id = p.workspace_id where wm.user_id = auth.uid() and wm.role in ('owner','admin','member'))
);

create policy "comments_select" on comments for select using (
  issue_id in (select i.id from issues i join projects p on p.id = i.project_id join workspace_members wm on wm.workspace_id = p.workspace_id where wm.user_id = auth.uid())
);
create policy "comments_all" on comments for all using (author_id = auth.uid());

create policy "activity_logs_select" on activity_logs for select using (
  issue_id in (select i.id from issues i join projects p on p.id = i.project_id join workspace_members wm on wm.workspace_id = p.workspace_id where wm.user_id = auth.uid())
);

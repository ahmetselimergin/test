-- supabase/migrations/006_activity_trigger.sql

-- Allow authenticated users to insert activity logs (used by server actions)
create policy "activity_logs_insert"
  on activity_logs for insert
  with check (actor_id = auth.uid());

-- Function: fires after any issue UPDATE, logs status/priority changes
create or replace function log_issue_activity()
returns trigger as $$
begin
  if old.status is distinct from new.status then
    insert into activity_logs (issue_id, actor_id, action, old_value, new_value)
    values (new.id, auth.uid(), 'status_changed', old.status, new.status);
  end if;
  if old.priority is distinct from new.priority then
    insert into activity_logs (issue_id, actor_id, action, old_value, new_value)
    values (new.id, auth.uid(), 'priority_changed', old.priority, new.priority);
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger issues_activity_logger
  after update on issues
  for each row execute function log_issue_activity();

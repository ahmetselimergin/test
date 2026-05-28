-- comments.author_id ve activity_logs.actor_id FK'larını
-- auth.users yerine profiles'a bağla.
-- Bu sayede PostgREST author:profiles(...) join'ini çözebilir.

-- comments
alter table comments
  drop constraint if exists comments_author_id_fkey;

alter table comments
  add constraint comments_author_id_fkey
  foreign key (author_id) references profiles(id) on delete cascade;

-- activity_logs
alter table activity_logs
  drop constraint if exists activity_logs_actor_id_fkey;

alter table activity_logs
  add constraint activity_logs_actor_id_fkey
  foreign key (actor_id) references profiles(id) on delete set null;

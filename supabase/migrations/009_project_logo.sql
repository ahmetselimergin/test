-- projects tablosuna logo_url kolonu ekle
alter table projects
  add column if not exists logo_url text default null;

-- Supabase Storage bucket: project-logos (public)
insert into storage.buckets (id, name, public)
values ('project-logos', 'project-logos', true)
on conflict (id) do nothing;

-- Storage policy: authenticated users can upload
create policy "Auth users can upload project logos"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'project-logos');

create policy "Auth users can update project logos"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'project-logos');

create policy "Project logos are publicly readable"
  on storage.objects for select
  to public
  using (bucket_id = 'project-logos');

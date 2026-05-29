-- projects tablosuna pattern kolonu ekle
alter table projects
  add column if not exists pattern text not null default 'dots';

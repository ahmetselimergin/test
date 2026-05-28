-- workspaces tablosuna color kolonu ekle
alter table workspaces
  add column if not exists color text not null default '#6366f1';

-- Mevcut workspace'lerin rengi güncellenmesi için (opsiyonel)
-- update workspaces set color = '#6366f1' where color is null;

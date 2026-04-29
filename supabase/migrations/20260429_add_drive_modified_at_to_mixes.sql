alter table public.mixes
  add column if not exists drive_modified_at timestamp with time zone null;

create index if not exists mixes_published_drive_modified_at_idx
  on public.mixes (published, drive_modified_at desc, created_at desc);

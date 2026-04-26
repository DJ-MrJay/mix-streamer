alter table public.mixes
  add column if not exists genre text[] null,
  add column if not exists year integer null,
  add column if not exists metadata_status text not null default 'pending',
  add column if not exists metadata_extracted_at timestamp without time zone null,
  add column if not exists metadata_error text null;

create index if not exists mixes_metadata_status_idx
  on public.mixes (metadata_status);

insert into storage.buckets (id, name, public)
values ('mix-covers', 'mix-covers', true)
on conflict (id) do update
set public = excluded.public;

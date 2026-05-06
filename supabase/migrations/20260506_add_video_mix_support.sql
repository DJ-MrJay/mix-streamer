alter table public.mixes
  add column if not exists media_type text not null default 'audio';

update public.mixes
set media_type = 'audio'
where media_type is null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'mixes_media_type_check'
      and conrelid = 'public.mixes'::regclass
  ) then
    alter table public.mixes
      add constraint mixes_media_type_check
      check (media_type in ('audio', 'video'));
  end if;
end $$;

create index if not exists mixes_published_media_type_idx
  on public.mixes (published, media_type, drive_modified_at desc, created_at desc);

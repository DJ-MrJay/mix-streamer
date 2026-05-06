create table if not exists public.mix_tracks (
  id uuid primary key default gen_random_uuid(),
  mix_id uuid not null references public.mixes(id) on delete cascade,
  position integer not null check (position > 0),
  title text not null check (length(trim(title)) > 0),
  artist text null,
  start_time_seconds integer null check (
    start_time_seconds is null or start_time_seconds >= 0
  ),
  created_at timestamp with time zone not null default now(),
  unique (mix_id, position)
);

create index if not exists mix_tracks_mix_id_position_idx
  on public.mix_tracks (mix_id, position);

alter table public.mix_tracks enable row level security;

drop policy if exists "Public can read published mix tracks"
  on public.mix_tracks;

create policy "Public can read published mix tracks"
  on public.mix_tracks
  for select
  using (
    exists (
      select 1
      from public.mixes
      where mixes.id = mix_tracks.mix_id
        and mixes.published = true
    )
  );

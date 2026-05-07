do $$
declare
  slug_attnum smallint;
  slug_constraint record;
begin
  select attnum
  into slug_attnum
  from pg_attribute
  where attrelid = 'public.mixes'::regclass
    and attname = 'slug'
    and not attisdropped;

  for slug_constraint in
    select conname
    from pg_constraint
    where conrelid = 'public.mixes'::regclass
      and contype = 'u'
      and conkey = array[slug_attnum]
  loop
    execute format(
      'alter table public.mixes drop constraint %I',
      slug_constraint.conname
    );
  end loop;
end $$;

drop index if exists public.mixes_slug_key;
drop index if exists public.mixes_slug_idx;
drop index if exists public.mixes_slug_unique_idx;

with audio_slugs as (
  select distinct on (lower(regexp_replace(trim(title), '\s+', ' ', 'g')))
    lower(regexp_replace(trim(title), '\s+', ' ', 'g')) as title_key,
    slug
  from public.mixes
  where media_type = 'audio'
    and slug is not null
  order by
    lower(regexp_replace(trim(title), '\s+', ' ', 'g')),
    created_at nulls last
),
ranked_videos as (
  select
    id,
    lower(regexp_replace(trim(title), '\s+', ' ', 'g')) as title_key,
    row_number() over (
      partition by lower(regexp_replace(trim(title), '\s+', ' ', 'g'))
      order by created_at nulls last, id
    ) as title_rank
  from public.mixes
  where media_type = 'video'
    and slug is not null
)
update public.mixes as video_mix
set slug = audio_slugs.slug
from ranked_videos
join audio_slugs on audio_slugs.title_key = ranked_videos.title_key
where video_mix.id = ranked_videos.id
  and ranked_videos.title_rank = 1
  and video_mix.slug is distinct from audio_slugs.slug
  and not exists (
    select 1
    from public.mixes as duplicate_mix
    where duplicate_mix.id <> video_mix.id
      and duplicate_mix.media_type = video_mix.media_type
      and duplicate_mix.slug = audio_slugs.slug
  );

create unique index if not exists mixes_media_type_slug_key
  on public.mixes (media_type, slug)
  where slug is not null;

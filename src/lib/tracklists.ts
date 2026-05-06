import 'server-only'

import { cache } from 'react'

import { TRACKLISTS } from '@/data/tracklists'
import { getSupabase } from '@/lib/supabase'
import type { MixRecord, MixTrackRecord, TracklistsBySlug } from '@/types/mix'

type MixTracklistIdentity = Pick<MixRecord, 'id' | 'slug'>
type MixTracklistRow = Pick<MixTrackRecord, 'mix_id' | 'position' | 'title'>
type TracklistQueryError = { code?: string; message: string } | null
type TracklistQueryResult = {
  data: MixTracklistRow[] | null
  error: TracklistQueryError
}
type TracklistOrderBuilder = PromiseLike<TracklistQueryResult> & {
  order: (
    column: 'position',
    options: { ascending: boolean }
  ) => PromiseLike<TracklistQueryResult>
}
type TracklistFilterBuilder = {
  in: (column: 'mix_id', values: string[]) => TracklistOrderBuilder
}
type MixTracksTableClient = {
  select: (columns: 'mix_id, position, title') => TracklistFilterBuilder
}

const isMissingMixTracksTableError = (error: { code?: string; message?: string }) =>
  error.code === 'PGRST205' ||
  error.message?.toLowerCase().includes("could not find the table 'public.mix_tracks'")

const getFallbackTracklist = (slug: string | null) =>
  slug ? TRACKLISTS[slug] ?? [] : []

const getFallbackTracklistsBySlug = (mixes: MixTracklistIdentity[]) => {
  const fallbackTracklists: TracklistsBySlug = {}

  for (const mix of mixes) {
    const fallbackTracklist = getFallbackTracklist(mix.slug)

    if (mix.slug && fallbackTracklist.length) {
      fallbackTracklists[mix.slug] = fallbackTracklist
    }
  }

  return fallbackTracklists
}

export const getTracklistsForMixes = cache(
  async (mixes: MixTracklistIdentity[]): Promise<TracklistsBySlug> => {
    if (!mixes.length) {
      return {}
    }

    const mixIds = mixes.map((mix) => mix.id)
    const mixSlugsById = new Map(
      mixes
        .filter((mix): mix is MixTracklistIdentity & { slug: string } =>
          Boolean(mix.slug)
        )
        .map((mix) => [mix.id, mix.slug])
    )
    const mixTracksTable = getSupabase().from(
      'mix_tracks'
    ) as unknown as MixTracksTableClient
    const { data, error } = await mixTracksTable
      .select('mix_id, position, title')
      .in('mix_id', mixIds)
      .order('position', { ascending: true })

    if (error) {
      if (!isMissingMixTracksTableError(error)) {
        console.error('Error fetching mix tracklists:', error)
      }

      return getFallbackTracklistsBySlug(mixes)
    }

    const tracklistsBySlug: TracklistsBySlug = {}

    for (const track of data ?? []) {
      const slug = mixSlugsById.get(track.mix_id)

      if (!slug) {
        continue
      }

      tracklistsBySlug[slug] ??= []
      tracklistsBySlug[slug].push(track.title)
    }

    for (const mix of mixes) {
      if (!mix.slug || tracklistsBySlug[mix.slug]?.length) {
        continue
      }

      const fallbackTracklist = getFallbackTracklist(mix.slug)

      if (fallbackTracklist.length) {
        tracklistsBySlug[mix.slug] = fallbackTracklist
      }
    }

    return tracklistsBySlug
  }
)

export const getTracklistForMix = cache(async (mix: MixTracklistIdentity) => {
  if (!mix.slug) {
    return []
  }

  const tracklistsBySlug = await getTracklistsForMixes([mix])
  return tracklistsBySlug[mix.slug] ?? []
})

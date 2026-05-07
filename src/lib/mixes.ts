import { cache } from 'react'

import { getDisplayTrackInfo } from '@/lib/mix-display'
import { getMixMediaType } from '@/lib/mix-routes'
import type { MixMediaType, MixRecord } from '@/types/mix'

import { sortMixesByRecency } from './mix-sort'
import { getSupabase } from './supabase'

type MixDescriptionSource = Pick<
  MixRecord,
  'id' | 'title' | 'artist' | 'description'
>

const collapseWhitespace = (value: string) => value.replace(/\s+/g, ' ').trim()

const normalizeDescription = (value: string | null | undefined) =>
  collapseWhitespace(value ?? '') || null

const getMixSharedContentKey = (mix: Pick<MixRecord, 'title' | 'artist'>) =>
  collapseWhitespace(getDisplayTrackInfo(mix).title).toLowerCase()

export const getMixes = cache(async (): Promise<MixRecord[]> => {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('mixes')
    .select('*')
    .eq('published', true)

  if (error) {
    console.error('Error fetching mixes:', error)
    return []
  }

  return sortMixesByRecency((data ?? []) as MixRecord[])
})

export const getMixBySlug = cache(async (slug: string): Promise<MixRecord | null> => {
  const slugMatches = await getMixesBySlug(slug)
  return (
    slugMatches.find((mix) => getMixMediaType(mix) === 'audio') ??
    slugMatches[0] ??
    null
  )
})

export const getMixesBySlug = cache(async (slug: string): Promise<MixRecord[]> => {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('mixes')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)

  if (error) {
    console.error(`Error fetching mixes for slug "${slug}":`, error)
    return []
  }

  return sortMixesByRecency((data ?? []) as MixRecord[])
})

export const getMixBySlugAndMediaType = cache(
  async (
    slug: string,
    mediaType: MixMediaType
  ): Promise<MixRecord | null> => {
    const supabase = getSupabase()
    const { data, error } = await supabase
      .from('mixes')
      .select('*')
      .eq('slug', slug)
      .eq('media_type', mediaType)
      .eq('published', true)
      .maybeSingle()

    if (error) {
      console.error(
        `Error fetching ${mediaType} mix for slug "${slug}":`,
        error
      )
      return null
    }

    return (data as MixRecord | null) ?? null
  }
)

export const getMixesByMediaType = cache(async (mediaType: MixMediaType) =>
  (await getMixes()).filter((mix) => getMixMediaType(mix) === mediaType)
)

export const getAudioMixes = cache(() => getMixesByMediaType('audio'))

export const getVideoMixes = cache(() => getMixesByMediaType('video'))

export const getSharedMixDescription = cache(
  async (mix: MixDescriptionSource) => {
    const ownDescription = normalizeDescription(mix.description)

    if (ownDescription) {
      return ownDescription
    }

    const shareKey = getMixSharedContentKey(mix)
    const matchingMixes = await getMixes()
    const sharedMix = matchingMixes.find((candidateMix) => {
      if (candidateMix.id === mix.id) {
        return false
      }

      return (
        getMixSharedContentKey(candidateMix) === shareKey &&
        Boolean(normalizeDescription(candidateMix.description))
      )
    })

    return normalizeDescription(sharedMix?.description)
  }
)

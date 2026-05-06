import { cache } from 'react'

import type { MixRecord } from '@/types/mix'

import { sortMixesByRecency } from './mix-sort'
import { getSupabase } from './supabase'

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
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('mixes')
    .select('*')
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle()

  if (error) {
    console.error(`Error fetching mix for slug "${slug}":`, error)
    return null
  }

  return (data as MixRecord | null) ?? null
})

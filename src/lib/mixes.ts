import type { MixRecord } from '@/types/mix'

import { sortMixesByRecency } from './mix-sort'
import { getSupabase } from './supabase'

export async function getMixes(): Promise<MixRecord[]> {
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
}

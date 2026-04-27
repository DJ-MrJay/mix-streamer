import type { MixRecord } from '@/types/mix'

import { getSupabase } from './supabase'

export async function getMixes(): Promise<MixRecord[]> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('mixes')
    .select('*')
    .eq('published', true)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching mixes:', error)
    return []
  }

  return (data ?? []) as MixRecord[]
}

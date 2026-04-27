import { createClient, type SupabaseClient } from '@supabase/supabase-js'

import type { Database } from '@/types/supabase'

let supabase: SupabaseClient<Database> | undefined

const getRequiredEnv = (key: string) => {
  const value = process.env[key]?.trim()

  if (!value) {
    throw new Error(`${key} is not set`)
  }

  return value
}

export const getSupabase = (): SupabaseClient<Database> => {
  if (supabase) {
    return supabase
  }

  supabase = createClient<Database>(
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_URL'),
    getRequiredEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY')
  )

  return supabase
}

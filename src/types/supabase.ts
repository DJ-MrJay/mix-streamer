import type { MixRecord } from '@/types/mix'

type MixInsert = Partial<MixRecord> &
  Pick<MixRecord, 'title' | 'drive_file_id'>

type MixUpdate = Partial<MixRecord>

export interface Database {
  public: {
    Tables: {
      mixes: {
        Row: MixRecord
        Insert: MixInsert
        Update: MixUpdate
        Relationships: []
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

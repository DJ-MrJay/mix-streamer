import type { MixRecord, MixTrackRecord } from '@/types/mix'

type MixInsert = Partial<MixRecord> &
  Pick<MixRecord, 'title' | 'drive_file_id'>

type MixUpdate = Partial<MixRecord>
type MixTrackInsert = Partial<MixTrackRecord> &
  Pick<MixTrackRecord, 'mix_id' | 'position' | 'title'>
type MixTrackUpdate = Partial<MixTrackRecord>

export interface Database {
  public: {
    Tables: {
      mixes: {
        Row: MixRecord
        Insert: MixInsert
        Update: MixUpdate
        Relationships: []
      }
      mix_tracks: {
        Row: MixTrackRecord
        Insert: MixTrackInsert
        Update: MixTrackUpdate
        Relationships: [
          {
            foreignKeyName: 'mix_tracks_mix_id_fkey'
            columns: ['mix_id']
            isOneToOne: false
            referencedRelation: 'mixes'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<never, never>
    Functions: Record<never, never>
    Enums: Record<never, never>
    CompositeTypes: Record<never, never>
  }
}

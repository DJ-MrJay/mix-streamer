export type MixGenre = string[]

export type TracklistsBySlug = Record<string, string[]>

export type MixMetadataStatus =
  | 'pending'
  | 'processing'
  | 'succeeded'
  | 'failed'

export interface MixRecord {
  id: string
  title: string
  description: string | null
  cover_image_url: string | null
  drive_file_id: string
  duration: number | null
  slug: string | null
  published: boolean | null
  created_at: string | null
  drive_modified_at: string | null
  artist: string | null
  album: string | null
  genre: MixGenre | null
  year: number | null
  bitrate: number | null
  format: string | null
  metadata_status: MixMetadataStatus | null
  metadata_extracted_at: string | null
  metadata_error: string | null
}

export interface MixTrackRecord {
  id: string
  mix_id: string
  position: number
  title: string
  artist: string | null
  start_time_seconds: number | null
  created_at: string | null
}

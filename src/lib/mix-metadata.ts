import 'server-only'

import { parseStream, selectCover } from 'music-metadata'

import {
  getAudioFileDetailsByDriveFileId,
  getDriveFileStream,
} from '@/lib/audio-files'
import { getSupabaseAdmin } from '@/lib/supabase-admin'
import type { MixMetadataStatus, MixRecord } from '@/types/mix'

const DEFAULT_COVER_BUCKET = 'mix-covers'

type ExtractedMixMetadata = {
  title: string | null
  artist: string | null
  album: string | null
  genre: string[] | null
  year: number | null
  duration: number | null
  bitrate: number | null
  format: string | null
  coverImageUrl: string | null
}

type SupabaseMutationResult = {
  error: { message: string } | null
}

type SupabaseSingleResult<T> = {
  data: T | null
  error: { message: string } | null
}

type SupabaseManyResult<T> = {
  data: T[] | null
  error: { message: string } | null
}

type MixesUpdateBuilder = {
  eq: (column: 'id', value: string) => PromiseLike<SupabaseMutationResult> & {
    select: (columns: '*') => {
      single: () => PromiseLike<SupabaseSingleResult<MixRecord>>
    }
  }
}

type MixesSelectBuilder = PromiseLike<SupabaseManyResult<MixRecord>> & {
  eq: (column: 'id', value: string) => {
    single: () => PromiseLike<SupabaseSingleResult<MixRecord>>
  }
}

type MixesTableClient = {
  select: (columns: '*') => MixesSelectBuilder
  update: (values: Partial<MixRecord>) => MixesUpdateBuilder
}

export type MixMetadataSyncResult = {
  mixId: string
  status: MixMetadataStatus
  error: string | null
  updatedMix: MixRecord | null
}

const getMixesTable = (): MixesTableClient =>
  getSupabaseAdmin().from('mixes') as unknown as MixesTableClient

const getCoverBucket = () =>
  process.env.SUPABASE_MIX_ART_BUCKET?.trim() || DEFAULT_COVER_BUCKET

const normalizeText = (value: string | null | undefined) => {
  const trimmedValue = value?.trim()
  return trimmedValue ? trimmedValue : null
}

const normalizeInteger = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return null
  }

  const normalizedValue = Math.round(value)
  return normalizedValue > 0 ? normalizedValue : null
}

const normalizeYear = (
  year: number | null | undefined,
  date: string | null | undefined
) => {
  if (
    typeof year === 'number' &&
    Number.isInteger(year) &&
    year >= 1000 &&
    year <= 3000
  ) {
    return year
  }

  const yearMatch = date?.match(/\b(19|20)\d{2}\b/)

  if (!yearMatch) {
    return null
  }

  const parsedYear = Number.parseInt(yearMatch[0], 10)
  return parsedYear >= 1000 && parsedYear <= 3000 ? parsedYear : null
}

const normalizeGenres = (genres: string[] | null | undefined) => {
  if (!genres?.length) {
    return null
  }

  const uniqueGenres = Array.from(
    new Set(
      genres
        .map((genre) => genre.trim())
        .filter(Boolean)
    )
  )

  return uniqueGenres.length ? uniqueGenres : null
}

const getPictureExtension = (format: string) => {
  switch (format.toLowerCase()) {
    case 'image/jpeg':
    case 'image/jpg':
      return 'jpg'
    case 'image/png':
      return 'png'
    case 'image/webp':
      return 'webp'
    case 'image/gif':
      return 'gif'
    default:
      return format.split('/')[1] || 'bin'
  }
}

const getFormatName = (container: string | null | undefined) =>
  normalizeText(container)?.toLowerCase() ?? null

const getErrorMessage = (error: unknown) => {
  if (error instanceof Error && error.message) {
    return error.message
  }

  return 'Metadata sync failed.'
}

const uploadCoverArt = async ({
  mixId,
  coverArt,
}: {
  mixId: string
  coverArt: { data: Uint8Array; format: string }
}) => {
  const supabaseAdmin = getSupabaseAdmin()
  const bucket = getCoverBucket()
  const extension = getPictureExtension(coverArt.format)
  const path = `mixes/${mixId}/cover.${extension}`

  const { error } = await supabaseAdmin.storage
    .from(bucket)
    .upload(path, Buffer.from(coverArt.data), {
      cacheControl: '31536000',
      contentType: coverArt.format,
      upsert: true,
    })

  if (error) {
    throw new Error(`Failed to upload cover art: ${error.message}`)
  }

  const { data } = supabaseAdmin.storage.from(bucket).getPublicUrl(path)
  return data.publicUrl
}

const extractMixMetadata = async (mix: MixRecord): Promise<ExtractedMixMetadata> => {
  const fileDetails = await getAudioFileDetailsByDriveFileId(mix.drive_file_id)

  if (fileDetails.fileSize <= 0) {
    throw new Error('Audio file is empty or unavailable.')
  }

  const audioStream = await getDriveFileStream(fileDetails.fileId)

  try {
    const metadata = await parseStream(
      audioStream,
      {
        mimeType: fileDetails.contentType,
        path: fileDetails.fileName,
        size: fileDetails.fileSize,
      },
      {
        duration: true,
      }
    )

    const coverArt = selectCover(metadata.common.picture)
    const coverImageUrl = coverArt
      ? await uploadCoverArt({
          mixId: mix.id,
          coverArt,
        })
      : null

    return {
      title: normalizeText(metadata.common.title),
      artist: normalizeText(metadata.common.artist),
      album: normalizeText(metadata.common.album),
      genre: normalizeGenres(metadata.common.genre),
      year: normalizeYear(metadata.common.year, metadata.common.date),
      duration: normalizeInteger(metadata.format.duration),
      bitrate: normalizeInteger(metadata.format.bitrate),
      format: getFormatName(metadata.format.container ?? metadata.format.codec),
      coverImageUrl,
    }
  } finally {
    audioStream.destroy()
  }
}

const buildMixUpdate = (mix: MixRecord, extractedMetadata: ExtractedMixMetadata) => {
  return {
    title: extractedMetadata.title ?? mix.title,
    artist: extractedMetadata.artist ?? mix.artist ?? null,
    album: extractedMetadata.album ?? mix.album ?? null,
    genre: extractedMetadata.genre ?? mix.genre ?? null,
    year: extractedMetadata.year ?? mix.year ?? null,
    cover_image_url: extractedMetadata.coverImageUrl ?? mix.cover_image_url ?? null,
    duration: extractedMetadata.duration ?? mix.duration ?? null,
    bitrate: extractedMetadata.bitrate ?? mix.bitrate ?? null,
    format: extractedMetadata.format ?? mix.format ?? null,
    metadata_status: 'succeeded' as const,
    metadata_extracted_at: new Date().toISOString(),
    metadata_error: null,
  }
}

export const syncMixMetadata = async (
  mix: MixRecord
): Promise<MixMetadataSyncResult> => {
  const mixesTable = getMixesTable()

  const processingResult = await mixesTable
    .update({
      metadata_status: 'processing',
      metadata_error: null,
    })
    .eq('id', mix.id)

  if (processingResult.error) {
    throw new Error(processingResult.error.message)
  }

  try {
    const extractedMetadata = await extractMixMetadata(mix)
    const updatePayload = buildMixUpdate(mix, extractedMetadata)

    const { data: updatedMix, error } = await mixesTable
      .update(updatePayload)
      .eq('id', mix.id)
      .select('*')
      .single()

    if (error) {
      throw new Error(error.message)
    }

    return {
      mixId: mix.id,
      status: 'succeeded',
      error: null,
      updatedMix: updatedMix as MixRecord,
    }
  } catch (error) {
    const errorMessage = getErrorMessage(error)

    await mixesTable
      .update({
        metadata_status: 'failed',
        metadata_error: errorMessage,
      })
      .eq('id', mix.id)

    return {
      mixId: mix.id,
      status: 'failed',
      error: errorMessage,
      updatedMix: null,
    }
  }
}

export const syncMixMetadataById = async (mixId: string) => {
  const mixesTable = getMixesTable()
  const { data: mix, error } = await mixesTable
    .select('*')
    .eq('id', mixId)
    .single()

  if (error || !mix) {
    throw new Error(error?.message || 'Mix not found.')
  }

  return syncMixMetadata(mix as MixRecord)
}

export const syncMixMetadataBatch = async ({
  limit,
  publishedOnly,
}: {
  limit: number
  publishedOnly: boolean
}) => {
  const mixesTable = getMixesTable()
  const { data: mixes, error } = await mixesTable.select('*')

  if (error) {
    throw new Error(error.message)
  }

  const results: MixMetadataSyncResult[] = []
  const mixesToSync = (mixes ?? [])
    .filter((mix) => (publishedOnly ? mix.published === true : true))
    .sort((leftMix, rightMix) => {
      const leftTime = leftMix.created_at ? Date.parse(leftMix.created_at) : 0
      const rightTime = rightMix.created_at ? Date.parse(rightMix.created_at) : 0
      return rightTime - leftTime
    })
    .slice(0, limit)

  for (const mix of mixesToSync) {
    results.push(await syncMixMetadata(mix))
  }

  return results
}

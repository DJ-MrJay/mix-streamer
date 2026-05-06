import 'server-only'

import type { Readable } from 'node:stream'

import { getDrive } from '@/lib/google-drive'
import type { MixMediaType } from '@/types/mix'

export type MediaFileDetails = {
  fileId: string
  fileName: string
  fileSize: number
  contentType: string
  driveModifiedAt: string | null
  mediaType: MixMediaType
  thumbnailLink: string | null
  duration: number | null
}

export type AudioFileDetails = MediaFileDetails

const SUPPORTED_AUDIO_EXTENSIONS = [
  '.mp3',
  '.m4a',
  '.aac',
  '.wav',
  '.ogg',
  '.flac',
] as const

const SUPPORTED_VIDEO_EXTENSIONS = [
  '.mp4',
  '.m4v',
  '.mov',
  '.webm',
  '.mkv',
] as const

const getPositiveInteger = (value: string | number | null | undefined) => {
  const parsedValue =
    typeof value === 'number' ? value : Number.parseInt(String(value ?? ''), 10)

  return Number.isFinite(parsedValue) && parsedValue > 0
    ? Math.round(parsedValue)
    : null
}

export const getMediaType = (
  fileName: string,
  mimeType: string
): MixMediaType | null => {
  const normalizedName = fileName.toLowerCase()
  const normalizedMimeType = mimeType.toLowerCase()

  if (
    normalizedMimeType.startsWith('audio/') ||
    SUPPORTED_AUDIO_EXTENSIONS.some((extension) =>
      normalizedName.endsWith(extension)
    )
  ) {
    return 'audio'
  }

  if (
    normalizedMimeType.startsWith('video/') ||
    SUPPORTED_VIDEO_EXTENSIONS.some((extension) =>
      normalizedName.endsWith(extension)
    )
  ) {
    return 'video'
  }

  return null
}

export const isSupportedMediaFile = (fileName: string, mimeType: string) =>
  getMediaType(fileName, mimeType) !== null

export const getContentType = (fileName: string, mimeType: string) => {
  const normalizedName = fileName.toLowerCase()
  const normalizedMimeType = mimeType.toLowerCase()

  if (
    normalizedName.endsWith('.m4a') ||
    normalizedMimeType === 'audio/mp4' ||
    normalizedMimeType === 'audio/x-m4a'
  ) {
    return 'audio/mp4'
  }

  if (normalizedName.endsWith('.mp3') || normalizedMimeType === 'audio/mpeg') {
    return 'audio/mpeg'
  }

  if (normalizedName.endsWith('.wav') || normalizedMimeType === 'audio/wav') {
    return 'audio/wav'
  }

  if (normalizedName.endsWith('.ogg') || normalizedMimeType === 'audio/ogg') {
    return 'audio/ogg'
  }

  if (normalizedName.endsWith('.aac') || normalizedMimeType === 'audio/aac') {
    return 'audio/aac'
  }

  if (normalizedName.endsWith('.mp4') || normalizedMimeType === 'video/mp4') {
    return 'video/mp4'
  }

  if (
    normalizedName.endsWith('.m4v') ||
    normalizedMimeType === 'video/x-m4v'
  ) {
    return 'video/mp4'
  }

  if (
    normalizedName.endsWith('.mov') ||
    normalizedMimeType === 'video/quicktime'
  ) {
    return 'video/quicktime'
  }

  if (normalizedName.endsWith('.webm') || normalizedMimeType === 'video/webm') {
    return 'video/webm'
  }

  if (
    normalizedName.endsWith('.mkv') ||
    normalizedMimeType === 'video/x-matroska'
  ) {
    return 'video/x-matroska'
  }

  if (normalizedMimeType.startsWith('audio/')) {
    return normalizedMimeType
  }

  if (normalizedMimeType.startsWith('video/')) {
    return normalizedMimeType
  }

  return 'audio/mpeg'
}

export const getAudioFileDetailsByDriveFileId = async (
  driveFileId: string
): Promise<MediaFileDetails> => {
  const drive = getDrive()
  const fileMetadata = await drive.files.get({
    fileId: driveFileId,
    fields:
      'size, mimeType, name, modifiedTime, thumbnailLink, videoMediaMetadata(durationMillis)',
  })
  const fileName = fileMetadata.data.name || ''
  const mimeType = fileMetadata.data.mimeType || ''
  const mediaType = getMediaType(fileName, mimeType) ?? 'audio'
  const durationMillis = getPositiveInteger(
    fileMetadata.data.videoMediaMetadata?.durationMillis
  )

  return {
    fileId: driveFileId,
    fileName,
    fileSize: Number.parseInt(fileMetadata.data.size || '0', 10),
    contentType: getContentType(fileName, mimeType),
    driveModifiedAt: fileMetadata.data.modifiedTime || null,
    mediaType,
    thumbnailLink: fileMetadata.data.thumbnailLink || null,
    duration: durationMillis ? Math.round(durationMillis / 1000) : null,
  }
}

export const getDriveFileStream = async (driveFileId: string) => {
  const drive = getDrive()
  const response = await drive.files.get(
    {
      fileId: driveFileId,
      alt: 'media',
    },
    {
      responseType: 'stream',
    }
  )

  return response.data as Readable
}

import 'server-only'

import type { Readable } from 'node:stream'

import { drive } from '@/lib/google-drive'

export type AudioFileDetails = {
  fileId: string
  fileName: string
  fileSize: number
  contentType: string
}

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

  if (normalizedMimeType.startsWith('audio/')) {
    return normalizedMimeType
  }

  return 'audio/mpeg'
}

export const getAudioFileDetailsByDriveFileId = async (
  driveFileId: string
): Promise<AudioFileDetails> => {
  const fileMetadata = await drive.files.get({
    fileId: driveFileId,
    fields: 'size, mimeType, name',
  })

  return {
    fileId: driveFileId,
    fileName: fileMetadata.data.name || '',
    fileSize: Number.parseInt(fileMetadata.data.size || '0', 10),
    contentType: getContentType(
      fileMetadata.data.name || '',
      fileMetadata.data.mimeType || ''
    ),
  }
}

export const getDriveFileStream = async (driveFileId: string) => {
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

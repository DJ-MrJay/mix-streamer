'use server'

import { revalidatePath } from 'next/cache'

import { importNewMixesFromDriveFolder } from '@/lib/drive-folder-import'
import { syncMixMetadataBatch } from '@/lib/mix-metadata'

export type DriveImportActionState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  summary: {
    folderId: string | null
    videoFolderId: string | null
    scannedFolders: number
    scannedFiles: number
    supportedMediaFiles: number
    supportedAudioFiles: number
    supportedVideoFiles: number
    inserted: number
    skippedExisting: number
    skippedUnsupported: number
    metadataSynced: number
    metadataFailed: number
    publishImported: boolean
    syncMetadata: boolean
  } | null
  importedMixes: Array<{
    id: string
    title: string
    slug: string | null
    mediaType: string | null
    metadataStatus: string | null
  }>
  metadataFailures: Array<{
    mixId: string
    title: string
    error: string | null
  }>
}

export type MetadataSyncActionState = {
  status: 'idle' | 'success' | 'error'
  message: string | null
  summary: {
    requested: number
    succeeded: number
    failed: number
  } | null
  failures: Array<{
    mixId: string
    error: string | null
  }>
}

const getExpectedToken = () => {
  const token = process.env.MIX_METADATA_SYNC_TOKEN?.trim()

  if (!token) {
    throw new Error('MIX_METADATA_SYNC_TOKEN is not set')
  }

  return token
}

const normalizeLimit = (value: FormDataEntryValue | null) => {
  const parsedValue = Number.parseInt(String(value ?? ''), 10)

  if (!Number.isFinite(parsedValue)) {
    return 25
  }

  return Math.min(Math.max(parsedValue, 1), 100)
}

const isChecked = (value: FormDataEntryValue | null) => value === 'on'
const normalizeFolderId = (value: FormDataEntryValue | null) =>
  String(value ?? '').trim() || null

const getValidatedTokenError = (submittedToken: string, expectedToken: string) =>
  !submittedToken || submittedToken !== expectedToken
    ? 'The admin token is invalid.'
    : null

export async function runDriveFolderImportAction(
  _previousState: DriveImportActionState,
  formData: FormData
): Promise<DriveImportActionState> {
  try {
    const expectedToken = getExpectedToken()
    const submittedToken = String(formData.get('token') ?? '').trim()
    const tokenError = getValidatedTokenError(submittedToken, expectedToken)

    if (tokenError) {
      return {
        status: 'error',
        message: tokenError,
        summary: null,
        importedMixes: [],
        metadataFailures: [],
      }
    }

    const result = await importNewMixesFromDriveFolder({
      folderId: normalizeFolderId(formData.get('folderId')),
      videoFolderId: normalizeFolderId(formData.get('videoFolderId')),
      publishImported: isChecked(formData.get('publishImported')),
      syncMetadata: isChecked(formData.get('syncMetadata')),
    })

    revalidatePath('/')
    revalidatePath('/admin/metadata')

    const insertedCount = result.insertedMixes.length
    const metadataFailureCount = result.metadataFailed.length
    const message = insertedCount
      ? `Imported ${insertedCount} new mix${
          insertedCount === 1 ? '' : 'es'
        } from Google Drive${
          metadataFailureCount
            ? ` with ${metadataFailureCount} metadata sync failure${
                metadataFailureCount === 1 ? '' : 's'
              }.`
            : '.'
        }`
      : 'No new audio or video mixes were found in the configured Drive folders.'

    return {
      status: 'success',
      message,
      summary: {
        folderId: result.folderId,
        videoFolderId: result.videoFolderId,
        scannedFolders: result.scannedFolders,
        scannedFiles: result.scannedFiles,
        supportedMediaFiles: result.supportedMediaFiles,
        supportedAudioFiles: result.supportedAudioFiles,
        supportedVideoFiles: result.supportedVideoFiles,
        inserted: insertedCount,
        skippedExisting: result.skippedExisting,
        skippedUnsupported: result.skippedUnsupported,
        metadataSynced: result.metadataSynced,
        metadataFailed: metadataFailureCount,
        publishImported: result.publishImported,
        syncMetadata: result.syncMetadata,
      },
      importedMixes: result.insertedMixes.map((mix) => ({
        id: mix.id,
        title: mix.title,
        slug: mix.slug,
        mediaType: mix.mediaType,
        metadataStatus: mix.metadataStatus,
      })),
      metadataFailures: result.metadataFailed,
    }
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof Error ? error.message : 'Drive import failed unexpectedly.',
      summary: null,
      importedMixes: [],
      metadataFailures: [],
    }
  }
}

export async function runMetadataBatchSyncAction(
  _previousState: MetadataSyncActionState,
  formData: FormData
): Promise<MetadataSyncActionState> {
  try {
    const expectedToken = getExpectedToken()
    const submittedToken = String(formData.get('token') ?? '').trim()
    const tokenError = getValidatedTokenError(submittedToken, expectedToken)

    if (tokenError) {
      return {
        status: 'error',
        message: tokenError,
        summary: null,
        failures: [],
      }
    }

    const limit = normalizeLimit(formData.get('limit'))
    const publishedOnly = isChecked(formData.get('publishedOnly'))
    const results = await syncMixMetadataBatch({
      limit,
      publishedOnly,
    })

    revalidatePath('/')
    revalidatePath('/admin/metadata')

    const failures = results
      .filter((result) => result.status === 'failed')
      .map((result) => ({
        mixId: result.mixId,
        error: result.error,
      }))

    return {
      status: 'success',
      message: `Metadata sync finished for ${results.length} mix${
        results.length === 1 ? '' : 'es'
      }.`,
      summary: {
        requested: results.length,
        succeeded: results.filter((result) => result.status === 'succeeded').length,
        failed: failures.length,
      },
      failures,
    }
  } catch (error) {
    return {
      status: 'error',
      message:
        error instanceof Error ? error.message : 'Metadata sync failed unexpectedly.',
      summary: null,
      failures: [],
    }
  }
}

'use server'

import { revalidatePath } from 'next/cache'

import { syncMixMetadataBatch } from '@/lib/mix-metadata'

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

export async function runMetadataBatchSyncAction(
  _previousState: MetadataSyncActionState,
  formData: FormData
): Promise<MetadataSyncActionState> {
  try {
    const expectedToken = getExpectedToken()
    const submittedToken = String(formData.get('token') ?? '').trim()

    if (!submittedToken || submittedToken !== expectedToken) {
      return {
        status: 'error',
        message: 'The admin token is invalid.',
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

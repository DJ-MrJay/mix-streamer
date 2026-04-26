import { NextRequest } from 'next/server'

import {
  syncMixMetadataBatch,
  syncMixMetadataById,
} from '@/lib/mix-metadata'

export const runtime = 'nodejs'

type MetadataSyncRequest = {
  mixId?: string
  limit?: number
  publishedOnly?: boolean
}

const getRequestToken = (request: NextRequest) => {
  const authorizationHeader = request.headers.get('authorization')

  if (authorizationHeader?.startsWith('Bearer ')) {
    return authorizationHeader.slice('Bearer '.length).trim()
  }

  return request.headers.get('x-metadata-sync-token')?.trim() || null
}

const getExpectedToken = () => {
  const token = process.env.MIX_METADATA_SYNC_TOKEN?.trim()

  if (!token) {
    throw new Error('MIX_METADATA_SYNC_TOKEN is not set')
  }

  return token
}

const normalizeLimit = (value: number | undefined) => {
  if (!Number.isFinite(value)) {
    return 25
  }

  return Math.min(Math.max(Math.trunc(value ?? 25), 1), 100)
}

export async function POST(request: NextRequest) {
  try {
    const expectedToken = getExpectedToken()
    const requestToken = getRequestToken(request)

    if (!requestToken || requestToken !== expectedToken) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = (await request.json().catch(() => ({}))) as MetadataSyncRequest

    if (body.mixId) {
      const result = await syncMixMetadataById(body.mixId)
      return Response.json(result)
    }

    const results = await syncMixMetadataBatch({
      limit: normalizeLimit(body.limit),
      publishedOnly: body.publishedOnly ?? false,
    })

    return Response.json({
      summary: {
        requested: results.length,
        succeeded: results.filter((result) => result.status === 'succeeded').length,
        failed: results.filter((result) => result.status === 'failed').length,
      },
      results,
    })
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : 'Metadata sync failed.'

    return Response.json(
      {
        error: errorMessage,
      },
      { status: 500 }
    )
  }
}

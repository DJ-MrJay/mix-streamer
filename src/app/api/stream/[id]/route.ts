import { NextRequest } from 'next/server'
import { drive } from '@/lib/google-drive'
import { supabase } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const mixId = params.id

  // Get mix from DB
  const { data: mix, error } = await supabase
    .from('mixes')
    .select('drive_file_id')
    .eq('id', mixId)
    .single()

  if (error || !mix) {
    return new Response('Not found', { status: 404 })
  }

  const fileId = mix.drive_file_id

  // Handle range requests
  const range = req.headers.get('range') || undefined

  const response = await drive.files.get(
    {
      fileId,
      alt: 'media',
    },
    {
      responseType: 'stream',
      headers: range ? { Range: range } : undefined,
    }
  )

  const headers = new Headers()

  headers.set('Content-Type', 'audio/mpeg')
  headers.set('Accept-Ranges', 'bytes')

  if (range) {
    headers.set('Content-Range', response.headers['content-range'] || '')
  }

  return new Response(response.data as any, {
    status: range ? 206 : 200,
    headers,
  })
}
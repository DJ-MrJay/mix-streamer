import { NextRequest } from 'next/server'
import { drive } from '@/lib/google-drive'
import { supabase } from '@/lib/supabase'

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const mixId = params.id

    console.log('Requested ID:', mixId)

    const { data: mix, error } = await supabase
      .from('mixes')
      .select('drive_file_id')
      .eq('id', mixId)
      .single()

    console.log('Supabase result:', mix)
    console.log('Supabase error:', error)

    if (error || !mix) {
      return new Response('Not found', { status: 404 })
    }

    const fileId = mix.drive_file_id

    // Get file metadata to determine content type and size
    const fileMetadata = await drive.files.get({
      fileId,
      fields: 'size, mimeType, name',
    })

    const fileSize = parseInt(fileMetadata.data.size || '0')
    const fileName = fileMetadata.data.name || ''
    const fileMimeType = fileMetadata.data.mimeType || ''

    // Determine content type based on file extension or mime type
    let contentType = 'audio/mpeg' // default
    if (fileName.endsWith('.m4a') || fileMimeType === 'audio/mp4' || fileMimeType === 'audio/x-m4a') {
      contentType = 'audio/mp4' // M4A uses MP4 container
    } else if (fileName.endsWith('.mp3') || fileMimeType === 'audio/mpeg') {
      contentType = 'audio/mpeg'
    } else if (fileName.endsWith('.wav') || fileMimeType === 'audio/wav') {
      contentType = 'audio/wav'
    } else if (fileName.endsWith('.ogg') || fileMimeType === 'audio/ogg') {
      contentType = 'audio/ogg'
    } else if (fileName.endsWith('.aac') || fileMimeType === 'audio/aac') {
      contentType = 'audio/aac'
    } else if (fileMimeType && fileMimeType.startsWith('audio/')) {
      contentType = fileMimeType
    }

    console.log('File:', fileName, 'Type:', contentType, 'Size:', fileSize)

    const range = req.headers.get('range')
    
    let start = 0
    let end = fileSize - 1
    let statusCode = 200

    if (range) {
      const parts = range.replace(/bytes=/, "").split("-")
      start = parseInt(parts[0], 10)
      end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1
      statusCode = 206 // Partial content
    }

    const headers = new Headers()
    headers.set('Content-Type', contentType)
    headers.set('Accept-Ranges', 'bytes')
    headers.set('Content-Length', String(end - start + 1))
    
    if (range) {
      headers.set('Content-Range', `bytes ${start}-${end}/${fileSize}`)
    }
    
    // CORS headers
    headers.set('Access-Control-Allow-Origin', '*')
    headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    headers.set('Access-Control-Allow-Headers', 'Range, Content-Type')

    // Make request to Google Drive with range if specified
    const response = await drive.files.get(
      {
        fileId,
        alt: 'media',
      },
      {
        responseType: 'stream',
        headers: range ? { Range: `bytes=${start}-${end}` } : undefined,
      }
    )

    return new Response(response.data as any, {
      status: statusCode,
      headers,
    })
  } catch (error) {
    console.error('Stream error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}

// Handle OPTIONS requests for CORS preflight
export async function OPTIONS() {
  const headers = new Headers()
  headers.set('Access-Control-Allow-Origin', '*')
  headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
  headers.set('Access-Control-Allow-Headers', 'Range, Content-Type')
  return new Response(null, { status: 204, headers })
}
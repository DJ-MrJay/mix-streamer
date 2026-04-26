import type { MixRecord } from '@/types/mix'

type TrackDisplaySource = Pick<MixRecord, 'title' | 'artist'>

const normalizeText = (value: string | null | undefined) => {
  const trimmedValue = value?.trim()
  return trimmedValue ? trimmedValue : null
}

export const getDisplayTrackInfo = ({ title, artist }: TrackDisplaySource) => {
  const normalizedTitle = normalizeText(title) ?? 'Untitled Mix'
  const normalizedArtist = normalizeText(artist)

  if (normalizedArtist) {
    return {
      title: normalizedTitle,
      artist: normalizedArtist,
    }
  }

  const artistMatch = normalizedTitle.match(/^(.+?)\s+-\s+(.+)$/)

  if (artistMatch) {
    return {
      artist: artistMatch[1],
      title: artistMatch[2],
    }
  }

  return {
    title: normalizedTitle,
    artist: null,
  }
}

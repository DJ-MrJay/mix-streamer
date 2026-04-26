'use client'

import { SearchX } from 'lucide-react'
import { useDeferredValue } from 'react'

import MixCard from '@/components/mix/mix-card'
import { useTopBarSearch } from '@/components/navigation/top-bar-provider'
import type { PlayerTrack } from '@/hooks/use-player'

type Mix = PlayerTrack & {
  slug: string
  duration?: number | null
  description?: string | null
  album?: string | null
}

const getTrackInfo = (title: string) => {
  const artistMatch = title.match(/^(.+?)\s+-\s+(.+)$/)

  if (artistMatch) {
    return { artist: artistMatch[1], title: artistMatch[2] }
  }

  return { artist: null, title }
}

const getSearchableText = (mix: Mix) => {
  const trackInfo = getTrackInfo(mix.title)

  return [
    mix.title,
    trackInfo.title,
    mix.artist,
    trackInfo.artist,
    mix.album,
    mix.description,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
}

export default function MixGrid({ mixes }: { mixes: Mix[] }) {
  const { searchValue } = useTopBarSearch()
  const deferredSearchValue = useDeferredValue(searchValue)
  const normalizedQuery = deferredSearchValue.trim().toLowerCase()
  const trimmedSearchValue = searchValue.trim()

  const filteredMixes = normalizedQuery
    ? mixes.filter((mix) => getSearchableText(mix).includes(normalizedQuery))
    : mixes

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-1">
          <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
            Library
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            The Mix Crate
          </h1>
        </div>

        <p className="text-sm text-muted-foreground">
          {filteredMixes.length} {filteredMixes.length === 1 ? 'mix' : 'mixes'}
          {normalizedQuery
            ? ` matching "${trimmedSearchValue}"`
            : ' ready to play'}
        </p>
      </div>

      {filteredMixes.length ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
          {filteredMixes.map((mix) => (
            <MixCard key={mix.id} mix={mix} />
          ))}
        </div>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl bg-card/80 px-6 text-center shadow-[0_24px_48px_rgba(0,0,0,0.18)]">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SearchX className="size-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            No mixes matched your search
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Try a different title, artist, album, or keyword from the mix description.
          </p>
        </div>
      )}
    </div>
  )
}

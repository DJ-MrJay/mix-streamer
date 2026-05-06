'use client'

import { usePlayer } from '@/hooks/use-player'

export default function VideoPlayer({
  mixId,
  poster,
  title,
}: {
  mixId: string
  poster: string | null
  title: string
}) {
  return (
    <video
      controls
      playsInline
      preload="metadata"
      poster={poster ?? undefined}
      aria-label={title}
      onPlay={() => usePlayer.getState().pause()}
      className="aspect-video w-full rounded-lg bg-black shadow-2xl"
    >
      <source src={`/api/stream/${mixId}`} />
    </video>
  )
}

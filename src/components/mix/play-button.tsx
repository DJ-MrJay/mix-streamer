'use client'

import { usePlayer, type PlayerTrack } from '@/hooks/use-player'
import { Play, Pause, Loader2 } from 'lucide-react'

export default function PlayButton({ mix }: { mix: PlayerTrack }) {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    setTrack,
    play,
    pause,
  } = usePlayer()

  const isCurrent = currentTrack?.id === mix.id

  const handleClick = async () => {
    if (isCurrent && isPlaying) {
      pause()
    } else if (isCurrent && !isPlaying) {
      await play()
    } else {
      await setTrack(mix)
      await play()
    }
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
    >
      {isLoading ? (
        <Loader2 className="animate-spin" />
      ) : isCurrent && isPlaying ? (
        <Pause />
      ) : (
        <Play />
      )}
      Play
    </button>
  )
}

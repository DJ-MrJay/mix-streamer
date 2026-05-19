'use client'

import { usePlayer, type PlayerTrack } from '@/hooks/use-player'
import { Play, Pause, Loader2 } from 'lucide-react'

export default function PlayButton({ mix }: { mix: PlayerTrack }) {
  const {
    currentTrack,
    isPlaying,
    isLoading,
    currentTime,
    setTrack,
    play,
    pause,
  } = usePlayer()

  const isCurrent = currentTrack?.id === mix.id
  const isCurrentLoading = isCurrent && isLoading
  const isCurrentResumable = isCurrent && !isPlaying && currentTime > 0
  const buttonLabel = isCurrent && isPlaying
    ? 'Pause mix'
    : isCurrentResumable
      ? 'Resume mix'
      : 'Play mix'
  const buttonText = isCurrent && isPlaying
    ? 'Pause'
    : isCurrentResumable
      ? 'Resume'
      : 'Play'

  const handleClick = async () => {
    if (isCurrent && isPlaying) {
      pause()
    } else if (isCurrent && !isPlaying) {
      await play()
    } else {
      await setTrack(mix, { autoplay: true })
    }
  }

  return (
    <button
      onClick={handleClick}
      type="button"
      aria-label={buttonLabel}
      className="inline-flex items-center gap-2 rounded-full bg-primary px-3 py-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 sm:px-6"
    >
      {isCurrentLoading ? (
        <Loader2 className="size-5 animate-spin" />
      ) : isCurrent && isPlaying ? (
        <Pause className="size-5" />
      ) : (
        <Play className="size-5" />
      )}
      <span className="hidden sm:inline">{buttonText}</span>
    </button>
  )
}

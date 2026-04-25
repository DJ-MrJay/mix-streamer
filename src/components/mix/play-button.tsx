'use client'

import { usePlayer } from '@/hooks/use-player'
import { Play, Pause, Loader2 } from 'lucide-react'

export default function PlayButton({ mix }: { mix: any }) {
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
      className="bg-white text-black px-6 py-3 rounded-full flex items-center gap-2"
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
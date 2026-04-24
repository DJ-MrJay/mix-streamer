'use client'

import { usePlayer } from '@/hooks/use-player'

export default function PlayerBar() {
  const { currentTrack, isPlaying, toggle } = usePlayer()

  if (!currentTrack) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 border-t bg-white p-3 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">{currentTrack.title}</p>
      </div>

      <button onClick={toggle} className="text-sm">
        {isPlaying ? 'Pause' : 'Play'}
      </button>
    </div>
  )
}
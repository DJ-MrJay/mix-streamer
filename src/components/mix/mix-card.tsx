'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { usePlayer } from '@/hooks/use-player'
import { Play, Pause, Music, Headphones, Loader2 } from 'lucide-react'

type Mix = {
  id: string
  title: string
  slug: string
  drive_file_id: string
  cover_image_url?: string
  duration?: number
}

export default function MixCard({ mix }: { mix: Mix }) {
  const router = useRouter()

  const {
    currentTrack,
    setTrack,
    play,
    pause,
    isPlaying,
    isLoading,
  } = usePlayer()

  const [imageError, setImageError] = useState(false)
  const [isHovered, setIsHovered] = useState(false)

  const isCurrentTrack = currentTrack?.id === mix.id
  const isCurrentlyPlaying = isCurrentTrack && isPlaying
  const isCurrentlyLoading = isCurrentTrack && isLoading

  // Generate fallback gradient
  const getGradientColors = (id: string) => {
    const hash = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0)
    const hue1 = hash % 360
    const hue2 = (hue1 + 40) % 360
    return `from-[hsl(${hue1},70%,50%)] to-[hsl(${hue2},70%,45%)]`
  }

  // Extract artist if format is "Artist - Title"
  const getTrackInfo = (title: string) => {
    const artistMatch = title.match(/^(.+?)\s+-\s+(.+)$/)
    if (artistMatch) {
      return { artist: artistMatch[1], title: artistMatch[2] }
    }
    return { artist: null, title }
  }

  const trackInfo = getTrackInfo(mix.title)

  const handlePlayClick = async (e: React.MouseEvent) => {
    e.stopPropagation() // 🔥 prevents navigation

    if (isCurrentTrack && isPlaying) {
      pause()
    } else if (isCurrentTrack && !isPlaying) {
      await play()
    } else {
      await setTrack({
        id: mix.id,
        title: mix.title,
        drive_file_id: mix.drive_file_id,
        cover_image_url: mix.cover_image_url,
      })
      await play()
    }
  }

  const handleCardClick = () => {
    router.push(`/mix/${mix.slug}`)
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const duration = formatDuration(mix.duration)

  return (
    <div
      onClick={handleCardClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`group relative bg-gradient-to-br ${getGradientColors(
        mix.id
      )} rounded-xl overflow-hidden transition-all duration-300 hover:shadow-2xl cursor-pointer ${
        isCurrentTrack ? 'ring-2 ring-blue-500 shadow-lg shadow-blue-500/30' : ''
      }`}
    >
      {/* Album Art */}
      <div className="relative aspect-square overflow-hidden bg-black/20">
        {mix.cover_image_url && !imageError ? (
          <img
            src={mix.cover_image_url}
            alt={mix.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
            onError={() => setImageError(true)}
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center">
            <Music size={64} className="text-black/40 mb-2" />
            <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
              <Headphones size={32} className="text-black/40" />
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button */}
        <button
          onClick={handlePlayClick}
          className={`absolute inset-0 flex items-center justify-center transition-all duration-300 ${
            isHovered ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <div className="bg-white rounded-full p-4 transform transition-transform hover:scale-110 shadow-2xl">
            {isCurrentlyLoading ? (
              <Loader2 size={32} className="text-black animate-spin" />
            ) : isCurrentlyPlaying ? (
              <Pause size={32} fill="black" />
            ) : (
              <Play size={32} fill="black" className="ml-1" />
            )}
          </div>
        </button>

        {/* Duration */}
        {duration && (
          <div className="absolute bottom-2 right-2 bg-black/70 backdrop-blur-sm px-2 py-1 rounded-md text-xs text-white font-mono">
            {duration}
          </div>
        )}

        {/* Playing badge */}
        {isCurrentTrack && isPlaying && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
            <span>PLAYING</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3
          className="text-white font-semibold text-base truncate mb-1"
          title={trackInfo.title}
        >
          {trackInfo.title}
        </h3>

        {trackInfo.artist && (
          <p className="text-white/70 text-sm truncate">
            {trackInfo.artist}
          </p>
        )}

        {/* Progress bar */}
        {isCurrentTrack && (
          <div className="mt-3">
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div
                className="h-full bg-white transition-all duration-300"
                style={{
                  width: `${
                    (usePlayer.getState().currentTime /
                      usePlayer.getState().duration) *
                      100 || 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  )
}
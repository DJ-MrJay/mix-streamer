'use client'

import { useCallback, useEffect, useId, useRef } from 'react'

import { usePlayer } from '@/hooks/use-player'
import {
  AUDIO_PLAYBACK_STARTED_EVENT,
  VIDEO_PLAYBACK_STARTED_EVENT,
  type VideoPlaybackStartedDetail,
} from '@/lib/playback-coordination'

export default function VideoPlayer({
  mixId,
  poster,
  title,
}: {
  mixId: string
  poster: string | null
  title: string
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const sourceId = useId()

  const pauseVideo = useCallback(() => {
    const video = videoRef.current

    if (!video || video.paused) {
      return
    }

    video.pause()
  }, [])

  useEffect(() => {
    const handleAudioPlaybackStarted = () => {
      pauseVideo()
    }

    const handleVideoPlaybackStarted = (event: Event) => {
      const playbackEvent = event as CustomEvent<VideoPlaybackStartedDetail>

      if (playbackEvent.detail?.sourceId !== sourceId) {
        pauseVideo()
      }
    }

    window.addEventListener(
      AUDIO_PLAYBACK_STARTED_EVENT,
      handleAudioPlaybackStarted,
    )
    window.addEventListener(
      VIDEO_PLAYBACK_STARTED_EVENT,
      handleVideoPlaybackStarted,
    )

    return () => {
      window.removeEventListener(
        AUDIO_PLAYBACK_STARTED_EVENT,
        handleAudioPlaybackStarted,
      )
      window.removeEventListener(
        VIDEO_PLAYBACK_STARTED_EVENT,
        handleVideoPlaybackStarted,
      )
    }
  }, [pauseVideo, sourceId])

  const handlePlay = () => {
    usePlayer.getState().stop()
    window.dispatchEvent(
      new CustomEvent<VideoPlaybackStartedDetail>(VIDEO_PLAYBACK_STARTED_EVENT, {
        detail: { sourceId },
      }),
    )
  }

  return (
    <video
      ref={videoRef}
      controls
      playsInline
      preload="metadata"
      poster={poster ?? undefined}
      aria-label={title}
      onPlay={handlePlay}
      className="aspect-video w-full rounded-lg bg-black shadow-2xl"
    >
      <source src={`/api/stream/${mixId}`} />
    </video>
  )
}

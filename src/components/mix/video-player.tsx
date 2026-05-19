'use client'

import { useCallback, useEffect, useId, useRef, useState } from 'react'

import { usePlayer } from '@/hooks/use-player'
import {
  AUDIO_PLAYBACK_STARTED_EVENT,
  VIDEO_PLAYBACK_STARTED_EVENT,
  type VideoPlaybackStartedDetail,
} from '@/lib/playback-coordination'

const VIDEO_RESUME_STORAGE_KEY_PREFIX = 'mix-streamer-video-resume'

const canUseBrowserStorage = () =>
  typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

const getVideoResumeStorageKey = (mixId: string) =>
  `${VIDEO_RESUME_STORAGE_KEY_PREFIX}:${mixId}`

const readPersistedResumeTime = (mixId: string) => {
  if (!canUseBrowserStorage()) {
    return 0
  }

  try {
    const rawValue = window.localStorage.getItem(getVideoResumeStorageKey(mixId))

    if (!rawValue) {
      return 0
    }

    const parsedValue = Number.parseInt(rawValue, 10)
    return Number.isFinite(parsedValue) && parsedValue > 0 ? parsedValue : 0
  } catch (error) {
    console.error('Failed to read persisted video resume time:', error)
    return 0
  }
}

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
  const [resumeTime, setResumeTime] = useState(() => readPersistedResumeTime(mixId))
  const resumeTimeRef = useRef(resumeTime)
  const lastPersistedSecondRef = useRef<number | null>(
    resumeTime > 0 ? Math.floor(resumeTime) : null
  )

  const pauseVideo = useCallback(() => {
    const video = videoRef.current

    if (!video || video.paused) {
      return
    }

    video.pause()
  }, [])

  const clearPersistedResumeTime = useCallback(() => {
    if (!canUseBrowserStorage()) {
      return
    }

    try {
      window.localStorage.removeItem(getVideoResumeStorageKey(mixId))
      lastPersistedSecondRef.current = null
      resumeTimeRef.current = 0
      setResumeTime(0)
    } catch (error) {
      console.error('Failed to clear persisted video resume time:', error)
    }
  }, [mixId])

  const persistResumeTime = useCallback(
    (
      currentTime: number,
      duration: number,
      options?: { updateState?: boolean }
    ) => {
      if (!canUseBrowserStorage()) {
        return
      }

      const safeCurrentTime = Number.isFinite(currentTime)
        ? Math.max(0, Math.floor(currentTime))
        : 0
      const shouldClear =
        !safeCurrentTime ||
        (Number.isFinite(duration) &&
          duration > 0 &&
          safeCurrentTime >= Math.max(0, Math.floor(duration) - 1))

      if (shouldClear) {
        clearPersistedResumeTime()
        return
      }

      if (lastPersistedSecondRef.current === safeCurrentTime) {
        return
      }

      try {
        window.localStorage.setItem(
          getVideoResumeStorageKey(mixId),
          String(safeCurrentTime)
        )
        lastPersistedSecondRef.current = safeCurrentTime
        resumeTimeRef.current = safeCurrentTime

        if (options?.updateState) {
          setResumeTime(safeCurrentTime)
        }
      } catch (error) {
        console.error('Failed to persist video resume time:', error)
      }
    },
    [clearPersistedResumeTime, mixId]
  )

  useEffect(() => {
    const persistedResumeTime = readPersistedResumeTime(mixId)
    resumeTimeRef.current = persistedResumeTime
    lastPersistedSecondRef.current =
      persistedResumeTime > 0 ? Math.floor(persistedResumeTime) : null
    setResumeTime(persistedResumeTime)
  }, [mixId])

  useEffect(() => {
    const video = videoRef.current

    if (
      !video ||
      resumeTime <= 0 ||
      !video.paused ||
      video.currentTime > 0 ||
      video.readyState < HTMLMediaElement.HAVE_METADATA
    ) {
      return
    }

    const maxResumeTime = Number.isFinite(video.duration)
      ? Math.max(0, video.duration - 1)
      : resumeTime

    video.currentTime = Math.min(resumeTime, maxResumeTime)
  }, [resumeTime])

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

  useEffect(() => {
    const video = videoRef.current

    if (!video) {
      return
    }

    const handleLoadedMetadata = () => {
      const nextResumeTime = resumeTimeRef.current

      if (nextResumeTime <= 0) {
        return
      }

      const maxResumeTime = Number.isFinite(video.duration)
        ? Math.max(0, video.duration - 1)
        : nextResumeTime

      video.currentTime = Math.min(nextResumeTime, maxResumeTime)
    }

    const handleTimeUpdate = () => {
      persistResumeTime(video.currentTime, video.duration)
    }

    const handlePause = () => {
      persistResumeTime(video.currentTime, video.duration, { updateState: true })
    }

    const handleEnded = () => {
      clearPersistedResumeTime()
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [clearPersistedResumeTime, persistResumeTime])

  useEffect(() => {
    const persistCurrentVideoTime = () => {
      const video = videoRef.current

      if (!video) {
        return
      }

      persistResumeTime(video.currentTime, video.duration, { updateState: true })
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistCurrentVideoTime()
      }
    }

    window.addEventListener('pagehide', persistCurrentVideoTime)
    window.addEventListener('beforeunload', persistCurrentVideoTime)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', persistCurrentVideoTime)
      window.removeEventListener('beforeunload', persistCurrentVideoTime)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [persistResumeTime])

  const handlePlay = () => {
    const { pause, hidePlayerBar } = usePlayer.getState()

    pause()
    hidePlayerBar()
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

import { create } from 'zustand'

import type { MixGenre } from '@/types/mix'

const PLAYER_SESSION_STORAGE_KEY = 'mix-streamer-player-session'

export interface PlayerTrack {
  id: string
  title: string
  drive_file_id: string
  slug?: string | null
  cover_image_url?: string
  artist?: string | null
  album?: string | null
  genre?: MixGenre | null
  year?: number | null
}

interface SetTrackOptions {
  autoplay?: boolean
}

type PersistedPlayerSession = {
  track: PlayerTrack
  currentTime: number
}

interface PlayerState {
  currentTrack: PlayerTrack | null
  audio: HTMLAudioElement | null
  isPlaying: boolean
  currentTime: number
  duration: number
  isLoading: boolean
  error: string | null

  setTrack: (track: PlayerTrack, options?: SetTrackOptions) => Promise<void>
  toggle: () => Promise<void>
  seek: (time: number) => void
  play: () => Promise<void>
  pause: () => void
}

export const usePlayer = create<PlayerState>((set, get) => {
  let audioCleanup: (() => void) | null = null
  let lifecycleListenersAttached = false
  let lastPersistedSessionSnapshot: string | null = null

  const canUseBrowserStorage = () =>
    typeof window !== 'undefined' && typeof window.localStorage !== 'undefined'

  const readPersistedPlayerSession = (): PersistedPlayerSession | null => {
    if (!canUseBrowserStorage()) {
      return null
    }

    try {
      const rawValue = window.localStorage.getItem(PLAYER_SESSION_STORAGE_KEY)

      if (!rawValue) {
        return null
      }

      const parsedValue = JSON.parse(rawValue) as Partial<PersistedPlayerSession>

      if (
        !parsedValue ||
        typeof parsedValue !== 'object' ||
        !parsedValue.track ||
        typeof parsedValue.track !== 'object' ||
        typeof parsedValue.track.id !== 'string' ||
        typeof parsedValue.track.title !== 'string' ||
        typeof parsedValue.track.drive_file_id !== 'string'
      ) {
        return null
      }

      return {
        track: parsedValue.track as PlayerTrack,
        currentTime:
          typeof parsedValue.currentTime === 'number' &&
          Number.isFinite(parsedValue.currentTime) &&
          parsedValue.currentTime > 0
            ? parsedValue.currentTime
            : 0,
      }
    } catch (error) {
      console.error('Failed to read persisted player session:', error)
      return null
    }
  }

  const clearPersistedPlayerSession = () => {
    if (!canUseBrowserStorage()) {
      return
    }

    try {
      window.localStorage.removeItem(PLAYER_SESSION_STORAGE_KEY)
      lastPersistedSessionSnapshot = null
    } catch (error) {
      console.error('Failed to clear persisted player session:', error)
    }
  }

  const persistPlayerSession = () => {
    if (!canUseBrowserStorage()) {
      return
    }

    const { currentTrack, currentTime, duration } = get()

    if (!currentTrack) {
      clearPersistedPlayerSession()
      return
    }

    const safeCurrentTime = Number.isFinite(currentTime)
      ? Math.max(0, Math.floor(currentTime))
      : 0

    if (Number.isFinite(duration) && duration > 0 && safeCurrentTime >= duration) {
      clearPersistedPlayerSession()
      return
    }

    try {
      const serializedSession = JSON.stringify({
        track: currentTrack,
        currentTime: safeCurrentTime,
      } satisfies PersistedPlayerSession)

      if (serializedSession === lastPersistedSessionSnapshot) {
        return
      }

      window.localStorage.setItem(
        PLAYER_SESSION_STORAGE_KEY,
        serializedSession
      )
      lastPersistedSessionSnapshot = serializedSession
    } catch (error) {
      console.error('Failed to persist player session:', error)
    }
  }

  const attachLifecycleListeners = () => {
    if (lifecycleListenersAttached || typeof window === 'undefined') {
      return
    }

    const persistOnHidden = () => {
      persistPlayerSession()
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        persistPlayerSession()
      }
    }

    window.addEventListener('pagehide', persistOnHidden)
    window.addEventListener('beforeunload', persistOnHidden)
    document.addEventListener('visibilitychange', handleVisibilityChange)
    lifecycleListenersAttached = true
  }

  const isActiveAudio = (audio: HTMLAudioElement) => get().audio === audio

  const getMediaErrorMessage = (audio: HTMLAudioElement) => {
    const mediaError = audio.error

    if (!mediaError) {
      return 'Unable to load this mix.'
    }

    switch (mediaError.code) {
      case MediaError.MEDIA_ERR_ABORTED:
        return 'Playback was interrupted.'
      case MediaError.MEDIA_ERR_NETWORK:
        return 'Network error while loading audio.'
      case MediaError.MEDIA_ERR_DECODE:
        return 'This audio file could not be decoded.'
      case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
        return 'This audio format is not supported on this device.'
      default:
        return 'Unable to play this mix.'
    }
  }

  const getPlayErrorMessage = (error: unknown) => {
    if (error instanceof DOMException && error.name === 'AbortError') {
      return null
    }

    if (error instanceof DOMException && error.name === 'NotAllowedError') {
      return 'Playback was blocked by the browser. Try using the play button again.'
    }

    if (error instanceof DOMException && error.name === 'NotSupportedError') {
      return 'This audio format is not supported on this device.'
    }

    return 'Failed to start playback. Please try again.'
  }

  const releaseAudio = (audio: HTMLAudioElement | null) => {
    if (audioCleanup) {
      audioCleanup()
      audioCleanup = null
    }

    if (!audio) {
      return
    }

    audio.pause()
    audio.removeAttribute('src')
    audio.load()
  }

  const attachAudioListeners = (
    audio: HTMLAudioElement,
    resumeTime = 0
  ) => {
    const syncState = (state: Partial<PlayerState>) => {
      if (!isActiveAudio(audio)) {
        return
      }

      set(state)
      persistPlayerSession()
    }

    const onLoadStart = () => {
      syncState({ isLoading: true, error: null })
    }

    const onLoadedMetadata = () => {
      if (resumeTime > 0) {
        const maxResumeTime = Number.isFinite(audio.duration)
          ? Math.max(0, audio.duration - 1)
          : resumeTime

        audio.currentTime = Math.min(resumeTime, maxResumeTime)
      }

      syncState({
        currentTime: Number.isFinite(audio.currentTime) ? audio.currentTime : 0,
        duration: Number.isFinite(audio.duration) ? audio.duration : 0,
      })
    }

    const onCanPlay = () => {
      syncState({ isLoading: false })
    }

    const onTimeUpdate = () => {
      syncState({ currentTime: audio.currentTime })
    }

    const onWaiting = () => {
      syncState({ isLoading: true })
    }

    const onPlaying = () => {
      syncState({ isLoading: false, isPlaying: true, error: null })
    }

    const onPause = () => {
      syncState({ isLoading: false, isPlaying: false })
    }

    const onEnded = () => {
      syncState({ currentTime: 0, isLoading: false, isPlaying: false })
      clearPersistedPlayerSession()
    }

    const onError = () => {
      syncState({
        error: getMediaErrorMessage(audio),
        isLoading: false,
        isPlaying: false,
      })
    }

    audio.addEventListener('loadstart', onLoadStart)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)

    return () => {
      audio.removeEventListener('loadstart', onLoadStart)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('canplay', onCanPlay)
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('error', onError)
    }
  }

  const createAudio = (track: PlayerTrack, resumeTime = 0) => {
    const audio = new Audio(`/api/stream/${track.id}`)
    audio.preload = 'metadata'
    audioCleanup = attachAudioListeners(audio, resumeTime)
    return audio
  }

  const playAudio = async (audio: HTMLAudioElement) => {
    if (!isActiveAudio(audio)) {
      return
    }

    if (!audio.paused) {
      set({ error: null, isLoading: false, isPlaying: true })
      return
    }

    if (Number.isFinite(audio.duration) && audio.currentTime >= audio.duration) {
      audio.currentTime = 0
    }

    set({ error: null, isLoading: true })

    try {
      await audio.play()

      if (isActiveAudio(audio)) {
        set({ error: null, isLoading: false, isPlaying: true })
        persistPlayerSession()
      }
    } catch (error) {
      if (!isActiveAudio(audio)) {
        return
      }

      const errorMessage = getPlayErrorMessage(error)

      set({
        error: errorMessage,
        isLoading: false,
        isPlaying: false,
      })
      persistPlayerSession()
    }
  }

  attachLifecycleListeners()

  const persistedPlayerSession = readPersistedPlayerSession()
  const restoredAudio = persistedPlayerSession
    ? createAudio(persistedPlayerSession.track, persistedPlayerSession.currentTime)
    : null

  if (restoredAudio) {
    restoredAudio.load()
  }

  return {
    currentTrack: persistedPlayerSession?.track ?? null,
    audio: restoredAudio,
    isPlaying: false,
    currentTime: persistedPlayerSession?.currentTime ?? 0,
    duration: 0,
    isLoading: Boolean(restoredAudio),
    error: null,

    setTrack: async (track, options) => {
      const autoplay = options?.autoplay ?? false
      const { audio: currentAudio, currentTrack } = get()

      if (currentAudio && currentTrack?.id === track.id) {
        set({ currentTrack: track, error: null })
        persistPlayerSession()

        if (autoplay) {
          await playAudio(currentAudio)
        }

        return
      }

      releaseAudio(currentAudio)

      const audio = createAudio(track)
      audio.preload = autoplay ? 'auto' : 'metadata'

      set({
        currentTrack: track,
        audio,
        currentTime: 0,
        duration: 0,
        isLoading: true,
        isPlaying: false,
        error: null,
      })
      persistPlayerSession()

      if (autoplay) {
        await playAudio(audio)
        return
      }

      audio.load()
    },

    play: async () => {
      const { audio, currentTrack } = get()

      if (!audio || !currentTrack) {
        return
      }

      await playAudio(audio)
    },

    pause: () => {
      const { audio } = get()

      if (!audio) {
        return
      }

      audio.pause()
      set({ isLoading: false, isPlaying: false })
      persistPlayerSession()
    },

    toggle: async () => {
      const { isPlaying, pause, play } = get()

      if (isPlaying) {
        pause()
        return
      }

      await play()
    },

    seek: (time) => {
      const { audio } = get()

      if (!audio || Number.isNaN(time) || time < 0) {
        return
      }

      const maxTime = Number.isFinite(audio.duration) ? audio.duration : time
      const nextTime = Math.min(time, maxTime)

      audio.currentTime = nextTime
      set({ currentTime: nextTime })
      persistPlayerSession()
    },
  }
})

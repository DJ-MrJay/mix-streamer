import { create } from 'zustand'

import type { MixGenre } from '@/types/mix'

export interface PlayerTrack {
  id: string
  title: string
  drive_file_id: string
  cover_image_url?: string
  artist?: string | null
  album?: string | null
  genre?: MixGenre | null
  year?: number | null
}

interface SetTrackOptions {
  autoplay?: boolean
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

  const attachAudioListeners = (audio: HTMLAudioElement) => {
    const syncState = (state: Partial<PlayerState>) => {
      if (!isActiveAudio(audio)) {
        return
      }

      set(state)
    }

    const onLoadStart = () => {
      syncState({ isLoading: true, error: null })
    }

    const onLoadedMetadata = () => {
      syncState({
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
    }
  }

  return {
    currentTrack: null,
    audio: null,
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    isLoading: false,
    error: null,

    setTrack: async (track, options) => {
      const autoplay = options?.autoplay ?? false
      const { audio: currentAudio, currentTrack } = get()

      if (currentAudio && currentTrack?.id === track.id) {
        set({ currentTrack: track, error: null })

        if (autoplay) {
          await playAudio(currentAudio)
        }

        return
      }

      releaseAudio(currentAudio)

      const audio = new Audio(`/api/stream/${track.id}`)
      audio.preload = autoplay ? 'auto' : 'metadata'
      audioCleanup = attachAudioListeners(audio)

      set({
        currentTrack: track,
        audio,
        currentTime: 0,
        duration: 0,
        isLoading: true,
        isPlaying: false,
        error: null,
      })

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
    },
  }
})

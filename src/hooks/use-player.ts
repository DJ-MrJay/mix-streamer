import { create } from 'zustand'

export interface PlayerTrack {
  id: string
  title: string
  drive_file_id: string
  cover_image_url?: string
  artist?: string | null
}

interface PlayerState {
  currentTrack: PlayerTrack | null
  audio: HTMLAudioElement | null
  isPlaying: boolean
  currentTime: number
  duration: number
  isLoading: boolean
  error: string | null

  setTrack: (track: PlayerTrack) => Promise<void>
  toggle: () => void
  seek: (time: number) => void
  play: () => Promise<void>
  pause: () => void
}

export const usePlayer = create<PlayerState>((set, get) => ({
  currentTrack: null,
  audio: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  isLoading: false,
  error: null,

  setTrack: async (track) => {
    const currentAudio = get().audio
    
    // Clean up previous audio
    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
      currentAudio.src = ''
      currentAudio.load() // Force reload to release resources
    }

    set({ isLoading: true, error: null, currentTime: 0, duration: 0, isPlaying: false })

    // Create new audio element with cross-origin support
    const audio = new Audio()
    audio.crossOrigin = 'anonymous'
    audio.preload = 'metadata' // Mobile: only load metadata first
    
    // Set source after attaching event listeners
    audio.src = `/api/stream/${track.id}`
    audio.load() // Initiate loading

    // Event listeners
    const onTimeUpdate = () => {
      set({ currentTime: audio.currentTime })
    }

    const onLoadedMetadata = () => {
      console.log('Metadata loaded:', audio.duration, audio.readyState)
      set({ duration: audio.duration, isLoading: false })
    }

    const onCanPlay = () => {
      console.log('Can play event fired')
      set({ isLoading: false })
    }

    const onEnded = () => {
      console.log('Playback ended')
      set({ isPlaying: false, currentTime: 0 })
    }

    const onError = () => {
      const error = audio.error
      let errorMessage = 'Unknown error'
      
      if (error) {
        switch (error.code) {
          case MediaError.MEDIA_ERR_ABORTED:
            errorMessage = 'Playback aborted'
            break
          case MediaError.MEDIA_ERR_NETWORK:
            errorMessage = 'Network error - check your connection'
            break
          case MediaError.MEDIA_ERR_DECODE:
            errorMessage = 'Audio format not supported'
            break
          case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
            errorMessage = 'Audio format not supported on this device'
            break
        }
      }
      
      console.error('Audio error:', errorMessage, error)
      set({ error: errorMessage, isLoading: false, isPlaying: false })
    }

    const onWaiting = () => {
      console.log('Buffering...')
      set({ isLoading: true })
    }

    const onPlaying = () => {
      console.log('Playing event fired')
      set({ isLoading: false, isPlaying: true })
    }

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('canplay', onCanPlay)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('error', onError)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('playing', onPlaying)

    set({ 
      currentTrack: track, 
      audio, 
      isPlaying: false,
      currentTime: 0,
      duration: 0,
      isLoading: true,
      error: null
    })

    // Don't autoplay on mobile - let user initiate
    // But if on desktop or user preference, attempt play
    // Mobile browsers require user interaction first
  },

  play: async () => {
    const { audio, currentTrack } = get()
    if (!audio || !currentTrack) return

    try {
      set({ isLoading: true, error: null })
      
      // For mobile: ensure audio is unlocked
      if (audio.paused) {
        // Reset audio if it ended
        if (audio.currentTime >= audio.duration) {
          audio.currentTime = 0
        }
        
        await audio.play()
        set({ isPlaying: true, isLoading: false })
      }
    } catch (err) {
      console.error('Play failed:', err)
      // Handle mobile autoplay restrictions
      if (err instanceof Error && err.name === 'NotAllowedError') {
        set({ error: 'Browser requires user interaction first. Click the play button again.' })
      } else {
        set({ error: 'Failed to play audio. Please try again.' })
      }
      set({ isPlaying: false, isLoading: false })
      throw err
    }
  },

  pause: () => {
    const { audio } = get()
    if (!audio) return
    
    audio.pause()
    set({ isPlaying: false })
  },

  toggle: async () => {
    const { isPlaying, play, pause } = get()
    
    if (isPlaying) {
      pause()
    } else {
      await play()
    }
  },

  seek: (time) => {
    const { audio } = get()
    if (!audio) return
    
    if (!isNaN(time) && time >= 0 && time <= audio.duration) {
      audio.currentTime = time
      set({ currentTime: time })
    }
  },
}))

import { create } from 'zustand'

interface PlayerState {
  currentTrack: any
  audio: HTMLAudioElement | null
  isPlaying: boolean
  currentTime: number
  duration: number

  setTrack: (track: any) => void
  toggle: () => void
  seek: (time: number) => void
}

export const usePlayer = create<PlayerState>((set, get) => ({
  currentTrack: null,
  audio: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,

  setTrack: (track) => {
    const currentAudio = get().audio

    if (currentAudio) {
      currentAudio.pause()
      currentAudio.currentTime = 0
    }

    const audio = new Audio(`/api/stream/${track.id}`)

    audio.addEventListener('timeupdate', () => {
      set({ currentTime: audio.currentTime })
    })

    audio.addEventListener('loadedmetadata', () => {
      set({ duration: audio.duration })
    })

    audio.addEventListener('ended', () => {
      set({ isPlaying: false })
    })

    set({
      currentTrack: track,
      audio,
      isPlaying: true,
      currentTime: 0,
      duration: 0,
    })

    audio.play()
  },

  toggle: () => {
    const { audio, isPlaying } = get()
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      set({ isPlaying: false })
    } else {
      audio.play()
      set({ isPlaying: true })
    }
  },

  seek: (time) => {
    const { audio } = get()
    if (!audio) return

    audio.currentTime = time
    set({ currentTime: time })
  },
}))
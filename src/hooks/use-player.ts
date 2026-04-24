import { create } from 'zustand'

type Track = {
  id: string
  title: string
  drive_file_id: string
  cover_image_url?: string | null
}

type PlayerState = {
  currentTrack: Track | null
  isPlaying: boolean
  audio: HTMLAudioElement | null

  setTrack: (track: Track) => void
  play: () => void
  pause: () => void
  toggle: () => void
}

export const usePlayer = create<PlayerState>((set, get) => ({
  currentTrack: null,
  isPlaying: false,
  audio: null,

  setTrack: (track) => {
    const audio = new Audio()

    set({
      currentTrack: track,
      audio,
      isPlaying: true,
    })

    get().play()
  },

  play: () => {
    const audio = get().audio
    if (!audio) return

    audio.play()
    set({ isPlaying: true })
  },

  pause: () => {
    const audio = get().audio
    if (!audio) return

    audio.pause()
    set({ isPlaying: false })
  },

  toggle: () => {
    const { isPlaying, play, pause } = get()
    if (isPlaying) pause()
    else play()
  },
}))
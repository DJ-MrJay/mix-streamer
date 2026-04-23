import { create } from 'zustand'

type PlayerState = {
  currentTrack: any | null
  isPlaying: boolean
  setTrack: (track: any) => void
  play: () => void
  pause: () => void
}

export const usePlayer = create<PlayerState>((set) => ({
  currentTrack: null,
  isPlaying: false,
  setTrack: (track) => set({ currentTrack: track, isPlaying: true }),
  play: () => set({ isPlaying: true }),
  pause: () => set({ isPlaying: false }),
}))
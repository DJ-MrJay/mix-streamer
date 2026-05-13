export const AUDIO_PLAYBACK_STARTED_EVENT =
  'mix-streamer:audio-playback-started'

export const VIDEO_PLAYBACK_STARTED_EVENT =
  'mix-streamer:video-playback-started'

export type VideoPlaybackStartedDetail = {
  sourceId: string
}

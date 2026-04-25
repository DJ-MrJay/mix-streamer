// src/app/(player)/mix/[slug]/page.tsx

import { supabase } from '@/lib/supabase'
import PlayButton from '@/components/mix/play-button'

export default async function MixPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params

  const { data: mix } = await supabase
    .from('mixes')
    .select('*')
    .eq('slug', slug)
    .single()

  if (!mix) {
    return <div className="p-6">Mix not found</div>
  }

  // Optional: extract artist if format is "Artist - Title"
  const getTrackInfo = (title: string) => {
    const match = title.match(/^(.+?)\s+-\s+(.+)$/)
    if (match) return { artist: match[1], title: match[2] }
    return { artist: null, title }
  }

  const trackInfo = getTrackInfo(mix.title)

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, '0')}:${s
        .toString()
        .padStart(2, '0')}`
    }
    return `${m}:${s.toString().padStart(2, '0')}`
  }

  return (
    <div className="min-h-screen pb-28">
      {/* HERO */}
      <div className="relative">
        {/* Background blur */}
        {mix.cover_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110"
            style={{ backgroundImage: `url(${mix.cover_image_url})` }}
          />
        )}

        <div className="relative max-w-6xl mx-auto px-4 pt-8 pb-6">
          <div className="flex flex-col md:flex-row gap-6 items-start md:items-end">
            {/* Cover */}
            <img
              src={mix.cover_image_url}
              alt={mix.title}
              className="w-full max-w-xs md:w-64 aspect-square object-cover rounded-xl shadow-2xl"
            />

            {/* Info */}
            <div className="flex-1">
              <p className="text-xs uppercase text-gray-400 mb-2">
                DJ Mix
              </p>

              <h1 className="text-2xl md:text-4xl font-bold text-white mb-2">
                {trackInfo.title}
              </h1>

              {trackInfo.artist && (
                <p className="text-gray-300 mb-2">
                  {trackInfo.artist}
                </p>
              )}

              <div className="text-sm text-gray-400 mb-4">
                {formatDuration(mix.duration)}
              </div>

              {/* PLAY BUTTON */}
              <PlayButton mix={mix} />
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="max-w-6xl mx-auto px-4 mt-6">
        {/* Description */}
        {mix.description && (
          <div className="mb-8">
            <h2 className="text-white text-lg font-semibold mb-2">
              About this mix
            </h2>
            <p className="text-gray-400 leading-relaxed">
              {mix.description}
            </p>
          </div>
        )}

        {/* Placeholder tracklist */}
        <div>
          <h2 className="text-white text-lg font-semibold mb-4">
            Tracklist
          </h2>

          <div className="text-gray-500 text-sm">
            Tracklist coming soon
          </div>
        </div>
      </div>
    </div>
  )
}
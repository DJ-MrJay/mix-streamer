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
    return <div className="p-6 text-foreground">Mix not found</div>
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
    <div className="min-h-screen bg-background pb-28 text-foreground">
      {/* HERO */}
      <div className="relative overflow-hidden border-b border-border">
        {/* Background blur */}
        {mix.cover_image_url && (
          <div
            className="absolute inset-0 bg-cover bg-center blur-3xl opacity-30 scale-110"
            style={{ backgroundImage: `url(${mix.cover_image_url})` }}
          />
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-background/15 via-background/75 to-background" />

        <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-8">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-end">
            {/* Cover */}
            {mix.cover_image_url ? (
              <img
                src={mix.cover_image_url}
                alt={mix.title}
                className="aspect-square w-full max-w-xs rounded-2xl border border-border object-cover shadow-2xl md:w-64"
              />
            ) : (
              <div className="flex aspect-square w-full max-w-xs items-center justify-center rounded-2xl border border-border bg-card text-muted-foreground shadow-2xl md:w-64">
                DJ Mix
              </div>
            )}

            {/* Info */}
            <div className="flex-1">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                DJ Mix
              </p>

              <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                {trackInfo.title}
              </h1>

              {trackInfo.artist && (
                <p className="mb-2 text-base text-muted-foreground md:text-lg">{trackInfo.artist}</p>
              )}

              {mix.duration && (
                <div className="mb-4 text-sm text-muted-foreground">{formatDuration(mix.duration)}</div>
              )}

              {/* PLAY BUTTON */}
              <PlayButton mix={mix} />
            </div>
          </div>
        </div>
      </div>

      {/* CONTENT */}
      <div className="mx-auto mt-6 flex max-w-6xl flex-col gap-6 px-4">
        {/* Description */}
        {mix.description && (
          <section className="rounded-3xl border border-border bg-card/80 p-5 shadow-lg backdrop-blur-sm">
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              About this mix
            </h2>
            <p className="leading-relaxed text-muted-foreground">{mix.description}</p>
          </section>
        )}

        {/* Placeholder tracklist */}
        <section className="rounded-3xl border border-border bg-card/80 p-5 shadow-lg backdrop-blur-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">
            Tracklist
          </h2>

          <div className="text-sm text-muted-foreground">Tracklist coming soon</div>
        </section>
      </div>
    </div>
  )
}

import { getSupabase } from "@/lib/supabase";
import { getDisplayTrackInfo } from "@/lib/mix-display";
import { TRACKLISTS } from "@/data/tracklists";
import type { MixRecord } from "@/types/mix";
import PlayButton from "@/components/mix/play-button";
import ShareButton from "@/components/mix/share-button";
import AppImage from "@/components/ui/app-image";
import BackButton from "@/components/navigation/back-button";
import { Download } from "lucide-react";

export default async function MixPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const supabase = getSupabase();

  const { data } = await supabase
    .from("mixes")
    .select("*")
    .eq("slug", slug)
    .single();

  const mix = data as MixRecord | null;

  if (!mix) {
    return <div className="p-6 text-foreground">Mix not found</div>;
  }

  const trackInfo = getDisplayTrackInfo(mix);
  const tracklist = TRACKLISTS[mix.slug ?? slug] ?? [];

  const formatDuration = (seconds?: number) => {
    if (!seconds) return null;

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    if (h > 0) {
      return `${h}:${m.toString().padStart(2, "0")}:${s
        .toString()
        .padStart(2, "0")}`;
    }

    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const metadataPills = [
    mix.year ? `Year: ${mix.year}` : null,
    mix.genre?.length ? `Genre: ${mix.genre.join(", ")}` : null,
    mix.duration ? `Length: ${formatDuration(mix.duration)}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background pb-10 text-foreground">
      <div className="relative overflow-hidden border-b border-border">
        {mix.cover_image_url && (
          <div className="absolute inset-0">
            <AppImage
              src={mix.cover_image_url}
              alt=""
              fill
              sizes="100vw"
              className="scale-110 object-cover opacity-30 blur-3xl"
            />
          </div>
        )}

        <div className="absolute inset-0 bg-gradient-to-b from-background/15 via-background/75 to-background" />

        <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-8">
          <div className="mb-6">
            <BackButton />
          </div>

          <div className="flex flex-col items-start gap-6 md:flex-row md:items-end">
            {mix.cover_image_url ? (
              <AppImage
                src={mix.cover_image_url}
                alt={mix.title}
                width={640}
                height={640}
                preload
                sizes="(max-width: 768px) 100vw, 256px"
                className="aspect-square w-full rounded-lg border border-border object-cover shadow-2xl md:w-64"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-2xl md:w-64">
                Cover Unavailable
              </div>
            )}

            <div className="flex-1">
              <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
                DJ Mr Jay Mixes
              </p>

              <h1 className="mb-2 text-3xl font-bold tracking-tight text-foreground md:text-5xl">
                {trackInfo.title}
              </h1>

              {trackInfo.artist && (
                <p className="mb-2 text-base text-muted-foreground md:text-lg">
                  {trackInfo.artist}
                </p>
              )}

              {metadataPills.length ? (
                <div className="mb-4 flex flex-wrap gap-2 text-sm text-muted-foreground">
                  {metadataPills.map((pill) => (
                    <span
                      key={pill}
                      className="rounded-full border border-border bg-card/80 px-3 py-1 backdrop-blur-sm"
                    >
                      {pill}
                    </span>
                  ))}
                </div>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <PlayButton
                  mix={{
                    id: mix.id,
                    title: trackInfo.title,
                    drive_file_id: mix.drive_file_id,
                    slug: mix.slug,
                    cover_image_url: mix.cover_image_url ?? undefined,
                    artist: trackInfo.artist,
                    album: mix.album ?? null,
                    genre: mix.genre ?? null,
                    year: mix.year ?? null,
                  }}
                />
                <a
                  href={`/api/stream/${mix.id}?download=1`}
                  download
                  aria-label={`Download ${trackInfo.title}`}
                  className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-3 text-sm font-medium text-foreground backdrop-blur-sm transition hover:bg-muted sm:px-6"
                >
                  <Download className="size-5" />
                  <span className="hidden sm:inline">Download</span>
                </a>
                <ShareButton title={trackInfo.title} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto mt-6 flex max-w-6xl flex-col gap-6 px-4">
        {mix.description && (
          <section className="rounded-lg border border-border bg-card/80 p-5 shadow-lg backdrop-blur-sm">
            <h2 className="capitalize mb-2 text-lg font-semibold text-foreground">
              About this mix
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              {mix.description}
            </p>
          </section>
        )}

        <section className="rounded-lg border border-border bg-card/80 p-5 shadow-lg backdrop-blur-sm">
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Tracklist
              </h2>
              <p className="text-sm text-muted-foreground">
                {tracklist.length
                  ? `${tracklist.length} tracks in this mix`
                  : "Tracklist will be added soon"}
              </p>
            </div>
          </div>

          {tracklist.length ? (
            <ol className="columns-1 md:columns-2 gap-10 space-y-2">
              {tracklist.map((track, index) => (
                <li
                  key={`${track}-${index}`}
                  className="break-inside-avoid flex  rounded-md px-2 py-1 text-sm text-muted-foreground transition hover:bg-background/60 hover:text-foreground"
                >
                  <span className="w-7 text-left text-muted-foreground/70">
                    {index + 1}.
                  </span>
                  <span className="min-w-0 flex-1">{track}</span>
                </li>
              ))}
            </ol>
          ) : (
            <div className="rounded-lg border border-dashed border-border bg-background/40 p-4 text-sm text-muted-foreground"></div>
          )}
        </section>
      </div>
    </div>
  );
}

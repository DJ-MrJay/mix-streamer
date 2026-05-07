import type { Metadata } from "next";

import BackButton from "@/components/navigation/back-button";
import PlayButton from "@/components/mix/play-button";
import ShareButton from "@/components/mix/share-button";
import VideoPlayer from "@/components/mix/video-player";
import AppImage from "@/components/ui/app-image";
import { getDisplayTrackInfo } from "@/lib/mix-display";
import { getMixHref } from "@/lib/mix-routes";
import {
  getMixBySlugAndMediaType,
  getSharedMixDescription,
} from "@/lib/mixes";
import { toAbsoluteUrl } from "@/lib/site-url";
import { getTracklistForMix } from "@/lib/tracklists";
import type { MixMediaType } from "@/types/mix";
import { Download } from "lucide-react";

const defaultShareImage = toAbsoluteUrl("/android-chrome-512x512.png");

const getMixPageDescription = (
  title: string,
  description: string | null,
  artist: string | null,
  mediaType: MixMediaType
) =>
  description?.trim() ||
  `${mediaType === "video" ? "Watch" : "Listen to"} ${title}${artist ? ` by ${artist}` : ""} on DJ Mr. Jay Mixtapes.`;

const formatDuration = (seconds?: number | null) => {
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

export async function generateMixDetailMetadata({
  slug,
  mediaType,
}: {
  slug: string;
  mediaType: MixMediaType;
}): Promise<Metadata> {
  const mix = await getMixBySlugAndMediaType(slug, mediaType);

  if (!mix) {
    return {
      title: "Mix not found | DJ Mr. Jay Mixtapes",
      description: "This mix could not be found on DJ Mr. Jay Mixtapes.",
    };
  }

  const trackInfo = getDisplayTrackInfo(mix);
  const title = `${trackInfo.title} | DJ Mr. Jay Mixtapes`;
  const aboutDescription = await getSharedMixDescription(mix);
  const description = getMixPageDescription(
    trackInfo.title,
    aboutDescription,
    trackInfo.artist,
    mediaType
  );
  const pagePath = getMixHref(mix) ?? `/${mediaType}mix/${slug}`;
  const absolutePageUrl = toAbsoluteUrl(pagePath);
  const absoluteImageUrl = mix.cover_image_url
    ? toAbsoluteUrl(mix.cover_image_url)
    : defaultShareImage;

  return {
    title,
    description,
    alternates: {
      canonical: pagePath,
    },
    openGraph: {
      title,
      description,
      type: "website",
      url: absolutePageUrl,
      images: [
        {
          url: absoluteImageUrl,
          alt: trackInfo.title,
        },
      ],
    },
    twitter: {
      card: absoluteImageUrl ? "summary_large_image" : "summary",
      title,
      description,
      images: [absoluteImageUrl],
    },
  };
}

export default async function MixDetailPage({
  slug,
  mediaType,
}: {
  slug: string;
  mediaType: MixMediaType;
}) {
  const mix = await getMixBySlugAndMediaType(slug, mediaType);

  if (!mix) {
    return <div className="p-6 text-foreground">Mix not found</div>;
  }

  const trackInfo = getDisplayTrackInfo(mix);
  const [tracklist, aboutDescription] = await Promise.all([
    getTracklistForMix(mix),
    getSharedMixDescription(mix),
  ]);
  const isVideo = mediaType === "video";

  const metadataPills = [
    isVideo ? "Video" : "Audio",
    mix.year ? `Year: ${mix.year}` : null,
    mix.genre?.length ? `Genre: ${mix.genre.join(", ")}` : null,
    mix.duration ? `Length: ${formatDuration(mix.duration)}` : null,
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="relative overflow-hidden border-b border-border">
        {!isVideo && mix.cover_image_url && (
          <div className="absolute inset-0">
            <AppImage
              src={mix.cover_image_url}
              alt=""
              fill
              sizes="100vw"
              className="scale-110 object-cover opacity-30"
            />
          </div>
        )}

        {!isVideo ? (
          <div className="absolute inset-0 bg-gradient-to-b from-background/50 via-background/85 to-background" />
        ) : null}

        <div className="relative mx-auto max-w-6xl px-4 pt-8 pb-8">
          <div className="mb-6 hidden md:block">
            <BackButton />
          </div>

          <div className="flex flex-col items-start gap-6 md:flex-row md:items-end">
            {isVideo ? (
              <div className="w-full md:w-[34rem]">
                <div className="mb-4 flex justify-start md:hidden">
                  <BackButton />
                </div>
                <VideoPlayer
                  mixId={mix.id}
                  poster={mix.cover_image_url}
                  title={trackInfo.title}
                />
              </div>
            ) : (
              <div className="grid w-full grid-cols-[1fr_auto_1fr] items-start md:block md:w-64">
                <div className="flex justify-start md:hidden">
                  <BackButton />
                </div>

                {mix.cover_image_url ? (
                  <AppImage
                    src={mix.cover_image_url}
                    alt={mix.title}
                    width={640}
                    height={640}
                    preload
                    sizes="(max-width: 768px) 60vw, 256px"
                    className="aspect-square w-[60vw] max-w-[18rem] rounded-lg border border-border object-cover shadow-2xl md:w-64"
                  />
                ) : (
                  <div className="flex aspect-square w-[60vw] max-w-[18rem] items-center justify-center rounded-lg border border-border bg-card text-muted-foreground shadow-2xl md:w-64">
                    Cover Unavailable
                  </div>
                )}

                <div aria-hidden="true" className="md:hidden" />
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
                {isVideo ? null : (
                  <PlayButton
                    mix={{
                      id: mix.id,
                      title: trackInfo.title,
                      drive_file_id: mix.drive_file_id,
                      slug: mix.slug,
                      media_type: mediaType,
                      cover_image_url: mix.cover_image_url ?? undefined,
                      artist: trackInfo.artist,
                      album: mix.album ?? null,
                      genre: mix.genre ?? null,
                      year: mix.year ?? null,
                    }}
                  />
                )}
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
        {aboutDescription && (
          <section className="rounded-lg border border-border bg-card/80 p-5 shadow-lg backdrop-blur-sm">
            <h2 className="mb-2 text-lg font-semibold text-foreground">
              About this mix
            </h2>
            <p className="leading-relaxed text-muted-foreground">
              {aboutDescription}
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
            <ol className="columns-1 gap-10 space-y-2 md:columns-2">
              {tracklist.map((track, index) => (
                <li
                  key={`${track}-${index}`}
                  className="flex break-inside-avoid rounded-md px-2 py-1 text-sm text-muted-foreground transition hover:bg-background/60 hover:text-foreground"
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

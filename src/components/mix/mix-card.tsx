"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Music, Loader2, Video } from "lucide-react";

import { useRouteLoading } from "@/components/navigation/route-loading-provider";
import { usePlayer } from "@/hooks/use-player";
import { getDisplayTrackInfo } from "@/lib/mix-display";
import { getMixHref } from "@/lib/mix-routes";
import type { MixRecord } from "@/types/mix";
import AppImage from "@/components/ui/app-image";

export default function MixCard({
  mix,
  disableHoverRing = false,
  showMediaBadge = false,
  compact = false,
  smallCover = false,
}: {
  mix: MixRecord;
  disableHoverRing?: boolean;
  showMediaBadge?: boolean;
  compact?: boolean;
  smallCover?: boolean;
}) {
  const router = useRouter();
  const { startRouteLoading } = useRouteLoading();

  const {
    currentTrack,
    setTrack,
    play,
    pause,
    isPlaying,
    isLoading,
  } = usePlayer();

  const [imageError, setImageError] = useState(false);

  const isCurrentTrack = currentTrack?.id === mix.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;
  const isCurrentlyLoading = isCurrentTrack && isLoading;
  const trackInfo = getDisplayTrackInfo(mix);
  const mediaType = mix.media_type ?? "audio";
  const isVideo = mediaType === "video";
  const detailHref = getMixHref(mix);
  const playButtonLabel = isVideo
    ? `Watch ${trackInfo.title}`
    : isCurrentlyPlaying
    ? `Pause ${trackInfo.title}`
    : `Play ${trackInfo.title}`;

  const getGradientStyle = (id: string) => {
    const hash = id
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const hue1 = hash % 360;
    const hue2 = (hue1 + 40) % 360;
    return {
      backgroundImage: `linear-gradient(135deg, hsl(${hue1} 70% 44%), hsl(${hue2} 72% 34%))`,
    };
  };

  const handlePlayClick = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();

    if (isVideo) {
      if (detailHref) {
        startRouteLoading();
        router.push(detailHref);
      }

      return;
    }

    if (isCurrentTrack && isPlaying) {
      pause();
    } else if (isCurrentTrack && !isPlaying) {
      await play();
    } else {
      await setTrack(
        {
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
        },
        { autoplay: true },
      );
    }
  };

  const handleCardClick = () => {
    if (!detailHref) {
      return;
    }

    startRouteLoading();
    router.push(detailHref);
  };

  const formatDuration = (seconds?: number | null) => {
    if (!seconds) return null;
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours >= 1) {
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const duration = formatDuration(mix.duration);

  if (compact) {
    return (
      <div
        onClick={handleCardClick}
        className={`group relative flex w-full cursor-pointer items-center gap-4 rounded-sm transition-all duration-300 ${
          disableHoverRing ? "" : "sm:hover:ring-6 sm:hover:ring-muted"
        } ${isCurrentTrack ? "ring-2 ring-primary/45" : ""}`}
      >
        <div
          className={`relative overflow-hidden rounded-sm bg-card text-card-foreground ${
            isCurrentTrack ? "border border-primary/40" : ""
          } flex-shrink-0 ${smallCover ? "w-14 md:w-20" : "w-28 md:w-36"}`}>
            <div className={(isVideo ? "aspect-video" : "aspect-square") + " relative overflow-hidden"}>
            {mix.cover_image_url && !imageError ? (
              <AppImage
                src={mix.cover_image_url}
                alt={mix.title}
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
                className="object-cover"
                onError={() => setImageError(true)}
              />
            ) : (
              <div
                className="flex h-full w-full items-center justify-center"
                style={getGradientStyle(mix.id)}
              >
                {isVideo ? (
                  <Video size={48} className="mb-2 text-white/35" />
                ) : (
                  <Music size={48} className="mb-2 text-white/35" />
                )}
              </div>
            )}

            <button
              aria-label={playButtonLabel}
              onClick={handlePlayClick}
              onPointerDown={(event) => event.stopPropagation()}
              type="button"
              className="absolute inset-0 flex items-center justify-center"
            >
              <div className="rounded-full bg-primary/95 p-2 text-primary-foreground">
                {isCurrentlyLoading ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : isCurrentlyPlaying && !isVideo ? (
                  <Pause size={18} fill="currentColor" />
                ) : (
                  <Play size={18} fill="currentColor" className="ml-0" />
                )}
              </div>
            </button>
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="text-base font-semibold text-foreground">
            {detailHref ? (
              <Link
                href={detailHref}
                onClick={(event) => {
                  event.stopPropagation();
                  startRouteLoading();
                }}
                className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title={trackInfo.title}
              >
                {trackInfo.title}
              </Link>
            ) : (
              <span title={trackInfo.title}>{trackInfo.title}</span>
            )}
          </h3>

          {trackInfo.artist && (
            <p className="truncate text-sm text-muted-foreground">{trackInfo.artist}</p>
          )}
        </div>

        {duration && (
          <div className="ml-2 flex-shrink-0 rounded-md bg-background/90 px-2 py-1 font-mono text-xs text-foreground">
            {duration}
          </div>
        )}
      </div>
    );
  }

  const artworkWrapperClass = `relative shrink-0 overflow-hidden bg-muted ${isVideo ? "aspect-video" : "aspect-square"} ${smallCover ? "w-1/2 mx-auto" : "w-full"}`;

  return (
    <div
      onClick={handleCardClick}
      className={`group relative flex h-full cursor-pointer flex-col rounded-sm transition-all duration-800 ${
        disableHoverRing ? "" : "sm:hover:ring-6 sm:hover:ring-muted"
      } ${isCurrentTrack ? "ring-2 ring-primary/45" : ""}`}
    >
      <div
        className={`flex h-full w-full flex-col overflow-hidden rounded-sm bg-card text-card-foreground ${
          isCurrentTrack ? "border border-primary/40" : ""
        }`}
      >
        {/* Album Art */}
        <div className={artworkWrapperClass}>
          {mix.cover_image_url && !imageError ? (
            <AppImage
              src={mix.cover_image_url}
              alt={mix.title}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover"
              onError={() => setImageError(true)}
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center"
              style={getGradientStyle(mix.id)}
            >
              {isVideo ? (
                <Video size={64} className="mb-2 text-white/35" />
              ) : (
                <Music size={64} className="mb-2 text-white/35" />
              )}
            </div>
          )}

          {/* Hover overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Play button */}
          <button
            aria-label={playButtonLabel}
            onClick={handlePlayClick}
            onPointerDown={(event) => event.stopPropagation()}
            type="button"
            className="absolute inset-0 flex items-center justify-center opacity-100 transition-all duration-300 md:opacity-0 md:group-hover:opacity-100"
          >
            <div className="rounded-full bg-primary/95 p-3 text-primary-foreground shadow-2xl transition-transform md:group-hover:scale-110">
              {isCurrentlyLoading ? (
                <Loader2 size={28} className="animate-spin" />
              ) : isCurrentlyPlaying && !isVideo ? (
                <Pause size={28} fill="currentColor" />
              ) : (
                <Play size={28} fill="currentColor" className="ml-1" />
              )}
            </div>
          </button>

          {showMediaBadge ? (
            <div className="absolute top-2 right-2 rounded-full bg-background/90 px-2 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-foreground backdrop-blur-sm">
              {mediaType}
            </div>
          ) : null}

          {/* Duration */}
          {duration && (
            <div className="absolute right-2 bottom-2 rounded-md bg-background/90 px-2 py-1 font-mono text-xs text-foreground">
              {duration}
            </div>
          )}

          {/* Loading badge */}
          {!isVideo && isCurrentTrack && isCurrentlyLoading && (
            <div className="absolute top-2 left-2 flex items-center gap-2 rounded-full bg-black/80 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
              <span>LOADING</span>
            </div>
          )}

          {/* Playing badge */}
          {!isVideo && isCurrentTrack && isPlaying && !isCurrentlyLoading && (
            <div className="absolute top-2 left-2 flex items-center gap-2 rounded-full bg-green-600 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-white" />
              <span>PLAYING</span>
            </div>
          )}

          {/* Paused badge */}
          {!isVideo && isCurrentTrack && !isPlaying && !isCurrentlyLoading && (
            <div className="absolute top-2 left-2 flex items-center gap-2 rounded-full bg-red-600 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
              <div className="h-2 w-2 rounded-full bg-white animate-pulse" />
              <span>PAUSED</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3 md:p-4">
          <h3 className="mb-1 text-base font-semibold text-foreground">
            {detailHref ? (
              <Link
                href={detailHref}
                onClick={(event) => {
                  event.stopPropagation();
                  startRouteLoading();
                }}
                className="transition-colors hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                title={trackInfo.title}
              >
                {trackInfo.title}
              </Link>
            ) : (
              <span title={trackInfo.title}>{trackInfo.title}</span>
            )}
          </h3>

          {trackInfo.artist && (
            <p className="truncate text-sm text-muted-foreground">
              {trackInfo.artist}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

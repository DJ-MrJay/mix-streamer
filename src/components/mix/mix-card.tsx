"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Music, Headphones, Loader2 } from "lucide-react";

import { usePlayer } from "@/hooks/use-player";
import { getDisplayTrackInfo } from "@/lib/mix-display";
import type { MixRecord } from "@/types/mix";
import AppImage from "@/components/ui/app-image";

export default function MixCard({ mix }: { mix: MixRecord }) {
  const router = useRouter();

  const {
    currentTrack,
    setTrack,
    play,
    pause,
    isPlaying,
    isLoading,
    currentTime,
    duration: playerDuration,
  } = usePlayer();

  const [imageError, setImageError] = useState(false);

  const isCurrentTrack = currentTrack?.id === mix.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;
  const isCurrentlyLoading = isCurrentTrack && isLoading;
  const trackInfo = getDisplayTrackInfo(mix);
  const detailHref = mix.slug ? `/mix/${mix.slug}` : null;
  const playButtonLabel = isCurrentlyPlaying
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
  const progressPercentage = isCurrentTrack
    ? (currentTime / playerDuration) * 100 || 0
    : 0;

  return (
    <div
      onClick={handleCardClick}
      className={`group relative cursor-pointer overflow-hidden rounded-sm bg-card text-card-foreground transition-all duration-800 hover:ring-6 hover:ring-muted  ${
        isCurrentTrack ? "border-primary/30 ring-2 ring-primary/30" : ""
      }`}
    >
      {/* Album Art */}
      <div className="relative aspect-square overflow-hidden bg-muted">
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
            className="flex h-full w-full flex-col items-center justify-center"
            style={getGradientStyle(mix.id)}
          >
            <Music size={64} className="mb-2 text-white/35" />
            <div className="flex h-16 w-16 items-center justify-center rounded-full border border-white/15 bg-black/15 backdrop-blur-sm">
              <Headphones size={32} className="text-white/55" />
            </div>
          </div>
        )}

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

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
            ) : isCurrentlyPlaying ? (
              <Pause size={28} fill="currentColor" />
            ) : (
              <Play size={28} fill="currentColor" className="ml-1" />
            )}
          </div>
        </button>

        {/* Duration */}
        {duration && (
          <div className="absolute right-2 bottom-2 rounded-md bg-background/90 px-2 py-1 font-mono text-xs text-foreground ">
            {duration}
          </div>
        )}

        {/* Loading badge */}
        {isCurrentTrack && isCurrentlyLoading && (
          <div className="absolute top-2 left-2 flex items-center gap-2 rounded-full bg-black/80 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
            <span>LOADING</span>
          </div>
        )}

        {/* Playing badge */}
        {isCurrentTrack && isPlaying && !isCurrentlyLoading && (
          <div className="absolute top-2 left-2 flex items-center gap-2 rounded-full bg-green-600 px-2 py-1 text-xs font-medium text-white backdrop-blur-sm">
            <div className="h-2 w-2 rounded-full bg-white " />
            <span>PLAYING</span>
          </div>
        )}

        {/* Paused badge */}
        {isCurrentTrack && !isPlaying && !isCurrentlyLoading && (
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
              onClick={(event) => event.stopPropagation()}
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

        {/* Progress bar */}
        {isCurrentTrack && (
          <div className="mt-3">
            <div
              aria-hidden="true"
              className="h-1.5 overflow-hidden rounded-full bg-muted"
            >
              <div
                className="h-full rounded-full bg-gradient-to-r from-blue-500 via-sky-400 to-purple-500 transition-all duration-300"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

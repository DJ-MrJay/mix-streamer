"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Play, Pause, Music, Headphones, Loader2 } from "lucide-react";

import { usePlayer } from "@/hooks/use-player";
import { getDisplayTrackInfo } from "@/lib/mix-display";
import type { MixRecord } from "@/types/mix";
import AppImage from "@/components/ui/app-image";

export default function MixCard({ mix }: { mix: MixRecord }) {
  const router = useRouter();

  const { currentTrack, setTrack, play, pause, isPlaying, isLoading } =
    usePlayer();

  const [imageError, setImageError] = useState(false);

  const isCurrentTrack = currentTrack?.id === mix.id;
  const isCurrentlyPlaying = isCurrentTrack && isPlaying;
  const isCurrentlyLoading = isCurrentTrack && isLoading;
  const trackInfo = getDisplayTrackInfo(mix);

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
    if (!mix.slug) {
      return;
    }

    router.push(`/mix/${mix.slug}`);
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

  return (
    <div
      onClick={handleCardClick}
      className={`group relative cursor-pointer overflow-hidden rounded-sm border border-border bg-card text-card-foreground shadow-[0_18px_40px_rgba(0,0,0,0.24)] transition-all duration-300 hover:border-foreground/15 hover:shadow-[0_24px_48px_rgba(0,0,0,0.32)] ${
        isCurrentTrack ? "border-primary/30 ring-1 ring-primary/30" : ""
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
            className="object-cover transition-transform duration-500 group-hover:scale-110"
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
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Play button */}
        <button
          onClick={handlePlayClick}
          type="button"
          className="absolute inset-0 flex items-center justify-center opacity-100 transition-all duration-300 md:opacity-0 md:group-hover:opacity-100"
        >
          <div className="rounded-full bg-primary p-4 text-primary-foreground shadow-2xl transition-transform md:group-hover:scale-110">
            {isCurrentlyLoading ? (
              <Loader2 size={32} className="animate-spin" />
            ) : isCurrentlyPlaying ? (
              <Pause size={32} fill="currentColor" />
            ) : (
              <Play size={32} fill="currentColor" className="ml-1" />
            )}
          </div>
        </button>

        {/* Duration */}
        {duration && (
          <div className="absolute right-2 bottom-2 rounded-md border border-border/60 bg-background/80 px-2 py-1 font-mono text-xs text-foreground backdrop-blur-sm">
            {duration}
          </div>
        )}

        {/* Playing badge */}
        {isCurrentTrack && isPlaying && (
          <div className="absolute top-2 left-2 flex items-center gap-1 rounded-full bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
            <div className="h-2 w-2 rounded-full bg-current animate-pulse" />
            <span>PLAYING</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <h3
          className="mb-1 truncate text-base font-semibold text-foreground"
          title={trackInfo.title}
        >
          {trackInfo.title}
        </h3>

        {trackInfo.artist && (
          <p className="truncate text-sm text-muted-foreground">
            {trackInfo.artist}
          </p>
        )}

        {/* Progress bar */}
        {isCurrentTrack && (
          <div className="mt-3">
            <div className="h-1 overflow-hidden rounded-full bg-muted">
              <div
                className="h-full bg-primary transition-all duration-300"
                style={{
                  width: `${
                    (usePlayer.getState().currentTime /
                      usePlayer.getState().duration) *
                      100 || 0
                  }%`,
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

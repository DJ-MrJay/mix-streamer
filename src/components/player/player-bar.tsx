"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import AppImage from "@/components/ui/app-image";
import { usePlayer } from "@/hooks/use-player";
import { Play, Pause, Loader2, Volume2, VolumeX, X } from "lucide-react";

const shouldIgnorePlayerShortcut = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  if (target.closest("input, textarea, select, button, a, summary")) {
    return true;
  }

  const contentEditableAncestor = target.closest("[contenteditable]");
  return (
    contentEditableAncestor instanceof HTMLElement &&
    contentEditableAncestor.isContentEditable
  );
};

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    toggle,
    seek,
    currentTime,
    duration,
    isLoading,
    error,
  } = usePlayer();

  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isSeeking, setIsSeeking] = useState(false);
  const [bottomOffset, setBottomOffset] = useState(16);
  const progressRef = useRef<HTMLDivElement>(null);

  // Update volume when changed
  useEffect(() => {
    const currentAudio = usePlayer.getState().audio;

    if (currentAudio) {
      currentAudio.volume = isMuted ? 0 : volume;
    }
  }, [currentTrack?.id, volume, isMuted]);

  // Format time (seconds to HH:MM:SS or MM:SS)
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";

    const hours = Math.floor(time / 3600);
    const minutes = Math.floor((time % 3600) / 60);
    const seconds = Math.floor(time % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`;
    }

    return `${minutes}:${seconds.toString().padStart(2, "0")}`;
  };

  const seekToClientX = useCallback(
    (clientX: number) => {
      if (!progressRef.current || !duration) return;

      const rect = progressRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const newTime = percentage * duration;

      seek(newTime);
    },
    [duration, seek],
  );

  const handleProgressPointerDown = (
    event: React.PointerEvent<HTMLDivElement>,
  ) => {
    if (!duration) return;

    event.preventDefault();
    const pointerId = event.pointerId;
    const target = event.currentTarget;

    target.setPointerCapture(pointerId);
    setIsSeeking(true);
    seekToClientX(event.clientX);

    const handlePointerMove = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId !== pointerId) {
        return;
      }

      pointerEvent.preventDefault();
      seekToClientX(pointerEvent.clientX);
    };

    const stopSeeking = (pointerEvent: PointerEvent) => {
      if (pointerEvent.pointerId !== pointerId) {
        return;
      }

      setIsSeeking(false);

      if (target.hasPointerCapture(pointerId)) {
        target.releasePointerCapture(pointerId);
      }

      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", stopSeeking);
      window.removeEventListener("pointercancel", stopSeeking);
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: false,
    });
    window.addEventListener("pointerup", stopSeeking);
    window.addEventListener("pointercancel", stopSeeking);
  };

  // Calculate progress percentage
  const progressPercentage = duration
    ? Math.min(100, Math.max(0, (currentTime / duration) * 100))
    : 0;

  // Toggle mute
  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  // Handle volume change
  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value);
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!currentTrack) return;

      if (
        event.defaultPrevented ||
        event.altKey ||
        event.ctrlKey ||
        event.metaKey ||
        shouldIgnorePlayerShortcut(event.target)
      ) {
        return;
      }

      switch (event.code) {
        case "Space":
          if (event.repeat) {
            return;
          }
          event.preventDefault();
          void toggle();
          break;
        case "ArrowLeft":
          event.preventDefault();
          seek(Math.max(0, currentTime - 5));
          break;
        case "ArrowRight":
          event.preventDefault();
          seek(Math.min(duration, currentTime + 5));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTime, currentTrack, duration, seek, toggle]);

  useEffect(() => {
    if (!currentTrack) {
      return;
    }

    const updateBottomOffset = () => {
      const footer = document.querySelector<HTMLElement>(
        "[data-player-footer]",
      );

      if (!footer) {
        setBottomOffset(16);
        return;
      }

      const footerRect = footer.getBoundingClientRect();
      const footerVisibleHeight =
        footerRect.top < window.innerHeight && footerRect.bottom > 0
          ? Math.max(0, window.innerHeight - Math.max(footerRect.top, 0))
          : 0;

      setBottomOffset(footerVisibleHeight ? 28 + footerVisibleHeight : 16);
    };

    updateBottomOffset();
    window.addEventListener("scroll", updateBottomOffset, { passive: true });
    window.addEventListener("resize", updateBottomOffset);

    return () => {
      window.removeEventListener("scroll", updateBottomOffset);
      window.removeEventListener("resize", updateBottomOffset);
    };
  }, [currentTrack]);

  // If no track is playing, don't render the player bar
  if (!currentTrack) {
    return null;
  }

  const currentMixHref = currentTrack.slug ? `/mix/${currentTrack.slug}` : null;

  return (
    <>
      {/* Main player bar */}
      <div
        className="pointer-events-none fixed inset-x-0 z-40 px-3 transition-[bottom] duration-200 ease-out sm:px-4"
        style={{
          bottom: `calc(${bottomOffset}px + env(safe-area-inset-bottom))`,
        }}
      >
        <div className="pointer-events-auto relative mx-auto max-w-6xl overflow-hidden rounded-2xl  bg-gradient-to-r from-gray-900 to-gray-800 ">
          {/* Progress bar - clickable */}
          <div
            ref={progressRef}
            className="group absolute inset-x-0 top-0 z-10 h-5 cursor-pointer touch-none"
            onPointerDown={handleProgressPointerDown}
            role="slider"
            aria-label="Seek playback"
            aria-valuemin={0}
            aria-valuemax={Math.max(0, Math.round(duration))}
            aria-valuenow={Math.round(currentTime)}
          >
            <div className="absolute inset-x-4 top-3 h-1 bg-white/50">
              <div
                className="h-full rounded-r-full bg-gradient-to-r from-blue-500 via-sky-400 to-purple-500 transition group-hover:from-blue-400 group-hover:via-sky-300 group-hover:to-purple-400"
                style={{ width: `${progressPercentage}%` }}
              />
              <div
                className={`absolute top-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-lg transition ${
                  isSeeking ? "scale-110" : "group-hover:scale-105"
                }`}
                style={{ left: `${progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 px-4 pt-7 pb-2 sm:gap-4 sm:px-5">
            {currentMixHref ? (
              <Link
                href={currentMixHref}
                className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-gradient-to-br from-blue-500 to-purple-500"
                aria-label={`Open ${currentTrack.title}`}
              >
                {currentTrack.cover_image_url ? (
                  <AppImage
                    src={currentTrack.cover_image_url}
                    alt=""
                    fill
                    sizes="48px"
                    className="rounded-sm object-cover"
                  />
                ) : (
                  <span className="text-white text-xs">Audio</span>
                )}
              </Link>
            ) : (
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-gradient-to-br from-blue-500 to-purple-500">
                {currentTrack.cover_image_url ? (
                  <AppImage
                    src={currentTrack.cover_image_url}
                    alt=""
                    fill
                    sizes="48px"
                    className="rounded-sm object-cover"
                  />
                ) : (
                  <span className="text-white text-xs">Audio</span>
                )}
              </div>
            )}

            <div className="min-w-0 flex-1">
              {currentMixHref ? (
                <Link href={currentMixHref} className="block min-w-0">
                  <h4 className="truncate text-sm font-medium text-white transition hover:text-white/85">
                    {currentTrack.title}
                  </h4>
                </Link>
              ) : (
                <h4 className="truncate text-sm font-medium text-white">
                  {currentTrack.title}
                </h4>
              )}
              <div className="flex items-center gap-2">
                {currentTrack.artist ? (
                  currentMixHref ? (
                    <Link
                      href={currentMixHref}
                      className="min-w-0 truncate text-xs text-gray-400 transition hover:text-gray-200"
                    >
                      {currentTrack.artist}
                    </Link>
                  ) : (
                    <p className="truncate text-xs text-gray-400">
                      {currentTrack.artist}
                    </p>
                  )
                ) : null}
                <p className="text-xs text-white/65 sm:hidden">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </p>
              </div>
            </div>

            <div className="hidden text-sm text-white/80 sm:block">
              {formatTime(currentTime)} / {formatTime(duration)}
            </div>

            <button
              onClick={() => void toggle()}
              disabled={isLoading}
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-black transition hover:scale-105 disabled:opacity-50"
              aria-label={isPlaying ? "Pause playback" : "Play mix"}
            >
              {isLoading ? (
                <Loader2 size={20} className="animate-spin" />
              ) : isPlaying ? (
                <Pause size={20} fill="black" />
              ) : (
                <Play size={20} fill="black" className="ml-0.5" />
              )}
            </button>

            <div className="hidden items-center gap-2 lg:flex">
              <button
                onClick={toggleMute}
                className="p-1 text-gray-400 transition hover:text-white"
                aria-label={isMuted || volume === 0 ? "Unmute" : "Mute"}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX size={18} />
                ) : (
                  <Volume2 size={18} />
                )}
              </button>

              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="h-1 w-24 cursor-pointer appearance-none rounded-lg bg-gray-600"
                style={{
                  background: `linear-gradient(to right, white 0%, white ${(isMuted ? 0 : volume) * 100}%, #4a5568 ${(isMuted ? 0 : volume) * 100}%, #4a5568 100%)`,
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Error notification */}
      {error && (
        <div
          className="fixed right-4 left-4 z-50 animate-slide-up rounded-lg bg-red-600 px-4 py-3 text-white shadow-lg"
          style={{
            bottom: `calc(${bottomOffset + 96}px + env(safe-area-inset-bottom))`,
          }}
        >
          <div className="flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button
              onClick={() => usePlayer.setState({ error: null })}
              className="ml-4 text-white hover:text-gray-200"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Add CSS for animations */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }

        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }

        input[type="range"] {
          -webkit-appearance: none;
        }

        input[type="range"]::-webkit-slider-thumb {
          -webkit-appearance: none;
          width: 12px;
          height: 12px;
          border-radius: 50%;
          background: white;
          cursor: pointer;
        }

        input[type="range"]::-webkit-slider-thumb:hover {
          transform: scale(1.2);
        }
      `}</style>
    </>
  );
}

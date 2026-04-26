"use client";

import { useEffect, useRef, useState } from "react";
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

  // Handle progress bar click
  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = x / rect.width;
    const newTime = percentage * duration;

    seek(newTime);
  };

  // Handle touch for mobile
  const handleTouchProgress = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!progressRef.current || !duration) return;

    const rect = progressRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = touch.clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const newTime = percentage * duration;

    seek(newTime);
  };

  // Calculate progress percentage
  const progressPercentage = (currentTime / duration) * 100 || 0;

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

  // If no track is playing, don't render the player bar
  if (!currentTrack) {
    return null;
  }

  return (
    <>
      {/* Main player bar */}
      <div className="fixed right-0 bottom-0 left-0 z-40 bg-gradient-to-r from-gray-900 to-gray-800 shadow-lg">
        <div className="relative mx-auto max-w-6xl px-4 py-3">
          {/* Progress bar - clickable */}
          <div
            ref={progressRef}
            className="absolute top-0 right-0 left-0 h-1 cursor-pointer bg-gray-700/80 group"
            onClick={handleProgressClick}
            onTouchStart={handleTouchProgress}
          >
            <div
              className="relative h-full bg-gradient-to-r from-blue-500 to-purple-500 transition group-hover:from-blue-400 group-hover:to-purple-400"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute top-1/2 right-0 h-3 w-3 -translate-y-1/2 rounded-full bg-white opacity-0 transition group-hover:opacity-100" />
            </div>
          </div>

          <div className="flex items-center gap-3 sm:gap-4">
            <div className="relative flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-sm bg-gradient-to-br from-blue-500 to-purple-500">
              {currentTrack.cover_image_url ? (
                <AppImage
                  src={currentTrack.cover_image_url}
                  alt={currentTrack.title}
                  fill
                  sizes="48px"
                  className="rounded-sm object-cover"
                />
              ) : (
                <span className="text-white text-xs">Audio</span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="truncate text-sm font-medium text-white">
                {currentTrack.title}
              </h4>
              <div className="flex items-center gap-2">
                {currentTrack.artist ? (
                  <p className="truncate text-xs text-gray-400">
                    {currentTrack.artist}
                  </p>
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
        <div className="fixed bottom-24 left-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 animate-slide-up">
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

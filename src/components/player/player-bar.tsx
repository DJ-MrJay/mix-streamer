"use client";

import { useEffect, useState, useRef } from "react";
import { usePlayer } from "@/hooks/use-player";
import {
  Play,
  Pause,
  Loader2,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  X,
} from "lucide-react";

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    toggle,
    play,
    pause,
    seek,
    currentTime,
    duration,
    isLoading,
    error,
  } = usePlayer();

  const [userInteracted, setUserInteracted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [showMobileProgress, setShowMobileProgress] = useState(false);
  const progressRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle mobile audio unlock
  useEffect(() => {
    const unlockAudio = async () => {
      // Create a silent audio context to unlock audio on mobile
      const AudioContext =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContext) {
        const context = new AudioContext();
        if (context.state === "suspended") {
          await context.resume();
        }
      }
    };

    // Unlock on any user interaction
    const handleUserInteraction = () => {
      if (!userInteracted) {
        setUserInteracted(true);
        unlockAudio();
      }
    };

    window.addEventListener("click", handleUserInteraction);
    window.addEventListener("touchstart", handleUserInteraction);
    window.addEventListener("touchend", handleUserInteraction);

    return () => {
      window.removeEventListener("click", handleUserInteraction);
      window.removeEventListener("touchstart", handleUserInteraction);
      window.removeEventListener("touchend", handleUserInteraction);
    };
  }, [userInteracted]);

  // Update volume when changed
  useEffect(() => {
    const { audio } = usePlayer.getState();
    if (audio) {
      audio.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  // Format time (seconds to MM:SS)
  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
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
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!currentTrack) return;

      switch (e.code) {
        case "Space":
          e.preventDefault();
          toggle();
          break;
        case "ArrowLeft":
          seek(Math.max(0, currentTime - 5));
          break;
        case "ArrowRight":
          seek(Math.min(duration, currentTime + 5));
          break;
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [currentTrack, currentTime, duration, seek, toggle]);

  // If no track is playing, don't render the player bar
  if (!currentTrack) {
    return null;
  }

  // Check if mobile device
  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  return (
    <>
      {/* Mobile full-screen progress modal */}
      {isMobile && showMobileProgress && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex flex-col items-center justify-center"
          onClick={() => setShowMobileProgress(false)}
        >
          <button
            className="absolute top-4 right-4 text-white p-2"
            onClick={() => setShowMobileProgress(false)}
          >
            <X size={24} />
          </button>

          <div className="w-full max-w-md px-6">
            <div className="text-center mb-8">
              <h3 className="text-white text-xl font-semibold mb-2">
                {currentTrack.title}
              </h3>
              {currentTrack.artist && (
                <p className="text-gray-400">{currentTrack.artist}</p>
              )}
            </div>

            <div className="mb-8">
              <div className="text-white text-center mb-2">
                {formatTime(currentTime)} / {formatTime(duration)}
              </div>
              <input
                type="range"
                min="0"
                max={duration || 100}
                value={currentTime}
                onChange={(e) => seek(parseFloat(e.target.value))}
                className="w-full h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, white 0%, white ${progressPercentage}%, #4a5568 ${progressPercentage}%, #4a5568 100%)`,
                }}
              />
            </div>

            <div className="flex items-center justify-center gap-8">
              <button
                onClick={() => seek(Math.max(0, currentTime - 10))}
                className="text-white p-3 hover:bg-white/10 rounded-full transition"
              >
                <SkipBack size={24} />
              </button>

              <button
                onClick={toggle}
                disabled={isLoading}
                className="bg-white text-black p-5 rounded-full hover:scale-105 transition disabled:opacity-50"
              >
                {isLoading ? (
                  <Loader2 size={32} className="animate-spin" />
                ) : isPlaying ? (
                  <Pause size={32} fill="black" />
                ) : (
                  <Play size={32} fill="black" className="ml-1" />
                )}
              </button>

              <button
                onClick={() => seek(Math.min(duration, currentTime + 10))}
                className="text-white p-3 hover:bg-white/10 rounded-full transition"
              >
                <SkipForward size={24} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main player bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-r from-gray-900 to-gray-800 border-t border-gray-700 shadow-lg z-40">
        <div className="max-w-7xl mx-auto px-4 py-3">
          {/* Progress bar - clickable */}
          <div
            ref={progressRef}
            className="absolute top-0 left-0 right-0 h-1 bg-gray-700 cursor-pointer group"
            onClick={handleProgressClick}
            onTouchStart={handleTouchProgress}
          >
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 relative group-hover:from-blue-400 group-hover:to-purple-400 transition"
              style={{ width: `${progressPercentage}%` }}
            >
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-white rounded-full opacity-0 group-hover:opacity-100 transition" />
            </div>
          </div>

          <div className="flex items-center justify-between gap-4">
            {/* Track info - clickable on mobile to show full progress */}
            <div
              className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
              onClick={() => isMobile && setShowMobileProgress(true)}
            >
              {/* Album art placeholder */}
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-500 rounded-lg flex items-center justify-center flex-shrink-0">
                {currentTrack.cover_image_url ? (
                  <img
                    src={currentTrack.cover_image_url}
                    alt={currentTrack.title}
                    className="w-full h-full object-cover rounded-lg"
                  />
                ) : (
                  <span className="text-white text-xs">Audio</span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <h4 className="text-white text-sm font-medium truncate">
                  {currentTrack.title}
                </h4>
                {currentTrack.artist && (
                  <p className="text-gray-400 text-xs truncate">
                    {currentTrack.artist}
                  </p>
                )}
              </div>
            </div>

            {/* Mobile: Show time and play button compact */}
            {isMobile ? (
              <div className="flex items-center gap-3">
                <div className="text-white text-xs">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>
                <button
                  onClick={toggle}
                  disabled={isLoading}
                  className="bg-white text-black p-2 rounded-full w-10 h-10 flex items-center justify-center disabled:opacity-50"
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : isPlaying ? (
                    <Pause size={20} fill="black" />
                  ) : (
                    <Play size={20} fill="black" className="ml-0.5" />
                  )}
                </button>
              </div>
            ) : (
              /* Desktop layout */
              <>
                {/* Playback controls */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => seek(Math.max(0, currentTime - 10))}
                    className="text-gray-400 hover:text-white transition p-1"
                    title="Back 10 seconds"
                  >
                    <SkipBack size={20} />
                  </button>

                  <button
                    onClick={toggle}
                    disabled={isLoading}
                    className="bg-white text-black p-2 rounded-full w-10 h-10 flex items-center justify-center hover:scale-105 transition disabled:opacity-50"
                  >
                    {isLoading ? (
                      <Loader2 size={20} className="animate-spin" />
                    ) : isPlaying ? (
                      <Pause size={20} fill="black" />
                    ) : (
                      <Play size={20} fill="black" className="ml-0.5" />
                    )}
                  </button>

                  <button
                    onClick={() => seek(Math.min(duration, currentTime + 10))}
                    className="text-gray-400 hover:text-white transition p-1"
                    title="Forward 10 seconds"
                  >
                    <SkipForward size={20} />
                  </button>
                </div>

                {/* Time display */}
                <div className="text-white text-sm">
                  {formatTime(currentTime)} / {formatTime(duration)}
                </div>

                {/* Volume control */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={toggleMute}
                    className="text-gray-400 hover:text-white transition p-1"
                  >
                    {isMuted || volume === 0 ? (
                      <VolumeX size={20} />
                    ) : (
                      <Volume2 size={20} />
                    )}
                  </button>

                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={handleVolumeChange}
                    className="w-24 h-1 bg-gray-600 rounded-lg appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, white 0%, white ${(isMuted ? 0 : volume) * 100}%, #4a5568 ${(isMuted ? 0 : volume) * 100}%, #4a5568 100%)`,
                    }}
                  />
                </div>
              </>
            )}
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

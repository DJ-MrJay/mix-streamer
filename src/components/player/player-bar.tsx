"use client";

import { usePlayer } from "@/hooks/use-player";

function formatTime(time: number) {
  if (!time || isNaN(time)) return "00:00:00";

  const hours = Math.floor(time / 3600);
  const minutes = Math.floor((time % 3600) / 60);
  const seconds = Math.floor(time % 60);

  const mm = minutes.toString().padStart(2, "0");
  const ss = seconds.toString().padStart(2, "0");

  if (hours > 0) {
    const hh = hours.toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }

  return `00:${mm}:${ss}`;
}

export default function PlayerBar() {
  const { currentTrack, isPlaying, toggle, currentTime, duration, seek } =
    usePlayer();

  if (!currentTrack) return null;

  const handleSeek = (value: string) => {
    seek(Number(value));
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 border-t bg-white/95 backdrop-blur p-3">
      {/* Track info */}
      <div className="flex items-center justify-between mb-2">
        <div className="min-w-0">
          <p className="text-sm font-medium truncate">{currentTrack.title}</p>
        </div>

        <button
          onClick={toggle}
          className="text-sm px-3 py-1 border rounded-md"
        >
          {isPlaying ? "Pause" : "Play"}
        </button>
      </div>

      {/* Progress bar */}
      <input
        type="range"
        min={0}
        max={duration || 0}
        value={currentTime || 0}
        onChange={(e) => handleSeek(e.target.value)}
        className="w-full"
      />

      {/* Time display */}
      <div className="flex justify-between text-xs mt-1 text-gray-600">
        <span>{formatTime(currentTime)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  );
}

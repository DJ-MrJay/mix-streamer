"use client";

import Link from "next/link";
import { Headphones, SquarePlay } from "lucide-react";

import { useRouteLoading } from "@/components/navigation/route-loading-provider";
import { cn } from "@/lib/utils";
import type { MixMediaType } from "@/types/mix";

const versionOptions = [
  {
    mediaType: "audio",
    label: "Audio",
    icon: Headphones,
    loadingDescription: "Opening audio mix...",
  },
  {
    mediaType: "video",
    label: "Video",
    icon: SquarePlay,
    loadingDescription: "Opening video mix...",
  },
] as const satisfies Array<{
  mediaType: MixMediaType;
  label: string;
  icon: typeof Headphones;
  loadingDescription: string;
}>;

export default function MixVersionToggle({
  activeMediaType,
  audioHref,
  videoHref,
}: {
  activeMediaType: MixMediaType;
  audioHref: string | null;
  videoHref: string | null;
}) {
  const { startRouteLoading } = useRouteLoading();

  if (!audioHref || !videoHref) {
    return null;
  }

  const hrefByMediaType: Record<MixMediaType, string> = {
    audio: audioHref,
    video: videoHref,
  };

  return (
    <div
      aria-label="Available mix versions"
      className="inline-flex items-center gap-1 rounded-full border border-border/70 bg-card/85 p-1 shadow-[0_14px_32px_rgba(0,0,0,0.22)] backdrop-blur-sm"
    >
      {versionOptions.map(({ mediaType, label, icon: Icon, loadingDescription }) => {
        const isActive = activeMediaType === mediaType;
        const sharedClassName =
          "inline-flex size-10 items-center justify-center rounded-full transition-colors";

        if (isActive) {
          return (
            <span
              key={mediaType}
              aria-current="page"
              aria-label={label}
              className={cn(
                sharedClassName,
                "pointer-events-none bg-background text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"
              )}
            >
              <Icon className="size-[18px]" />
            </span>
          );
        }

        return (
          <Link
            key={mediaType}
            href={hrefByMediaType[mediaType]}
            aria-label={label}
            onClick={() => startRouteLoading(loadingDescription)}
            className={cn(
              sharedClassName,
              "text-muted-foreground hover:bg-background/60 hover:text-foreground"
            )}
          >
            <Icon className="size-[18px]" />
          </Link>
        );
      })}
    </div>
  );
}

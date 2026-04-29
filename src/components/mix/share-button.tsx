"use client";

import { useEffect, useRef, useState } from "react";
import { Loader2, Share2 } from "lucide-react";

import { cn } from "@/lib/utils";

type ShareButtonProps = {
  title: string;
};

type ShareFeedback =
  | {
      kind: "success" | "error";
      message: string;
    }
  | null;

export default function ShareButton({ title }: ShareButtonProps) {
  const timeoutRef = useRef<number | null>(null);
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<ShareFeedback>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const showFeedback = (kind: "success" | "error", message: string) => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
    }

    setFeedback({ kind, message });
    timeoutRef.current = window.setTimeout(() => {
      setFeedback(null);
      timeoutRef.current = null;
    }, 2500);
  };

  const copyLink = async (shareUrl: string) => {
    if (typeof navigator.clipboard?.writeText !== "function") {
      showFeedback("error", "Couldn't copy the link right now.");
      return;
    }

    try {
      await navigator.clipboard.writeText(shareUrl);
      showFeedback("success", "Link copied");
    } catch {
      showFeedback("error", "Couldn't copy the link. Please try again.");
    }
  };

  const handleShare = async () => {
    const shareUrl = window.location.href;

    setIsPending(true);

    try {
      if (typeof navigator.share === "function") {
        try {
          await navigator.share({
            title,
            text: `Listen to ${title} by DJ Mr Jay`,
            url: shareUrl,
          });
          return;
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
        }
      }

      await copyLink(shareUrl);
    } finally {
      setIsPending(false);
    }
  };

  return (
    <div className="relative">
      {feedback ? (
        <p
          aria-live="polite"
          role={feedback.kind === "error" ? "alert" : "status"}
          className={cn(
            "pointer-events-none absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-full border border-border bg-background/95 px-3 py-1 text-xs shadow-lg backdrop-blur-sm",
            feedback.kind === "error"
              ? "text-destructive"
              : "text-muted-foreground"
          )}
        >
          {feedback.message}
        </p>
      ) : null}

      <button
        type="button"
        onClick={handleShare}
        disabled={isPending}
        aria-label={`Share ${title}`}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-card/80 px-3 py-3 text-sm font-medium text-foreground backdrop-blur-sm transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-70 sm:px-6"
      >
        {isPending ? (
          <Loader2 className="size-5 animate-spin" />
        ) : (
          <Share2 className="size-5" />
        )}
        <span className="hidden sm:inline">
          {isPending ? "Sharing..." : "Share"}
        </span>
      </button>
    </div>
  );
}

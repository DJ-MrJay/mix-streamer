"use client";

import { Check, ArrowUpDown } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import MixCard from "@/components/mix/mix-card";
import MixCardPlaceholder from "@/components/mix/mix-card-placeholder";
import BackButton from "@/components/navigation/back-button";
import MixViewToggle from "@/components/mix/mix-view-toggle";
import { sortMixesForArchive, type MixArchiveSortKey } from "@/lib/mix-sort";
import type { MixMediaType, MixRecord } from "@/types/mix";

type PlaceholderRule = {
  columns: number;
  className: string;
};

const defaultPlaceholderRules: PlaceholderRule[] = [
  { columns: 2, className: "block sm:hidden" },
  { columns: 3, className: "hidden sm:block xl:hidden" },
  { columns: 4, className: "hidden xl:block" },
];

const videoPlaceholderRules: PlaceholderRule[] = [
  { columns: 2, className: "hidden md:block xl:hidden" },
  { columns: 4, className: "hidden xl:block" },
];

const getPlaceholderCount = (itemCount: number, columns: number) =>
  (columns - (itemCount % columns)) % columns;

const sortOptions: Array<{ key: MixArchiveSortKey; label: string }> = [
  { key: "date", label: "Date" },
  { key: "name-asc", label: "Name A-Z" },
  { key: "name-desc", label: "Name Z-A" },
  { key: "genre", label: "Genre" },
];

export default function MixCollectionPage({
  title,
  description,
  mixes,
  mediaType = "audio",
  gridClassName = "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4",
}: {
  title: string;
  description: string;
  mixes: MixRecord[];
  mediaType?: MixMediaType;
  gridClassName?: string;
}) {
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const [sortKey, setSortKey] = useState<MixArchiveSortKey>("date");
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const [view, setView] = useState<"grid" | "list">("grid");
  const placeholderRules =
    mediaType === "video" ? videoPlaceholderRules : defaultPlaceholderRules;
  const sortedMixes = sortMixesForArchive(mixes, sortKey);
  const placeholders = placeholderRules.flatMap((rule) =>
    Array.from(
      { length: getPlaceholderCount(sortedMixes.length, rule.columns) },
      (_, index) => ({
        key: `${mediaType}-placeholder-${rule.columns}-${index}`,
        className: rule.className,
      }),
    ),
  );

  useEffect(() => {
    if (!isSortMenuOpen) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!sortMenuRef.current?.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsSortMenuOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isSortMenuOpen]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(`mix-view:${mediaType}`);
      if (saved === "grid" || saved === "list") {
        setView(saved as "grid" | "list");
      }
    } catch {}
  }, [mediaType]);

  const handleViewChange = (next: "grid" | "list") => {
    setView(next);
    try {
      localStorage.setItem(`mix-view:${mediaType}`, next);
    } catch {}
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <div className="mb-0">
        <BackButton />
      </div>

      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1 space-y-2">
          <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
            {title}
          </h1>
          <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
            {description}
          </p>
        </div>

        <div className="relative shrink-0 flex items-center gap-2">
          <MixViewToggle view={view} onChange={handleViewChange} />

          <div ref={sortMenuRef} className="relative">
            <button
              type="button"
              aria-haspopup="menu"
              aria-expanded={isSortMenuOpen}
              aria-label="View sort options"
              className="rounded-full bg-muted/50 p-2 transition-colors hover:bg-muted"
              onClick={() => setIsSortMenuOpen((currentState) => !currentState)}
            >
              <ArrowUpDown className="size-6 text-foreground" />
            </button>

            {isSortMenuOpen ? (
              <div
                role="menu"
                aria-label="Sort mixes"
                className="absolute top-full right-0 z-20 mt-2 w-[min(16rem,calc(100vw-2rem))] overflow-hidden rounded-sm border border-border bg-popover text-popover-foreground shadow-2xl"
              >
                <div className="border-b border-border px-4 py-3">
                  <p className="text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
                    Sort by
                  </p>
                </div>

                <div className="py-1">
                  {sortOptions.map((option) => (
                    <button
                      key={option.key}
                      type="button"
                      role="menuitemradio"
                      aria-checked={sortKey === option.key}
                      className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition hover:bg-muted ${
                        sortKey === option.key ? "bg-muted/60" : ""
                      }`}
                      onClick={() => {
                        setSortKey(option.key);
                        setIsSortMenuOpen(false);
                      }}
                    >
                      <span className="flex w-4 justify-center text-foreground">
                        {sortKey === option.key ? (
                          <Check className="size-4" />
                        ) : null}
                      </span>
                      <span>{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      {sortedMixes.length ? (
        view === "grid" ? (
          <div className={`grid gap-4 ${gridClassName}`}>
              {sortedMixes.map((mix) => (
                 <MixCard key={mix.id} mix={mix} />
              ))}

            {placeholders.map((placeholder) => (
              <MixCardPlaceholder
                key={placeholder.key}
                mediaType={mediaType}
                className={placeholder.className}
              />
            ))}
          </div>
        ) : (
          <div className="flex w-full flex-col gap-4">
            {sortedMixes.map((mix) => (
              <MixCard key={mix.id} mix={mix} compact smallCover={mediaType === "audio"} />
            ))}
          </div>
        )
      ) : (
        <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-border bg-card/60 px-6 text-center text-sm text-muted-foreground">
          No mixes found here yet.
        </div>
      )}
    </div>
  );
}

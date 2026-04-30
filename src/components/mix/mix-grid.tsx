"use client";

import { SearchX } from "lucide-react";
import { useDeferredValue } from "react";

import MixCard from "@/components/mix/mix-card";
import MixCardPlaceholder from "@/components/mix/mix-card-placeholder";
import { useTopBarSearch } from "@/components/navigation/top-bar-provider";
import { TRACKLISTS } from "@/data/tracklists";
import { getHomeMixSections } from "@/lib/home-sections";
import { getDisplayTrackInfo } from "@/lib/mix-display";
import type { MixRecord } from "@/types/mix";

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const normalizeSearchText = (value: string) =>
  collapseWhitespace(value).toLowerCase();

const getPlaceholderCount = (itemCount: number, columns: number) =>
  (columns - (itemCount % columns)) % columns;

const getSearchableText = (mix: MixRecord) => {
  const trackInfo = getDisplayTrackInfo(mix);
  const tracklistTerms = mix.slug ? TRACKLISTS[mix.slug]?.join(" ") : undefined;

  return [
    mix.title,
    trackInfo.title,
    mix.artist,
    trackInfo.artist,
    mix.album,
    mix.genre?.join(" "),
    mix.description,
    tracklistTerms,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .toLowerCase();
};

export default function MixGrid({ mixes }: { mixes: MixRecord[] }) {
  const { searchValue, isSearchActive } = useTopBarSearch();
  const deferredSearchValue = useDeferredValue(searchValue);
  const normalizedQuery = normalizeSearchText(deferredSearchValue);
  const isSearchResultsView = Boolean(normalizedQuery);
  const isSearchView = isSearchActive || isSearchResultsView;

  const filteredMixes = normalizedQuery
    ? mixes.filter((mix) => getSearchableText(mix).includes(normalizedQuery))
    : mixes;
  const resultCountLabel = `${filteredMixes.length} mix${
    filteredMixes.length === 1 ? "" : "es"
  } found that match`;
  const homeSections = getHomeMixSections(mixes);

  const renderMixGrid = (items: MixRecord[]) => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {items.map((mix) => (
        <MixCard key={mix.id} mix={mix} />
      ))}
    </div>
  );

  const renderBalancedHomeGrid = (
    items: MixRecord[],
    options?: {
      className?: string;
      disableHoverRing?: boolean;
    },
  ) => {
    const tabletPlaceholderCount = getPlaceholderCount(items.length, 3);
    const desktopPlaceholderCount = getPlaceholderCount(items.length, 4);

    return (
      <div
        className={
          options?.className ??
          "grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4"
        }
      >
        {items.map((mix) => (
          <MixCard
            key={mix.id}
            mix={mix}
            disableHoverRing={options?.disableHoverRing}
          />
        ))}

        {Array.from({ length: tabletPlaceholderCount }, (_, index) => (
          <MixCardPlaceholder
            key={`tablet-placeholder-${items.length}-${index}`}
            className="hidden sm:block xl:hidden"
          />
        ))}

        {Array.from({ length: desktopPlaceholderCount }, (_, index) => (
          <MixCardPlaceholder
            key={`desktop-placeholder-${items.length}-${index}`}
            className="hidden xl:block"
          />
        ))}
      </div>
    );
  };

  const renderSectionMixes = (
    items: MixRecord[],
    mobileLayout: "grid" | "carousel" = "grid",
  ) => {
    const disableHoverRing = mobileLayout === "carousel";

    if (mobileLayout !== "carousel") {
      return renderBalancedHomeGrid(items);
    }

    return (
      <>
        <div className="mx-[-1rem] flex gap-4 overflow-x-auto px-4 [scrollbar-width:none] [-ms-overflow-style:none] sm:hidden [&::-webkit-scrollbar]:hidden">
          {items.map((mix) => (
            <div
              key={mix.id}
              className="w-[70vw] max-w-[18rem] shrink-0 snap-start"
            >
              <MixCard mix={mix} disableHoverRing={disableHoverRing} />
            </div>
          ))}
        </div>
        {renderBalancedHomeGrid(items, {
          className: "hidden sm:grid sm:grid-cols-3 sm:gap-4 xl:grid-cols-4",
        })}
      </>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      {isSearchResultsView ? (
        <p className="text-sm font-medium text-muted-foreground">
          {resultCountLabel}
        </p>
      ) : null}

      {filteredMixes.length ? isSearchView ? (
        renderMixGrid(filteredMixes)
      ) : (
        <div className="space-y-10">
          {homeSections.map((section) => (
            <section
              key={section.id}
              aria-labelledby={section.id}
              className="space-y-4"
            >
              <h2
                id={section.id}
                className="text-2xl font-semibold tracking-tight text-foreground"
              >
                {section.title}
              </h2>

              {renderSectionMixes(section.mixes, section.mobileLayout)}
            </section>
          ))}
        </div>
      ) : (
        <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl bg-card/80 px-6 text-center shadow-[0_24px_48px_rgba(0,0,0,0.18)]">
          <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
            <SearchX className="size-6" />
          </div>
          <h2 className="text-lg font-semibold text-foreground">
            No mixes found
          </h2>
          <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Try a different title, artist, track name, genre, or keyword from the mix description.
          </p>
        </div>
      )}
    </div>
  );
}

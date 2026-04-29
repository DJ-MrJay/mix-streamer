"use client";

import { SearchX } from "lucide-react";
import { useDeferredValue } from "react";

import MixCard from "@/components/mix/mix-card";
import { useTopBarSearch } from "@/components/navigation/top-bar-provider";
import { TRACKLISTS } from "@/data/tracklists";
import { getHomeMixSections } from "@/lib/home-sections";
import { getDisplayTrackInfo } from "@/lib/mix-display";
import type { MixRecord } from "@/types/mix";

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const normalizeSearchText = (value: string) =>
  collapseWhitespace(value).toLowerCase();

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

              {renderMixGrid(section.mixes)}
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

"use client";

import Link from "next/link";
import { ArrowRight, Music2, SearchX, Video } from "lucide-react";
import { useDeferredValue } from "react";

import MixCard from "@/components/mix/mix-card";
import MixCardPlaceholder from "@/components/mix/mix-card-placeholder";
import { useTopBarSearch } from "@/components/navigation/top-bar-provider";
import { TextGenerateEffect } from "@/components/ui/text-generate-effect";
import { getHomeMixSections } from "@/lib/home-sections";
import { getDisplayTrackInfo } from "@/lib/mix-display";
import { getMixListHref } from "@/lib/mix-routes";
import type { MixRecord, TracklistsBySlug } from "@/types/mix";

const collapseWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const normalizeSearchText = (value: string) =>
  collapseWhitespace(value).toLowerCase();

const getPlaceholderCount = (itemCount: number, columns: number) =>
  (columns - (itemCount % columns)) % columns;

const getSearchableText = (
  mix: MixRecord,
  tracklistsBySlug: TracklistsBySlug,
) => {
  const trackInfo = getDisplayTrackInfo(mix);
  const tracklistTerms = mix.slug
    ? tracklistsBySlug[mix.slug]?.join(" ")
    : undefined;

  return [
    mix.title,
    trackInfo.title,
    mix.artist,
    trackInfo.artist,
    mix.album,
    mix.media_type ?? "audio",
    mix.genre?.join(" "),
    mix.description,
    tracklistTerms,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .toLowerCase();
};

const HomeHero = () => (
  <section className="relative min-h-[calc(100dvh-68px)] overflow-hidden bg-background bg-[image:url('/djmrjay-hero.jpg')] bg-cover bg-fixed bg-top sm:min-h-[calc(100dvh-80px)]">
    <div className="absolute inset-0 bg-gradient-to-t from-background via-background/75 to-transparent" />
    <div className="relative mx-auto flex min-h-[calc(100dvh-68px)] max-w-6xl items-end px-4 pt-8 pb-10 sm:min-h-[calc(100dvh-80px)] md:pb-12">
      <div>
        <p className="mb-2 text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
          The Incredible
        </p>
        <h1 className="sr-only">DJ Mr. Jay Mixtapes</h1>
        <TextGenerateEffect
          aria-hidden="true"
          className="mb-3 max-w-2xl text-3xl font-black tracking-tight text-foreground md:text-5xl"
          words="DJ Mr. Jay Mixtapes"
        />
        <p className="max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
          Curated mixes for the drive, the dance floor, and every moment that
          calls for the perfect next track.
        </p>
      </div>
    </div>
  </section>
);

const browseLinks = [
  {
    href: getMixListHref("audio"),
    title: "Browse all audio mixes",
    icon: Music2,
  },
  {
    href: getMixListHref("video"),
    title: "Browse all video mixes",
    icon: Video,
  },
] as const;

export default function MixGrid({ mixes }: { mixes: MixRecord[] }) {
  const { searchValue, isSearchActive, tracklistsBySlug } = useTopBarSearch();
  const deferredSearchValue = useDeferredValue(searchValue);
  const normalizedQuery = normalizeSearchText(deferredSearchValue);
  const isSearchResultsView = Boolean(normalizedQuery);
  const isSearchView = isSearchActive || isSearchResultsView;

  const filteredMixes = normalizedQuery
    ? mixes.filter((mix) =>
        getSearchableText(mix, tracklistsBySlug).includes(normalizedQuery),
      )
    : mixes;
  const resultCountLabel = `${filteredMixes.length} mix${
    filteredMixes.length === 1 ? "" : "es"
  } found that match`;
  const homeSections = getHomeMixSections(mixes);

  const renderMixGrid = (items: MixRecord[]) => (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
      {items.map((mix) => (
        <MixCard key={mix.id} mix={mix} showMediaBadge />
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
        <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-2 py-2 scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] sm:hidden [&::-webkit-scrollbar]:hidden">
          {items.map((mix, index) => (
            <div
              key={mix.id}
              className={`w-[60vw] max-w-[18rem] shrink-0 ${
                index === 0
                  ? "snap-start"
                  : index === items.length - 1
                    ? "snap-end"
                    : "snap-center"
              }`}
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
    <>
      {isSearchView ? null : <HomeHero />}

      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
        {isSearchResultsView ? (
          <p className="text-sm font-medium text-muted-foreground">
            {resultCountLabel}
          </p>
        ) : null}

        {filteredMixes.length ? (
          isSearchView ? (
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
                    className="text-2xl font-black text-foreground"
                  >
                    {section.title}
                  </h2>

                  {renderSectionMixes(section.mixes, section.mobileLayout)}
                </section>
              ))}

              <section aria-labelledby="browse-archive" className="space-y-4">
                <h2
                  id="browse-archive"
                  className="text-2xl font-black text-foreground"
                >
                  Browse the crates
                </h2>

                <div className="grid gap-4 sm:grid-cols-2">
                  {browseLinks.map((link) => {
                    const Icon = link.icon;

                    return (
                      <Link
                        key={link.href}
                        href={link.href}
                        className="group flex items-center justify-between rounded-lg border border-border bg-card/80 px-4 py-4 text-foreground transition hover:bg-muted"
                      >
                        <span className="flex min-w-0 items-center gap-3">
                          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-background text-muted-foreground">
                            <Icon className="size-5" />
                          </span>
                          <span className="truncate text-base font-semibold">
                            {link.title}
                          </span>
                        </span>
                        <ArrowRight className="size-5 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-foreground" />
                      </Link>
                    );
                  })}
                </div>
              </section>
            </div>
          )
        ) : (
          <div className="flex min-h-72 flex-col items-center justify-center rounded-3xl bg-card/80 px-6 text-center shadow-[0_24px_48px_rgba(0,0,0,0.18)]">
            <div className="mb-4 flex size-14 items-center justify-center rounded-full bg-muted text-muted-foreground">
              <SearchX className="size-6" />
            </div>
            <h2 className="text-lg font-semibold text-foreground">
              No mixes found
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Try a different title, artist, track name, genre, or keyword from
              the mix description.
            </p>
          </div>
        )}
      </div>
    </>
  );
}

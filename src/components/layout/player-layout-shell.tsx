"use client";

import { usePathname } from "next/navigation";

import SiteFooter from "@/components/layout/site-footer";
import RouteLoadingProvider from "@/components/navigation/route-loading-provider";
import TopBarProvider from "@/components/navigation/top-bar-provider";
import PlayerBar from "@/components/player/player-bar";
import { usePlayer } from "@/hooks/use-player";
import type { MixRecord, TracklistsBySlug } from "@/types/mix";

const shouldHidePlayerBar = (pathname: string) => pathname.startsWith("/admin");

export default function PlayerLayoutShell({
  children,
  searchMixes,
  tracklistsBySlug,
}: {
  children: React.ReactNode;
  searchMixes: MixRecord[];
  tracklistsBySlug: TracklistsBySlug;
}) {
  const pathname = usePathname();
  const hidePlayerBar = shouldHidePlayerBar(pathname);
  const { currentTrack, isPlayerBarVisible } = usePlayer();
  const shouldReservePlayerSpace =
    !hidePlayerBar && Boolean(currentTrack) && isPlayerBarVisible;

  return (
    <RouteLoadingProvider key={pathname}>
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <TopBarProvider
          searchMixes={searchMixes}
          tracklistsBySlug={tracklistsBySlug}
        >
          <main
            className={`flex-1 transition-[padding-bottom] duration-200 ease-out ${
              shouldReservePlayerSpace
                ? "pb-[calc(8rem+env(safe-area-inset-bottom))]"
                : "pb-12"
            }`}
          >
            {children}
          </main>
        </TopBarProvider>
        <SiteFooter />
        {hidePlayerBar ? null : <PlayerBar />}
      </div>
    </RouteLoadingProvider>
  );
}

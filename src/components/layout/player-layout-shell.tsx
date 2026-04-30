"use client";

import { usePathname } from "next/navigation";

import SiteFooter from "@/components/layout/site-footer";
import RouteLoadingProvider from "@/components/navigation/route-loading-provider";
import TopBarProvider from "@/components/navigation/top-bar-provider";
import PlayerBar from "@/components/player/player-bar";
import type { MixRecord } from "@/types/mix";

const shouldHidePlayerBar = (pathname: string) => pathname.startsWith("/admin");

export default function PlayerLayoutShell({
  children,
  searchMixes,
}: {
  children: React.ReactNode;
  searchMixes: MixRecord[];
}) {
  const pathname = usePathname();
  const hidePlayerBar = shouldHidePlayerBar(pathname);

  return (
    <RouteLoadingProvider key={pathname}>
      <div className="flex min-h-dvh flex-col bg-background text-foreground">
        <TopBarProvider searchMixes={searchMixes}>
          <main className={`flex-1 ${hidePlayerBar ? "pb-10" : "pb-32"}`}>
            {children}
          </main>
        </TopBarProvider>
        <SiteFooter />
        {hidePlayerBar ? null : <PlayerBar />}
      </div>
    </RouteLoadingProvider>
  );
}

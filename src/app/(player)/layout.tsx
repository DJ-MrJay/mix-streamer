import TopBarProvider from "@/components/navigation/top-bar-provider";
import PlayerBar from "@/components/player/player-bar";
import SiteFooter from "@/components/layout/site-footer";
import { getMixes } from "@/lib/mixes";

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mixes = await getMixes();

  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <TopBarProvider searchMixes={mixes}>
        <main className="flex-1 pb-32">{children}</main>
      </TopBarProvider>
      <SiteFooter />
      <PlayerBar />
    </div>
  );
}

import PlayerLayoutShell from "@/components/layout/player-layout-shell";
import { getMixes } from "@/lib/mixes";
import { getTracklistsForMixes } from "@/lib/tracklists";

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mixes = await getMixes();
  const tracklistsBySlug = await getTracklistsForMixes(mixes);

  return (
    <PlayerLayoutShell
      searchMixes={mixes}
      tracklistsBySlug={tracklistsBySlug}
    >
      {children}
    </PlayerLayoutShell>
  );
}

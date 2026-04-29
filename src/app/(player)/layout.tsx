import PlayerLayoutShell from "@/components/layout/player-layout-shell";
import { getMixes } from "@/lib/mixes";

export default async function PlayerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const mixes = await getMixes();

  return <PlayerLayoutShell searchMixes={mixes}>{children}</PlayerLayoutShell>;
}

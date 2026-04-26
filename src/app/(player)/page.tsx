import { getMixes } from "@/lib/mixes";
import MixGrid from "@/components/mix/mix-grid";

export default async function HomePage() {
  const mixes = await getMixes();

  return <MixGrid mixes={mixes} />;
}

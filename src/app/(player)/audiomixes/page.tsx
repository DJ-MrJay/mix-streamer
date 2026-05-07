import type { Metadata } from "next";

import MixCollectionPage from "@/components/mix/mix-collection-page";
import { getAudioMixes } from "@/lib/mixes";

export const metadata: Metadata = {
  title: "Audio Mixes | DJ Mr. Jay Mixtapes",
  description: "Browse every published audio mix by DJ Mr. Jay.",
};

export default async function AudioMixesPage() {
  const mixes = await getAudioMixes();

  return (
    <MixCollectionPage
      title="Audio mixes"
      description="Browse every published audio mix in the DJ Mr. Jay archive."
      mixes={mixes}
      mediaType="audio"
    />
  );
}

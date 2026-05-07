import type { Metadata } from "next";

import MixCollectionPage from "@/components/mix/mix-collection-page";
import { getVideoMixes } from "@/lib/mixes";

export const metadata: Metadata = {
  title: "Video Mixes | DJ Mr. Jay Mixtapes",
  description: "Browse every published video mix by DJ Mr. Jay.",
};

export default async function VideoMixesPage() {
  const mixes = await getVideoMixes();

  return (
    <MixCollectionPage
      title="Video mixes"
      description="Watch every published video mix in the DJ Mr. Jay archive."
      mixes={mixes}
      mediaType="video"
      gridClassName="grid-cols-1 md:grid-cols-2 xl:grid-cols-4"
    />
  );
}

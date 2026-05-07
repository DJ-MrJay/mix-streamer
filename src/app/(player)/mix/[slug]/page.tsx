import { notFound, redirect } from "next/navigation";

import { getMixHref } from "@/lib/mix-routes";
import { getMixesBySlug } from "@/lib/mixes";

export default async function LegacyMixPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const matchingMixes = await getMixesBySlug(slug);
  const mix =
    matchingMixes.find((matchingMix) => matchingMix.media_type !== "video") ??
    matchingMixes[0] ??
    null;
  const href = mix ? getMixHref(mix) : null;

  if (!href) {
    notFound();
  }

  redirect(href);
}

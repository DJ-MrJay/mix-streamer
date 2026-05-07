import MixDetailPage, {
  generateMixDetailMetadata,
} from "@/components/mix/mix-detail-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return generateMixDetailMetadata({ slug, mediaType: "audio" });
}

export default async function AudioMixPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MixDetailPage slug={slug} mediaType="audio" />;
}

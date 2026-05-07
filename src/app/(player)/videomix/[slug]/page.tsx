import MixDetailPage, {
  generateMixDetailMetadata,
} from "@/components/mix/mix-detail-page";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return generateMixDetailMetadata({ slug, mediaType: "video" });
}

export default async function VideoMixPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return <MixDetailPage slug={slug} mediaType="video" />;
}

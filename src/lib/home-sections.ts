import { DJ_MR_JAY_PICK_SLUGS } from "@/data/dj-mr-jay-picks";
import { getDisplayTrackInfo } from "@/lib/mix-display";
import { getMixListHref } from "@/lib/mix-routes";
import type { MixRecord } from "@/types/mix";

export type HomeMixSection = {
  id: string;
  title: string;
  mixes: MixRecord[];
  mobileLayout?: "grid" | "carousel";
  showAllHref?: string;
};

const LATEST_SECTION_LIMIT = 4;
const HIP_HOP_AND_RNB_SECTION_LIMIT = 4;
const SOUL_SECTION_LIMIT = 4;
const VIDEO_SECTION_LIMIT = 8;
const MIXUP_TITLE_PATTERN = /\bmixup\b/i;
const TIMELESS_PARTY_ANTHEMS_TITLE_PATTERN = /\btimeless party anthems\b/i;
const TITLE_YEAR_PATTERN = /\b(19|20)\d{2}\b/;
const HIP_HOP_AND_RNB_PATTERN = /hip[\s-]?hop|rap|r&b|rnb/;
const SOUL_PATTERN = /\bsoul\b/;
const TRIBUTE_TITLE_PATTERN = /\b(?:tributes?|memory)\b/i;
const TRIBUTE_ARTIST_PATTERN = /\b(?:jay[\s-]?z|2\s*pac|tupac)\b/i;
const VARIOUS_ARTIST_PATTERN = /\bvarious\b/i;

const getGenreText = (mix: MixRecord) =>
  (mix.genre ?? []).join(" ").toLowerCase();

const getMixTitleYear = (title: string) => {
  const match = title.match(TITLE_YEAR_PATTERN);
  return match ? Number(match[0]) : null;
};

const sortKenyaClubBangersByYear = (mixes: MixRecord[]) =>
  [...mixes].sort((leftMix, rightMix) => {
    const leftYear = getMixTitleYear(leftMix.title) ?? Number.NEGATIVE_INFINITY;
    const rightYear =
      getMixTitleYear(rightMix.title) ?? Number.NEGATIVE_INFINITY;

    if (rightYear !== leftYear) {
      return rightYear - leftYear;
    }

    return leftMix.title.localeCompare(rightMix.title, undefined, {
      numeric: true,
      sensitivity: "base",
    });
  });

const takeAvailableMixes = (
  mixes: MixRecord[],
  usedMixIds: Set<string>,
  limit = Number.POSITIVE_INFINITY,
) => {
  const selectedMixes: MixRecord[] = [];

  for (const mix of mixes) {
    if (usedMixIds.has(mix.id)) {
      continue;
    }

    selectedMixes.push(mix);

    if (selectedMixes.length >= limit) {
      break;
    }
  }

  return selectedMixes;
};

const addSection = ({
  sections,
  usedMixIds,
  id,
  title,
  mixes,
  limit,
  mobileLayout = "grid",
  showAllHref,
}: {
  sections: HomeMixSection[];
  usedMixIds: Set<string>;
  id: string;
  title: string;
  mixes: MixRecord[];
  limit?: number;
  mobileLayout?: "grid" | "carousel";
  showAllHref?: string;
}) => {
  const selectedMixes = takeAvailableMixes(mixes, usedMixIds, limit);

  if (!selectedMixes.length) {
    return;
  }

  for (const mix of selectedMixes) {
    usedMixIds.add(mix.id);
  }

  sections.push({ id, title, mixes: selectedMixes, mobileLayout, showAllHref });
};

const getCuratedPickMixes = (mixes: MixRecord[]) => {
  const mixesBySlug = new Map<string, MixRecord>();

  for (const mix of mixes) {
    if (!mix.slug || mix.media_type === "video") {
      continue;
    }

    mixesBySlug.set(mix.slug, mix);
  }

  const curatedMixes: MixRecord[] = [];

  for (const slug of DJ_MR_JAY_PICK_SLUGS) {
    const mix = mixesBySlug.get(slug);

    if (mix) {
      curatedMixes.push(mix);
    }
  }

  return curatedMixes;
};

const isHipHopOrRnBMix = (mix: MixRecord) =>
  HIP_HOP_AND_RNB_PATTERN.test(getGenreText(mix));

const isKenyaClubBangerMix = (mix: MixRecord) =>
  MIXUP_TITLE_PATTERN.test(mix.title) ||
  TIMELESS_PARTY_ANTHEMS_TITLE_PATTERN.test(mix.title);

const hasTributeTitle = (mix: MixRecord) => TRIBUTE_TITLE_PATTERN.test(mix.title);

const isNamedTributeArtistMix = (mix: MixRecord) => {
  const { artist, title } = getDisplayTrackInfo(mix);
  const searchable = [mix.title, title, artist].filter(Boolean).join(" ");

  return TRIBUTE_ARTIST_PATTERN.test(searchable);
};

const isTributeMix = (mix: MixRecord) => {
  if (hasTributeTitle(mix) || isNamedTributeArtistMix(mix)) {
    return true;
  }

  const artist = getDisplayTrackInfo(mix).artist;

  if (!artist) {
    return false;
  }

  return !VARIOUS_ARTIST_PATTERN.test(artist);
};

const excludeTributeMixes = (mixes: MixRecord[]) =>
  mixes.filter((mix) => !isTributeMix(mix));

const isLatestAdditionMix = (mix: MixRecord) => !isTributeMix(mix);

const isSoulMix = (mix: MixRecord) => SOUL_PATTERN.test(getGenreText(mix));

const isVideoMix = (mix: MixRecord) => mix.media_type === "video";

const isAudioMix = (mix: MixRecord) => !isVideoMix(mix);

export const getHomeMixSections = (mixes: MixRecord[]): HomeMixSection[] => {
  const sections: HomeMixSection[] = [];
  const usedMixIds = new Set<string>();
  const audioMixes = mixes.filter(isAudioMix);
  const videoMixes = mixes.filter(isVideoMix);

  addSection({
    sections,
    usedMixIds,
    id: "latest-additions",
    title: "Latest additions",
    mixes: audioMixes.filter(isLatestAdditionMix),
    limit: LATEST_SECTION_LIMIT,
    showAllHref: getMixListHref("audio"),
  });

  addSection({
    sections,
    usedMixIds,
    id: "video-mixes",
    title: "Video mixes",
    mixes: videoMixes,
    limit: VIDEO_SECTION_LIMIT,
    mobileLayout: "carousel",
    showAllHref: getMixListHref("video"),
  });

  addSection({
    sections,
    usedMixIds,
    id: "dj-mr-jay-picks",
    title: "Top DJ Mr. Jay picks",
    mixes: excludeTributeMixes(getCuratedPickMixes(audioMixes)),
    mobileLayout: "carousel",
  });

  addSection({
    sections,
    usedMixIds,
    id: "soul-classics",
    title: "Soul classics",
    mixes: excludeTributeMixes(audioMixes.filter(isSoulMix)),
    limit: SOUL_SECTION_LIMIT,
  });

  addSection({
    sections,
    usedMixIds,
    id: "kenya-club-bangers-by-year",
    title: "Kenya club bangers by year",
    mixes: sortKenyaClubBangersByYear(
      excludeTributeMixes(audioMixes.filter(isKenyaClubBangerMix)),
    ),
    mobileLayout: "carousel",
  });

  addSection({
    sections,
    usedMixIds,
    id: "hip-hop-and-rnb",
    title: "Hip Hop & R&B",
    mixes: excludeTributeMixes(audioMixes.filter(isHipHopOrRnBMix)),
    limit: HIP_HOP_AND_RNB_SECTION_LIMIT,
  });

  addSection({
    sections,
    usedMixIds,
    id: "tributes",
    title: "Tribute mixes",
    mixes: audioMixes.filter(isTributeMix),
    mobileLayout: "carousel",
  });

  return sections;
};

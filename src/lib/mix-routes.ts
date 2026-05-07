import type { MixMediaType, MixRecord } from '@/types/mix'

type MixRouteSource = Pick<MixRecord, 'media_type' | 'slug'>

export const getMixMediaType = (
  mix: Pick<MixRecord, 'media_type'>
): MixMediaType => mix.media_type ?? 'audio'

export const getMixDetailBasePath = (mediaType: MixMediaType) =>
  mediaType === 'video' ? '/videomix' : '/audiomix'

export const getMixListHref = (mediaType: MixMediaType) =>
  mediaType === 'video' ? '/videomixes' : '/audiomixes'

export const getMixHref = (mix: MixRouteSource) =>
  mix.slug ? `${getMixDetailBasePath(getMixMediaType(mix))}/${mix.slug}` : null

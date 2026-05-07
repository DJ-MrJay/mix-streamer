import { getDisplayTrackInfo } from '@/lib/mix-display'
import type { MixRecord } from '@/types/mix'

type MixRecencyComparable = Pick<MixRecord, 'created_at' | 'drive_modified_at'>
type MixTitleComparable = Pick<MixRecord, 'title' | 'artist'>
type MixArchiveComparable = Pick<
  MixRecord,
  'title' | 'artist' | 'genre' | 'year' | 'created_at' | 'drive_modified_at'
>

export type MixArchiveSortKey = 'date' | 'name-asc' | 'name-desc' | 'genre'

const getTimestamp = (value: string | null) => {
  if (!value) {
    return 0
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

const getTitleSortValue = (mix: MixTitleComparable) =>
  getDisplayTrackInfo(mix).title.toLowerCase()

const compareMixTitles = (
  leftMix: MixTitleComparable,
  rightMix: MixTitleComparable
) =>
  getTitleSortValue(leftMix).localeCompare(getTitleSortValue(rightMix), undefined, {
    numeric: true,
    sensitivity: 'base',
  })

const getGenreSortValue = (mix: Pick<MixRecord, 'genre'>) =>
  mix.genre?.map((value) => value.trim()).find(Boolean)?.toLowerCase() ?? '\uffff'

const getMixYearSortValue = (mix: Pick<MixRecord, 'year'>) =>
  typeof mix.year === 'number' ? mix.year : Number.NEGATIVE_INFINITY

export const getMixRecencyTimestamp = (mix: MixRecencyComparable) =>
  getTimestamp(mix.drive_modified_at) || getTimestamp(mix.created_at)

export const sortMixesByRecency = <T extends MixRecencyComparable>(mixes: T[]) =>
  [...mixes].sort((leftMix, rightMix) => {
    const recencyDifference =
      getMixRecencyTimestamp(rightMix) - getMixRecencyTimestamp(leftMix)

    if (recencyDifference !== 0) {
      return recencyDifference
    }

    return getTimestamp(rightMix.created_at) - getTimestamp(leftMix.created_at)
  })

export const sortMixesByDisplayTitle = <T extends MixTitleComparable>(
  mixes: T[],
  direction: 'asc' | 'desc' = 'asc'
) =>
  [...mixes].sort((leftMix, rightMix) => {
    const comparison = compareMixTitles(leftMix, rightMix)

    if (comparison !== 0) {
      return direction === 'asc' ? comparison : comparison * -1
    }

    return 0
  })

export const sortMixesByDate = <T extends MixArchiveComparable>(mixes: T[]) =>
  [...mixes].sort((leftMix, rightMix) => {
    const yearDifference =
      getMixYearSortValue(rightMix) - getMixYearSortValue(leftMix)

    if (yearDifference !== 0) {
      return yearDifference
    }

    const recencyDifference =
      getMixRecencyTimestamp(rightMix) - getMixRecencyTimestamp(leftMix)

    if (recencyDifference !== 0) {
      return recencyDifference
    }

    return compareMixTitles(leftMix, rightMix)
  })

export const sortMixesByGenre = <T extends MixArchiveComparable>(mixes: T[]) =>
  [...mixes].sort((leftMix, rightMix) => {
    const genreComparison = getGenreSortValue(leftMix).localeCompare(
      getGenreSortValue(rightMix),
      undefined,
      { sensitivity: 'base' }
    )

    if (genreComparison !== 0) {
      return genreComparison
    }

    return compareMixTitles(leftMix, rightMix)
  })

export const sortMixesForArchive = <T extends MixArchiveComparable>(
  mixes: T[],
  sortKey: MixArchiveSortKey
) => {
  switch (sortKey) {
    case 'name-asc':
      return sortMixesByDisplayTitle(mixes, 'asc')
    case 'name-desc':
      return sortMixesByDisplayTitle(mixes, 'desc')
    case 'genre':
      return sortMixesByGenre(mixes)
    case 'date':
    default:
      return sortMixesByDate(mixes)
  }
}

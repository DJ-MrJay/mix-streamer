import type { MixRecord } from '@/types/mix'

type MixSortComparable = Pick<MixRecord, 'created_at' | 'drive_modified_at'>

const getTimestamp = (value: string | null) => {
  if (!value) {
    return 0
  }

  const timestamp = Date.parse(value)
  return Number.isNaN(timestamp) ? 0 : timestamp
}

export const getMixRecencyTimestamp = (mix: MixSortComparable) =>
  getTimestamp(mix.drive_modified_at) || getTimestamp(mix.created_at)

export const sortMixesByRecency = <T extends MixSortComparable>(mixes: T[]) =>
  [...mixes].sort((leftMix, rightMix) => {
    const recencyDifference =
      getMixRecencyTimestamp(rightMix) - getMixRecencyTimestamp(leftMix)

    if (recencyDifference !== 0) {
      return recencyDifference
    }

    return getTimestamp(rightMix.created_at) - getTimestamp(leftMix.created_at)
  })

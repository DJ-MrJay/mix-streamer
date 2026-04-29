const DEFAULT_SITE_URL = 'http://localhost:3000'

const trimTrailingSlash = (value: string) => value.replace(/\/+$/, '')

const normalizeSiteUrl = (value: string) => {
  const trimmedValue = value.trim()

  if (!trimmedValue) {
    return DEFAULT_SITE_URL
  }

  if (/^https?:\/\//i.test(trimmedValue)) {
    return trimTrailingSlash(trimmedValue)
  }

  return trimTrailingSlash(`https://${trimmedValue}`)
}

export const getSiteUrl = () =>
  normalizeSiteUrl(
    process.env.NEXT_PUBLIC_SITE_URL ??
      process.env.SITE_URL ??
      process.env.VERCEL_PROJECT_PRODUCTION_URL ??
      process.env.VERCEL_URL ??
      DEFAULT_SITE_URL
  )

export const toAbsoluteUrl = (value: string) =>
  new URL(value, getSiteUrl()).toString()

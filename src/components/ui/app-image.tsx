import Image, { type ImageProps } from 'next/image'

import { cn } from '@/lib/utils'

type AppImageProps = ImageProps

export default function AppImage({
  alt,
  className,
  sizes,
  ...props
}: AppImageProps) {
  const resolvedSizes = sizes ?? (props.fill ? '100vw' : undefined)

  return (
    <Image
      alt={alt}
      {...props}
      sizes={resolvedSizes}
      className={cn(className)}
    />
  )
}

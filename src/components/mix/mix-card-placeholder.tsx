import AppImage from "@/components/ui/app-image";

type MixCardPlaceholderProps = {
  className?: string;
  mediaType?: "audio" | "video";
};

export default function MixCardPlaceholder({
  className = "",
  mediaType = "audio",
}: MixCardPlaceholderProps) {
  const artworkAspectClass =
    mediaType === "video" ? "aspect-video" : "aspect-square";

  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none overflow-hidden rounded-sm bg-card/75 opacity-70 ${className}`}
    >
      <div className={`relative ${artworkAspectClass} overflow-hidden bg-muted/40`}>
        <div className="absolute inset-0 bg-gradient-to-br from-muted/70 to-card/30" />
        <div className="absolute inset-0 flex items-center justify-center">
          <AppImage
            src="/djmrjay-logo-light.svg"
            alt=""
            width={72}
            height={72}
            unoptimized
            className="hidden opacity-10 dark:block"
          />
          <AppImage
            src="/djmrjay-logo-dark.svg"
            alt=""
            width={72}
            height={72}
            unoptimized
            className="block opacity-10 dark:hidden"
          />
        </div>
      </div>

      <div className="space-y-3 p-3 md:p-4">
        <div className="h-5 rounded bg-muted/35" />
        <div className="h-4 w-2/3 rounded bg-muted/25" />
      </div>
    </div>
  );
}

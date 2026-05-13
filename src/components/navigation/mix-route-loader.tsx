import AppImage from "@/components/ui/app-image";
import { cn } from "@/lib/utils";

type MixRouteLoaderProps = {
  className?: string;
  compact?: boolean;
  description?: string;
  title?: string;
};

export default function MixRouteLoader({
  className,
  compact = false,
  description = "Getting page ready...",
  title = "Loading mix",
}: MixRouteLoaderProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4 text-center text-foreground",
        compact ? "min-w-56" : "min-h-[50vh] px-4 py-10",
        className,
      )}
    >
      <div className="relative">
        <div className="absolute inset-[-0.55rem] rounded-full border-2 border-primary/20 border-t-primary/80 animate-spin" />
        <div className="relative flex size-20 items-center justify-center rounded-full border border-border bg-card/90 shadow-[0_18px_36px_rgba(0,0,0,0.24)]">
          <AppImage
            src="/djmrjay-logo-light.svg"
            alt=""
            width={56}
            height={56}
            unoptimized
            className="hidden h-14 w-14 dark:block animate-pulse"
          />
          <AppImage
            src="/djmrjay-logo-dark.svg"
            alt=""
            width={56}
            height={56}
            unoptimized
            className="block h-14 w-14 dark:hidden animate-pulse"
          />
        </div>
      </div>

      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
          DJ Mr Jay
        </p>
        <p className="text-base font-semibold text-foreground">{title}</p>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

import MixRouteLoader, {
  DEFAULT_ROUTE_LOADER_DESCRIPTION,
  DEFAULT_ROUTE_LOADER_TITLE,
} from "@/components/navigation/mix-route-loader";
import { cn } from "@/lib/utils";

type CenteredRouteLoaderProps = {
  title?: string;
  description?: string;
  variant?: "overlay" | "page";
  className?: string;
};

function RouteLoaderCard({
  title = DEFAULT_ROUTE_LOADER_TITLE,
  description = DEFAULT_ROUTE_LOADER_DESCRIPTION,
}: Pick<CenteredRouteLoaderProps, "title" | "description">) {
  return (
    <div
      aria-live="polite"
      role="status"
      className="rounded-3xl border border-border bg-card/92 px-6 py-5 shadow-[0_24px_48px_rgba(0,0,0,0.32)]"
    >
      <MixRouteLoader compact title={title} description={description} />
    </div>
  );
}

export default function CenteredRouteLoader({
  title = DEFAULT_ROUTE_LOADER_TITLE,
  description = DEFAULT_ROUTE_LOADER_DESCRIPTION,
  variant = "page",
  className,
}: CenteredRouteLoaderProps) {
  if (variant === "overlay") {
    return (
      <div
        className={cn(
          "pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/72 px-4 backdrop-blur-md",
          className,
        )}
      >
        <RouteLoaderCard title={title} description={description} />
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex min-h-[calc(100dvh-68px)] items-center justify-center bg-background px-4 sm:min-h-[calc(100dvh-80px)]",
        className,
      )}
    >
      <RouteLoaderCard title={title} description={description} />
    </div>
  );
}

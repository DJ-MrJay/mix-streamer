import MixRouteLoader from "@/components/navigation/mix-route-loader";

export default function Loading() {
  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
      <MixRouteLoader />
    </div>
  );
}

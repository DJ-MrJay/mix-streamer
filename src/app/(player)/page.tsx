import { getMixes } from "@/lib/mixes";
import MixCard from "@/components/mix/mix-card";

export default async function HomePage() {
  const mixes = await getMixes();

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-4 py-6">
      <div className="space-y-1">
        <p className="text-xs font-medium uppercase tracking-[0.24em] text-muted-foreground">
          Library
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Your Mixes
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
        {mixes.map((mix) => (
          <MixCard key={mix.id} mix={mix} />
        ))}
      </div>
    </div>
  );
}

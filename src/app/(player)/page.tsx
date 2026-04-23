import { getMixes } from "@/lib/mixes";
import MixCard from "@/components/mix/mix-card";

export default async function HomePage() {
  const mixes = await getMixes();

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-4">Your Mixes</h1>

      <div className="grid grid-cols-2 gap-4">
        {mixes.map((mix) => (
          <MixCard key={mix.id} mix={mix} />
        ))}
      </div>
    </div>
  );
}

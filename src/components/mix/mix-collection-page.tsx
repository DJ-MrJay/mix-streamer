import MixCard from "@/components/mix/mix-card";
import MixCardPlaceholder from "@/components/mix/mix-card-placeholder";
import BackButton from "@/components/navigation/back-button";
import type { MixMediaType, MixRecord } from "@/types/mix";

type PlaceholderRule = {
  columns: number;
  className: string;
};

const defaultPlaceholderRules: PlaceholderRule[] = [
  { columns: 2, className: "block sm:hidden" },
  { columns: 3, className: "hidden sm:block xl:hidden" },
  { columns: 4, className: "hidden xl:block" },
];

const videoPlaceholderRules: PlaceholderRule[] = [
  { columns: 2, className: "hidden md:block xl:hidden" },
  { columns: 4, className: "hidden xl:block" },
];

const getPlaceholderCount = (itemCount: number, columns: number) =>
  (columns - (itemCount % columns)) % columns;

export default function MixCollectionPage({
  title,
  description,
  mixes,
  mediaType = "audio",
  gridClassName = "grid-cols-2 sm:grid-cols-3 xl:grid-cols-4",
}: {
  title: string;
  description: string;
  mixes: MixRecord[];
  mediaType?: MixMediaType;
  gridClassName?: string;
}) {
  const placeholderRules =
    mediaType === "video" ? videoPlaceholderRules : defaultPlaceholderRules;
  const placeholders = placeholderRules.flatMap((rule) =>
    Array.from(
      { length: getPlaceholderCount(mixes.length, rule.columns) },
      (_, index) => ({
        key: `${mediaType}-placeholder-${rule.columns}-${index}`,
        className: rule.className,
      }),
    ),
  );

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6">
      <div className="mb-0">
        <BackButton />
      </div>

      <header className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-foreground md:text-5xl">
          {title}
        </h1>
        <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground md:text-base">
          {description}
        </p>
      </header>

      {mixes.length ? (
        <div className={`grid gap-4 ${gridClassName}`}>
          {mixes.map((mix) => (
            <MixCard key={mix.id} mix={mix} />
          ))}

          {placeholders.map((placeholder) => (
            <MixCardPlaceholder
              key={placeholder.key}
              mediaType={mediaType}
              className={placeholder.className}
            />
          ))}
        </div>
      ) : (
        <div className="flex min-h-56 items-center justify-center rounded-lg border border-dashed border-border bg-card/60 px-6 text-center text-sm text-muted-foreground">
          No mixes found here yet.
        </div>
      )}
    </div>
  );
}

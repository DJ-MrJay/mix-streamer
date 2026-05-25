"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

export default function MixViewToggle({
  view,
  onChange,
}: {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
}) {
  return (
    <div aria-label="Toggle view" className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-pressed={view === "grid"}
        aria-label="Grid view"
        onClick={() => onChange("grid")}
        className={cn(
          "rounded-full p-2 transition-colors bg-muted/50 hover:bg-muted",
          view === "grid" ? "bg-background text-foreground" : "text-muted-foreground"
        )}
      >
        <LayoutGrid className="size-6" />
      </button>

      <button
        type="button"
        aria-pressed={view === "list"}
        aria-label="List view"
        onClick={() => onChange("list")}
        className={cn(
          "rounded-full p-2 transition-colors bg-muted/50 hover:bg-muted",
          view === "list" ? "bg-background text-foreground" : "text-muted-foreground"
        )}
      >
        <List className="size-6" />
      </button>
    </div>
  );
}

"use client";

import { LayoutGrid, List } from "lucide-react";
import { cn } from "@/lib/utils";

interface MixViewToggleProps {
  view: "grid" | "list";
  onChange: (view: "grid" | "list") => void;
}

export default function MixViewToggle({ view, onChange }: MixViewToggleProps) {
  const nextView = view === "grid" ? "list" : "grid";
  const toggleLabel = `Switch to ${nextView} view`;

  return (
    <button
      type="button"
      onClick={() => onChange(nextView)}
      className={cn(
        "rounded-full p-2 transition-colors bg-muted/50 hover:bg-muted",
        "text-foreground",
      )}
      aria-label={toggleLabel}
    >
      {view === "grid" ? (
        <List className="size-6" />
      ) : (
        <LayoutGrid className="size-6" />
      )}
    </button>
  );
}

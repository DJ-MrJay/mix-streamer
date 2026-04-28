"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

export default function BackButton() {
  const router = useRouter();

  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <button
  type="button"
  onClick={handleBack}
  className="inline-flex items-center gap-2 text-sm font-medium text-foreground transition hover:text-muted-foreground"
  aria-label="Back"
>
  <ArrowLeft className="size-5" />
  <span className="hidden sm:inline">Back</span>
</button>
  );
}

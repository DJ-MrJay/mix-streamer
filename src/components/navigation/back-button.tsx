"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { useRouteLoading } from "@/components/navigation/route-loading-provider";

export default function BackButton() {
  const router = useRouter();
  const { startRouteLoading } = useRouteLoading();

  const handleBack = () => {
    startRouteLoading("Returning to the previous page...", {
      immediate: true,
    });

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

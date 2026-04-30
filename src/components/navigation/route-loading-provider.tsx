"use client";

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";

import MixRouteLoader from "@/components/navigation/mix-route-loader";

type RouteLoadingContextValue = {
  startRouteLoading: () => void;
};

const RouteLoadingContext = createContext<RouteLoadingContextValue | null>(null);
const NAVIGATION_FEEDBACK_DELAY_MS = 120;

export function useRouteLoading() {
  const context = useContext(RouteLoadingContext);

  if (!context) {
    throw new Error("useRouteLoading must be used within RouteLoadingProvider");
  }

  return context;
}

export default function RouteLoadingProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const timeoutRef = useRef<number | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);

  const clearPendingTimer = useCallback(() => {
    if (timeoutRef.current !== null) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  const stopRouteLoading = useCallback(() => {
    clearPendingTimer();
    setIsRouteLoading(false);
  }, [clearPendingTimer]);

  const startRouteLoading = useCallback(() => {
    clearPendingTimer();
    timeoutRef.current = window.setTimeout(() => {
      setIsRouteLoading(true);
      timeoutRef.current = null;
    }, NAVIGATION_FEEDBACK_DELAY_MS);
  }, [clearPendingTimer]);

  useEffect(() => {
    return () => {
      stopRouteLoading();
    };
  }, [stopRouteLoading]);

  return (
    <RouteLoadingContext.Provider value={{ startRouteLoading }}>
      {children}

      {isRouteLoading ? (
        <div className="pointer-events-none fixed inset-0 z-50 flex items-center justify-center bg-background/72 px-4 backdrop-blur-md">
          <div
            aria-live="polite"
            role="status"
            className="rounded-3xl border border-border bg-card/92 px-6 py-5 shadow-[0_24px_48px_rgba(0,0,0,0.32)]"
          >
            <MixRouteLoader
              compact
              description="Opening the mix page..."
            />
          </div>
        </div>
      ) : null}
    </RouteLoadingContext.Provider>
  );
}

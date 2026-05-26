"use client";

import { usePathname } from "next/navigation";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";

import CenteredRouteLoader from "@/components/navigation/centered-route-loader";
import { DEFAULT_ROUTE_LOADER_DESCRIPTION } from "@/components/navigation/mix-route-loader";

type StartRouteLoadingOptions = {
  immediate?: boolean;
};

type RouteLoadingContextValue = {
  startRouteLoading: (
    description?: string,
    options?: StartRouteLoadingOptions,
  ) => void;
};

const RouteLoadingContext = createContext<RouteLoadingContextValue | null>(null);
const NAVIGATION_FEEDBACK_DELAY_MS = 120;
const DEFAULT_ROUTE_LOADING_DESCRIPTION = DEFAULT_ROUTE_LOADER_DESCRIPTION;

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
  const pathname = usePathname();
  const previousPathnameRef = useRef(pathname);
  const timeoutRef = useRef<number | null>(null);
  const [isRouteLoading, setIsRouteLoading] = useState(false);
  const [loadingDescription, setLoadingDescription] = useState(
    DEFAULT_ROUTE_LOADING_DESCRIPTION,
  );

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

  const startRouteLoading = useCallback(
    (
      description = DEFAULT_ROUTE_LOADING_DESCRIPTION,
      options?: StartRouteLoadingOptions,
    ) => {
      clearPendingTimer();
      setLoadingDescription(description);

      if (options?.immediate) {
        setIsRouteLoading(true);
        return;
      }

      timeoutRef.current = window.setTimeout(() => {
        setIsRouteLoading(true);
        timeoutRef.current = null;
      }, NAVIGATION_FEEDBACK_DELAY_MS);
    },
    [clearPendingTimer],
  );

  useEffect(() => {
    if (previousPathnameRef.current === pathname) {
      return;
    }

    previousPathnameRef.current = pathname;
    stopRouteLoading();
  }, [pathname, stopRouteLoading]);

  useEffect(() => {
    const handlePopState = () => {
      startRouteLoading(undefined, { immediate: true });
    };

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [startRouteLoading]);

  useEffect(() => {
    return () => {
      stopRouteLoading();
    };
  }, [stopRouteLoading]);

  return (
    <RouteLoadingContext.Provider value={{ startRouteLoading }}>
      {children}

      {isRouteLoading ? (
        <CenteredRouteLoader
          variant="overlay"
          title="Loading page"
          description={loadingDescription}
        />
      ) : null}
    </RouteLoadingContext.Provider>
  );
}

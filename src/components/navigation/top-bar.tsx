"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState, type RefObject } from "react";
import { Moon, Search, SunMedium, X } from "lucide-react";

import AppImage from "@/components/ui/app-image";
import { Input } from "@/components/ui/input";
import { useRouteLoading } from "@/components/navigation/route-loading-provider";
import { usePlayer } from "@/hooks/use-player";
import {
  applyThemeToDocument,
  getResolvedTheme,
  persistTheme,
  THEME_STORAGE_KEY,
  type AppTheme,
} from "@/lib/theme";

type TopBarProps = {
  searchValue?: string;
  onSearchValueChange?: (value: string) => void;
  onSearchOpen?: () => void;
  onSearchClose?: () => void;
  searchContentRef?: RefObject<HTMLElement | null>;
};

export default function TopBar({
  searchValue = "",
  onSearchValueChange,
  onSearchOpen,
  onSearchClose,
  searchContentRef,
}: TopBarProps) {
  const pathname = usePathname();
  const { startRouteLoading } = useRouteLoading();
  const searchEnabled = typeof onSearchValueChange === "function";
  const [theme, setTheme] = useState<AppTheme>("dark");
  const [isMounted, setIsMounted] = useState(false);
  const [isDesktopSearchOpen, setIsDesktopSearchOpen] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
  const searchAreaRef = useRef<HTMLDivElement>(null);
  const desktopSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchRef = useRef<HTMLInputElement>(null);
  const mobileSearchId = useId();

  useEffect(() => {
    const syncTheme = () => {
      setTheme(getResolvedTheme());
      setIsMounted(true);
    };

    syncTheme();

    const handleStorage = (event: StorageEvent) => {
      if (event.key === null || event.key === THEME_STORAGE_KEY) {
        syncTheme();
      }
    };

    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, []);

  useEffect(() => {
    if (isDesktopSearchOpen) {
      desktopSearchRef.current?.focus();
    }
  }, [isDesktopSearchOpen]);

  useEffect(() => {
    if (isMobileSearchOpen) {
      mobileSearchRef.current?.focus();
    }
  }, [isMobileSearchOpen]);

  const clearAndCloseSearch = useCallback(() => {
    setIsDesktopSearchOpen(false);
    setIsMobileSearchOpen(false);
    onSearchValueChange?.("");
    onSearchClose?.();
    desktopSearchRef.current?.blur();
    mobileSearchRef.current?.blur();
  }, [onSearchClose, onSearchValueChange]);

  const clearSearch = useCallback(() => {
    onSearchValueChange?.("");

    window.requestAnimationFrame(() => {
      if (isDesktopSearchOpen) {
        desktopSearchRef.current?.focus();
        return;
      }

      if (isMobileSearchOpen) {
        mobileSearchRef.current?.focus();
      }
    });
  }, [isDesktopSearchOpen, isMobileSearchOpen, onSearchValueChange]);

  const handleSearchDismiss = useCallback(() => {
    if (searchValue) {
      clearSearch();
      return;
    }

    clearAndCloseSearch();
  }, [clearAndCloseSearch, clearSearch, searchValue]);

  useEffect(() => {
    if (
      !searchEnabled ||
      (!isDesktopSearchOpen && !isMobileSearchOpen && !searchValue)
    ) {
      return;
    }

    const handlePointerDown = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }

      if (searchAreaRef.current?.contains(event.target)) {
        return;
      }

      if (searchContentRef?.current?.contains(event.target)) {
        return;
      }

      window.setTimeout(() => {
        clearAndCloseSearch();
      }, 0);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [
    clearAndCloseSearch,
    isDesktopSearchOpen,
    isMobileSearchOpen,
    searchContentRef,
    searchEnabled,
    searchValue,
  ]);

  const handleThemeToggle = () => {
    const nextTheme: AppTheme = theme === "dark" ? "light" : "dark";
    applyThemeToDocument(nextTheme);
    persistTheme(nextTheme);
    setTheme(nextTheme);
  };

  const handleLogoClick = () => {
    if (pathname !== "/") {
      startRouteLoading("Opening the home page...", {
        immediate: true,
      });
    }

    const { isPlaying, hidePlayerBar } = usePlayer.getState();

    if (!isPlaying) {
      hidePlayerBar();
    }
  };

  const handleSearchButtonClick = () => {
    if (!searchEnabled) {
      return;
    }

    if (window.matchMedia("(min-width: 640px)").matches) {
      onSearchOpen?.();
      setIsDesktopSearchOpen(true);
      return;
    }

    if (isMobileSearchOpen) {
      clearAndCloseSearch();
      return;
    }

    onSearchOpen?.();
    setIsMobileSearchOpen(true);
  };

  const handleSearchInputKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
  ) => {
    if (event.key !== "Escape") {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    clearAndCloseSearch();
  };

  const searchInputClassName =
    "h-10 rounded-full border-2 bg-card/75 pr-10 pl-11 text-foreground backdrop-blur-sm placeholder:text-muted-foreground focus-visible:ring-ring/0";
  const mobileSearchExpansionClassName =
    "relative overflow-hidden transition-[width,opacity] duration-200 ease-out data-[state=closed]:pointer-events-none data-[state=closed]:w-0 data-[state=closed]:opacity-0 data-[state=open]:w-[min(16rem,calc(100vw-12rem))] data-[state=open]:opacity-100";
  const mobileSearchWrapperClassName =
    "relative h-10 transition-[width] duration-200 ease-out sm:hidden";

  const themeToggleLabel =
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto w-full max-w-6xl px-4 py-3">
        <div className="relative flex items-center gap-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
            aria-label="Go to home"
            onClick={handleLogoClick}
          >
            <div className="relative flex size-11 items-center justify-center overflow-hidden bg-card/80 sm:size-14">
              <AppImage
                src="/djmrjay-logo-light.svg"
                alt=""
                width={44}
                height={44}
                unoptimized
                className="hidden dark:block sm:w-14 sm:h-14"
              />
              <AppImage
                src="/djmrjay-logo-dark.svg"
                alt=""
                width={44}
                height={44}
                unoptimized
                className="block dark:hidden sm:w-14 sm:h-14"
              />
            </div>
          </Link>

          <div className="ml-auto flex items-center gap-2">
            {searchEnabled ? (
              <div ref={searchAreaRef} className="flex items-center gap-2">
                <div className="hidden items-center justify-end gap-2 sm:flex">
                  <div
                    data-state={isDesktopSearchOpen ? "open" : "closed"}
                    aria-hidden={!isDesktopSearchOpen}
                    className="relative overflow-hidden transition-[width,opacity] duration-200 ease-out data-[state=closed]:pointer-events-none data-[state=closed]:w-0 data-[state=closed]:opacity-0 data-[state=open]:w-[min(24rem,calc(100vw-8rem))] data-[state=open]:opacity-100"
                  >
                    <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={desktopSearchRef}
                      value={searchValue}
                      onChange={(event) =>
                        onSearchValueChange?.(event.target.value)
                      }
                      onKeyDown={handleSearchInputKeyDown}
                      placeholder="Search title, artist, or genre"
                      className={searchInputClassName}
                      aria-label="Search mixes"
                      tabIndex={isDesktopSearchOpen ? 0 : -1}
                    />
                    <button
                      type="button"
                      aria-label={searchValue ? "Clear search" : "Close search"}
                      onClick={handleSearchDismiss}
                      className="absolute top-1/2 right-3 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
                      tabIndex={isDesktopSearchOpen ? 0 : -1}
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className="rounded-full bg-muted/50 p-2 transition-colors hover:bg-muted"
                    onClick={handleSearchButtonClick}
                    aria-label="Search mixes"
                    aria-expanded={isDesktopSearchOpen}
                  >
                    <Search className="size-6 text-foreground" />
                  </button>
                </div>

                <div
                  data-state={isMobileSearchOpen ? "open" : "closed"}
                  className={`${mobileSearchWrapperClassName} ${
                    isMobileSearchOpen
                      ? "w-[min(18rem,calc(100vw-8rem))]"
                      : "w-10"
                  }`}
                >
                  <div
                    id={mobileSearchId}
                    data-state={isMobileSearchOpen ? "open" : "closed"}
                    aria-hidden={!isMobileSearchOpen}
                    className={`${mobileSearchExpansionClassName} absolute top-0 right-0 h-full data-[state=open]:w-full`}
                  >
                    <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      ref={mobileSearchRef}
                      value={searchValue}
                      onChange={(event) =>
                        onSearchValueChange?.(event.target.value)
                      }
                      onKeyDown={handleSearchInputKeyDown}
                      placeholder="Search title, artist, or genre"
                      className={searchInputClassName}
                      aria-label="Search mixes"
                      tabIndex={isMobileSearchOpen ? 0 : -1}
                    />
                    <button
                      type="button"
                      aria-label={searchValue ? "Clear search" : "Close search"}
                      onClick={handleSearchDismiss}
                      className="absolute top-1/2 right-3 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
                      tabIndex={isMobileSearchOpen ? 0 : -1}
                    >
                      <X className="size-4" />
                    </button>
                  </div>

                  <button
                    type="button"
                    className={`absolute inset-0 rounded-full bg-muted/50 p-2 transition-all hover:bg-muted ${
                      isMobileSearchOpen
                        ? "pointer-events-none opacity-0"
                        : "opacity-100"
                    }`}
                    onClick={handleSearchButtonClick}
                    aria-label="Search mixes"
                    aria-controls={mobileSearchId}
                    aria-expanded={isMobileSearchOpen}
                    tabIndex={isMobileSearchOpen ? -1 : 0}
                  >
                    <Search className="size-6 text-foreground" />
                  </button>
                </div>
              </div>
            ) : null}

            <button
              type="button"
              onClick={handleThemeToggle}
              className="rounded-full p-2 transition-colors bg-muted/50 hover:bg-muted"
              aria-label={isMounted ? themeToggleLabel : "Toggle theme"}
            >
              <SunMedium className="hidden size-6 dark:block text-foreground" />
              <Moon className="size-6 dark:hidden text-foreground" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}

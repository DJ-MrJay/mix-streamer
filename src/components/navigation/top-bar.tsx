"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Moon, Search, SunMedium, X } from "lucide-react";

import AppImage from "@/components/ui/app-image";
import { Input } from "@/components/ui/input";
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
};

export default function TopBar({
  searchValue = "",
  onSearchValueChange,
}: TopBarProps) {
  const searchEnabled = typeof onSearchValueChange === "function";
  const [theme, setTheme] = useState<AppTheme>("dark");
  const [isMounted, setIsMounted] = useState(false);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);
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
    if (isMobileSearchOpen) {
      mobileSearchRef.current?.focus();
    }
  }, [isMobileSearchOpen]);

  const handleThemeToggle = () => {
    const nextTheme: AppTheme = theme === "dark" ? "light" : "dark";
    applyThemeToDocument(nextTheme);
    persistTheme(nextTheme);
    setTheme(nextTheme);
  };

  const handleSearchButtonClick = () => {
    if (!searchEnabled) {
      return;
    }

    if (window.matchMedia("(min-width: 640px)").matches) {
      desktopSearchRef.current?.focus();
      return;
    }

    setIsMobileSearchOpen(true);
  };

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
    if (!searchValue) {
      return;
    }

    onSearchValueChange?.("");
  };

  const searchInputClassName =
    "h-10 rounded-full border-0 bg-card/75 pr-10 pl-11 text-foreground shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)] backdrop-blur-sm placeholder:text-muted-foreground focus-visible:ring-ring/60";

  const themeToggleLabel =
    theme === "dark" ? "Switch to light mode" : "Switch to dark mode";

  return (
    <header className="sticky top-0 z-30 bg-background/90 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-4 py-3">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3"
            aria-label="Go to home"
          >
            <div className="relative flex size-11 items-center justify-center overflow-hidden bg-card/80 shadow-[0_10px_25px_rgba(0,0,0,0.18)]">
              <AppImage
                src="/djmrjay-logo-light.svg"
                alt=""
                width={44}
                height={44}
                unoptimized
                className="hidden dark:block"
              />
              <AppImage
                src="/djmrjay-logo-dark.svg"
                alt=""
                width={44}
                height={44}
                unoptimized
                className="block dark:hidden"
              />
            </div>
          </Link>

          {searchEnabled && (
            <div className="relative ml-auto hidden w-full max-w-sm sm:block">
              <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                ref={desktopSearchRef}
                value={searchValue}
                onChange={(event) => onSearchValueChange?.(event.target.value)}
                placeholder="Search title, artist, or description"
                className={searchInputClassName}
                aria-label="Search mixes"
              />
              {searchValue ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => onSearchValueChange?.("")}
                  className="absolute top-1/2 right-3 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
                >
                  <X className="size-4" />
                </button>
              ) : null}
            </div>
          )}

          <div className="ml-auto flex items-center gap-2 sm:ml-0">
            <div
              onClick={handleThemeToggle}
              className="cursor-pointer"
              aria-label={isMounted ? themeToggleLabel : "Toggle theme"}
            >
              <SunMedium className="hidden size-6 dark:block text-foreground" />
              <Moon className="size-6 dark:hidden text-foreground" />
            </div>

            {searchEnabled ? (
              <Search
                className="text-foreground cursor-pointer"
                onClick={handleSearchButtonClick}
                aria-label="Search mixes"
                aria-controls={mobileSearchId}
                aria-expanded={isMobileSearchOpen}
              />
            ) : null}
          </div>
        </div>

        {searchEnabled && isMobileSearchOpen ? (
          <div id={mobileSearchId} className="relative sm:hidden">
            <Search className="pointer-events-none absolute top-1/2 left-4 size-4 -translate-y-1/2" />
            <Input
              ref={mobileSearchRef}
              value={searchValue}
              onChange={(event) => onSearchValueChange?.(event.target.value)}
              placeholder="Search title, artist, or description"
              className={searchInputClassName}
              aria-label="Search mixes"
            />
            <button
              type="button"
              aria-label={
                searchValue ? "Clear search and close" : "Close search"
              }
              onClick={closeMobileSearch}
              className="absolute top-1/2 right-3 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-full text-muted-foreground transition hover:bg-muted/70 hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
        ) : null}
      </div>
    </header>
  );
}

# AGENTS.md

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Project Overview

Mix Streamer is a mobile-first DJ mix streaming platform built with:

- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase (database)
- Google Drive (audio storage)
- Zustand (global player state)

The app allows users to browse, search, and stream DJ mixes with a persistent player.

---

## Core Architecture

### Audio Flow

Google Drive → `/api/stream/[id]` → HTMLAudioElement → Zustand store → PlayerBar

- All playback is controlled through `use-player.ts`
- Only one audio instance must exist at a time
- Audio must be triggered from user gestures for mobile compatibility

---

## Data Flow

- Mix metadata is stored in Supabase (`public.mixes`)
- Tracklists are stored in `public.mix_tracks`
- Audio files are stored in Google Drive
- Metadata is enriched via ingestion scripts

---

## Critical Files

Do not modify these without understanding their role:

- `src/hooks/use-player.ts` → global audio engine
- `src/components/player/player-bar.tsx` → persistent UI player
- `src/app/api/stream/[id]/route.ts` → streaming endpoint
- `src/lib/google-drive.ts` → Drive integration
- `src/lib/supabase.ts` → client queries
- `src/lib/supabase-admin.ts` → ingestion/admin writes

---

## Mobile Constraints (CRITICAL)

- Audio must be triggered from a direct user gesture
- `audio.play()` must be awaited and error-handled
- Do not autoplay on mount
- Do not create multiple audio instances

---

## Styling Rules

- Dark theme is default
- Use theme-safe Tailwind classes:
  - `bg-background`
  - `bg-card`
  - `text-foreground`
  - `text-muted-foreground`
  - `border-border`

---

## Safety Rules

Agents must NOT:

- Expose `SUPABASE_SERVICE_ROLE_KEY` in client code
- Break streaming endpoint behaviour
- Introduce multiple audio instances
- Block mobile playback
- Commit `.env.local`

---

## Summary

This project is:

- Audio-first
- Mobile-first
- Data-driven

# Mix Streamer

A mobile-first DJ mix streaming platform built with Next.js, Supabase, and Google Drive.

## Stack
- Next.js App Router
- TypeScript
- Tailwind CSS + shadcn/ui
- Supabase
- Google Drive API
- Zustand

## Core flow
- Mixes stream from Google Drive through `/api/stream/[id]`.
- Playback is handled by a single global audio engine.
- Search, home sections, and detail pages all read from `public.mixes`.

## Setup
1. Install dependencies with `pnpm install`.
2. Run the dev server with `pnpm dev`.

## Required environment
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `MIX_METADATA_SYNC_TOKEN`

## Drive importer
Use `/admin/metadata` to import new audio files from Google Drive into Supabase.

Importer behavior:
- reads from `GOOGLE_DRIVE_AUDIO_FOLDER_ID` or falls back to `GOOGLE_DRIVE_FOLDER_ID`
- skips rows whose `drive_file_id` already exists
- generates slugs for newly inserted rows
- can publish imported rows immediately
- can run metadata sync for the new rows in the same action

## Metadata sync
The admin page also includes a metadata backfill tool for existing rows. It reads
embedded metadata from the Drive audio file, uploads cover art to Supabase
Storage, and updates the mix record.

## Database notes
Recent schema changes live in `supabase/migrations/` and include:
- metadata tracking fields on `public.mixes`
- `drive_modified_at` for Drive-aware recency sorting
- the `mix-covers` public storage bucket for extracted artwork

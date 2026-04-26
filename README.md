# 🎧 Mix Streamer

A modern, mobile-first DJ mix streaming platform built with Next.js, Supabase, and Google Drive.

## 🚀 Features
- Stream DJ mixes directly from Google Drive
- Persistent global player across pages
- Responsive, mobile-first design
- Real-time search and filtering
- Metadata ingestion pipeline
- Dark theme UI

## 🏗️ Tech Stack
- Next.js (App Router)
- TypeScript
- Tailwind CSS + shadcn/ui
- Zustand
- Supabase
- Google Drive API

## ⚙️ Setup

### Install dependencies
pnpm install

### Run development server
pnpm dev

## 🗄️ Database Schema
See Supabase setup in project docs.

## 📡 Streaming Architecture
Google Drive → API Route → Audio Element

## 📥 Ingestion Pipeline
pnpm ingest:mixes

## 📱 Mobile Support
Supports Android Chrome and iOS Safari with gesture-safe playback.

## 🚧 Roadmap
- Queue system
- Tracklist support
- Waveform visualisation
- PWA support

## 👨‍💻 Author
Jonah Wambua

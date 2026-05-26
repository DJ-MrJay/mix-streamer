<a name="readme-top"></a>

<div align="center">

  <img src="public/djmrjay-logo-dark.svg" alt="DJ Mr. Jay Mixtapes logo" width="140" height="auto" />
  <br/>

  # Mix Streamer

  A mobile-first DJ mix streaming platform.

</div>

# Table of Contents

- [About the Project](#about-project)
  - [Built With](#built-with)
    - [Tech Stack](#tech-stack)
    - [Key Features](#key-features)
  - [Live Demo](#live-demo)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Setup](#setup)
  - [Environment variables](#environment-variables)
  - [Install](#install)
  - [Usage](#usage)
  - [Run tests](#run-tests)
  - [Deployment](#deployment)
  - [Deploying on cPanel](#deploying-on-cpanel)
- [Admin tools](#admin-tools)
- [Author](#authors)
- [Future Features](#future-features)
- [Contributing](#contributing)
- [Show your support](#support)
- [Acknowledgements](#acknowledgements)
- [FAQ](#faq)

# About the Project <a name="about-project"></a>

**Mix Streamer** is a mobile-first web app for browsing, searching, and streaming [DJ Mr. Jay Mixtapes](https://dj.mrjay.co.ke). Mix metadata lives in Supabase, audio and video files are served from Google Drive through a secure streaming API, and playback is handled by a single persistent player bar.

## Built With <a name="built-with"></a>

- **Languages:** TypeScript, HTML, CSS
- **Framework:** [Next.js](https://nextjs.org/) (App Router)
- **UI:** [Tailwind CSS](https://tailwindcss.com/) + [shadcn/ui](https://ui.shadcn.com/)
- **Database:** [Supabase](https://supabase.com/)
- **Storage & streaming:** Google Drive API
- **State:** [Zustand](https://zustand.docs.pmnd.rs/)

### Tech Stack <a name="tech-stack"></a>

<details>
  <summary>Client</summary>
  <ul>
    <li><a href="https://react.dev/">React</a></li>
    <li><a href="https://nextjs.org/">Next.js</a></li>
    <li><a href="https://zustand.docs.pmnd.rs/">Zustand</a> (global player)</li>
    <li><a href="https://motion.dev/">Motion</a></li>
  </ul>
</details>

<details>
  <summary>Server & data</summary>
  <ul>
    <li><a href="https://supabase.com/">Supabase</a> (<code>public.mixes</code>, <code>public.mix_tracks</code>)</li>
    <li><a href="https://developers.google.com/drive">Google Drive API</a></li>
    <li><a href="https://www.npmjs.com/package/music-metadata">music-metadata</a> (admin metadata sync)</li>
  </ul>
</details>

### Key Features <a name="key-features"></a>

- **Home discovery** — Curated sections (latest additions, video mixes, tribute mixes, genre collections, and more)
- **Archive browsing** — Dedicated audio and video mix listing pages
- **Global search** — Search by title, artist, genre, description, and tracklist
- **Persistent player** — One audio instance, mobile-friendly gesture-based playback
- **Mix detail pages** — Tracklists, cover art, share actions, and audio/video version toggles
- **Admin ingestion** — Import new mixes from Google Drive and backfill metadata from file tags

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Live Demo <a name="live-demo"></a>

- [https://dj.mrjay.co.ke](https://dj.mrjay.co.ke)

To deploy your own instance, see [Deployment](#deployment) and set `NEXT_PUBLIC_SITE_URL` to your production domain for correct share links and metadata.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started <a name="getting-started"></a>

To get a local copy up and running, follow these steps.

### Prerequisites

In order to run this project you need:

- [Node.js](https://nodejs.org/) (LTS recommended)
- [pnpm](https://pnpm.io/)
- A [Supabase](https://supabase.com/) project
- A Google Cloud service account with Drive API access to your mix folders
- A code editor such as [VS Code](https://code.visualstudio.com/) or [Cursor](https://cursor.com/)
- A modern browser (Chrome, Firefox, Safari, or Edge)

### Setup

Clone this repository to your desired folder:

```sh
git clone https://github.com/DJ-MrJay/mix-streamer.git
cd mix-streamer
```

### Environment variables

Create a `.env.local` file in the project root (never commit it). Required variables:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key (client) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server/admin only) |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | Google service account email |
| `GOOGLE_PRIVATE_KEY` | Google service account private key |
| `MIX_METADATA_SYNC_TOKEN` | Secret token for admin metadata API routes |

Optional variables:

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SITE_URL` | Canonical site URL for metadata and sharing |
| `GOOGLE_DRIVE_FOLDER_ID` | Default Drive folder for audio imports |
| `GOOGLE_DRIVE_AUDIO_FOLDER_ID` | Audio-only Drive folder (overrides default when set) |
| `GOOGLE_DRIVE_VIDEO_FOLDER_ID` | Video mix Drive folder |
| `GOOGLE_DRIVE_MEDIA_FOLDER_ID` | Combined media folder fallback |
| `SUPABASE_MIX_ART_BUCKET` | Storage bucket for extracted cover art (default: `mix-covers`) |

Apply database migrations from `supabase/migrations/` to your Supabase project before importing mixes.

### Install

Install dependencies:

```sh
pnpm install
```

### Usage

Run the development server:

```sh
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Run tests

Lint the codebase:

```sh
pnpm lint
```

### Deployment

This project uses Next.js `output: "standalone"` (see [`next.config.ts`](next.config.ts)) for a self-contained production bundle suitable for Node.js hosts.

Build and start locally:

```sh
pnpm build
pnpm start
```

Set all required environment variables on your host before deploying. For cPanel-specific steps, see [Deploying on cPanel](#deploying-on-cpanel).

### Deploying on cPanel <a name="deploying-on-cpanel"></a>

#### 1. Confirm cPanel support

In cPanel, check for either:

- **Software → Application Manager**
- **Software → Setup Node.js App**

You need **Node.js 20.9+** because this app uses Next.js 16. If your host only supports PHP or static hosting, this app will not deploy correctly on that cPanel account.

#### 2. Prepare the app

`next.config.ts` should include standalone output (already configured):

```ts
const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    // remotePatterns, etc.
  },
};
```

Build locally with production `NEXT_PUBLIC_*` values in `.env.local` (they are baked into the client bundle at build time):

```sh
pnpm install
pnpm build
```

Copy static assets into the standalone output.

**macOS / Linux:**

```sh
cp -r public .next/standalone/
mkdir -p .next/standalone/.next
cp -r .next/static .next/standalone/.next/
```

**Windows (PowerShell):**

```powershell
pnpm install
pnpm build
Copy-Item -Recurse public .next\standalone\public
New-Item -ItemType Directory -Force .next\standalone\.next
Copy-Item -Recurse .next\static .next\standalone\.next\static
```

#### 3. Add a cPanel startup file

Inside `.next/standalone`, create `app.js`:

```js
require("./server.js");
```

cPanel/Passenger commonly looks for `app.js`; this wrapper starts Next.js’s generated server.

#### 4. Upload to cPanel

Zip the **contents** of `.next/standalone` and upload them outside `public_html`, for example:

```txt
/home/yourcpaneluser/mix-streamer
```

The extracted folder should contain:

```txt
app.js
server.js
package.json
.next/
public/
node_modules/
```

#### 5. Add environment variables

In cPanel’s Node app settings, add:

```txt
NODE_ENV=production
NEXT_PUBLIC_SITE_URL=https://yourdomain.com
SITE_URL=https://yourdomain.com

NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...

GOOGLE_SERVICE_ACCOUNT_EMAIL=...
GOOGLE_PRIVATE_KEY=...

GOOGLE_DRIVE_AUDIO_FOLDER_ID=...
GOOGLE_DRIVE_VIDEO_FOLDER_ID=...
MIX_METADATA_SYNC_TOKEN=...
```

For `GOOGLE_PRIVATE_KEY`, use escaped newlines:

```txt
-----BEGIN PRIVATE KEY-----\nabc123...\n-----END PRIVATE KEY-----\n
```

**Important:** `NEXT_PUBLIC_*` values are embedded in the browser bundle during `pnpm build`, so use production values when building.

#### 6. Register the app in cPanel

In **Application Manager** or **Setup Node.js App**:

| Setting | Value |
| --- | --- |
| Node version | `20` or `22` |
| Application mode | Production |
| Application root/path | `mix-streamer` (or your folder name) |
| Application URL | `/` for the full domain, or your subdomain path |
| Startup file | `app.js` |
| Domain | Your main domain or subdomain |

Deploy, then restart the app.

#### 7. Test

Visit:

```txt
https://yourdomain.com
https://yourdomain.com/audiomixes
https://yourdomain.com/videomixes
```

Play an audio mix to confirm `/api/stream/[id]` works.

**If CSS or images are missing**, confirm these paths exist after copy:

```txt
.next/standalone/public
.next/standalone/.next/static
```

**If the app crashes**, check your host logs, for example:

```txt
/home/yourcpaneluser/mix-streamer/logs/
```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Admin tools <a name="admin-tools"></a>

Visit `/admin/metadata` (with a valid `MIX_METADATA_SYNC_TOKEN`) to:

- **Import from Drive** — Read audio/video files from configured Drive folders, insert new rows into `public.mixes`, generate slugs, and optionally publish immediately
- **Sync metadata** — Read embedded tags from Drive files, upload cover art to Supabase Storage, and update mix records

Importer behavior:

- Skips rows whose `drive_file_id` already exists
- Uses `GOOGLE_DRIVE_AUDIO_FOLDER_ID` or falls back to `GOOGLE_DRIVE_FOLDER_ID` for audio
- Uses `GOOGLE_DRIVE_VIDEO_FOLDER_ID` for video when configured

Recent schema changes live in `supabase/migrations/` (metadata fields, `drive_modified_at`, `mix-covers` bucket, video mix support, and scoped slugs by media type).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Author <a name="authors"></a>

**DJ Mr. Jay (Jonah Wambua)**

- Website: [mrjay.co.ke](https://mrjay.co.ke/)
- LinkedIn: [jonah-wambua](https://www.linkedin.com/in/jonah-wambua/)
- GitHub: [DJ-MrJay](https://github.com/DJ-MrJay)
- X: [@dj_mrjay](https://x.com/dj_mrjay)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Future Features <a name="future-features"></a>

- User playlists and favorites
- Offline listening (PWA)
- Expanded analytics for popular mixes and search terms
- Automated tracklist enrichment

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributing <a name="contributing"></a>

Contributions, issues, and feature requests are welcome.

Feel free to check the [issues page](https://github.com/DJ-MrJay/mix-streamer/issues).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Show your support <a name="support"></a>

Give this project a star if you like it.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Acknowledgements <a name="acknowledgements"></a>

- [Supabase](https://supabase.com/) for database and storage
- [Next.js](https://nextjs.org/) and the React ecosystem
- Listeners and supporters of **DJ Mr. Jay Mixtapes**

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## FAQ <a name="faq"></a>

- **How does audio streaming work?**

  Google Drive files are proxied through `/api/stream/[id]`, then played by a single `HTMLAudioElement` managed in `src/hooks/use-player.ts` and surfaced in the player bar.

- **Why does playback require a tap on mobile?**

  Mobile browsers block autoplay without a user gesture. The player always starts playback from an explicit user action (play button or card tap).

- **Can a mix appear in more than one home section?**

  No. Home sections use a first-claim model: each mix is assigned to at most one section per page load.

- **Where is mix metadata stored?**

  Titles, artists, genres, slugs, and cover URLs live in Supabase (`public.mixes`). Tracklists are stored in `public.mix_tracks` with fallbacks in `src/data/tracklists.ts`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

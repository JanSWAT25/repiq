# RepIQ — Daily Calisthenics Hypertrophy App

Evidence-based bodyweight training with CV form tracking, Google Sheets logging, and Duolingo-style gamification.

## Stack

- **Next.js 14+** (App Router) — PWA
- **Tailwind CSS + shadcn/ui** — UI
- **Zustand + Dexie** — State + local persistence
- **MediaPipe Tasks-Vision** — Pose detection (Sprint 3)
- **Google Sheets API** — Data logging via service account
- **Framer Motion + Howler** — Gamification animations + sound
- **Vercel** — Hosting

## Getting Started

```bash
# Install dependencies
npm install

# Copy env template and fill in values
cp .env.example .env.local

# Run dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

| Variable | Description |
|---|---|
| `GOOGLE_SHEETS_CLIENT_EMAIL` | Service account email from GCP |
| `GOOGLE_SHEETS_PRIVATE_KEY` | Private key from service account JSON |
| `GOOGLE_SHEETS_SPREADSHEET_ID` | ID from the Google Sheet URL |

## Sprint Plan

- **Sprint 0** ✅ Scaffold, Sheets API, stores, PWA manifest
- **Sprint 1** — Workout generator, manual logging, Sheets sync
- **Sprint 2** — Gamification (streak/XP/badges), PWA install
- **Sprint 3** — MediaPipe CV rep counter + form scoring
- **Sprint 4** — Polish, Playwright e2e, Vercel production deploy

# PlaceLens  AI — Frontend

A Next.js 14 (App Router) + TypeScript + Tailwind CSS + shadcn/ui frontend for PlaceLens  AI, an AI-powered
resume and job-matching copilot. This repo is **frontend only** — every screen runs on local dummy data with
no backend, no API routes, and no database.

## Stack

- **Next.js 14** (App Router, `app/` directory)
- **TypeScript**
- **Tailwind CSS** with a custom dark design system (tokens in `app/globals.css` / `tailwind.config.ts`)
- **shadcn/ui**-style components (hand-rolled in `components/ui`, built on Radix primitives)
- **lucide-react** icons
- **Geist / Geist Mono** fonts via `next/font/google`

## Getting started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects straight to `/login`.

## Pages

| Route                  | Description                                              |
|-------------------------|-----------------------------------------------------------|
| `/login`                | Sign in (dummy auth, any input logs you in)               |
| `/register`             | Create account (dummy auth)                                |
| `/dashboard`            | Overview: stats, recent activity, latest ATS score        |
| `/resume-upload`        | Drag-and-drop resume uploader (simulated) + resume history |
| `/ats-report`           | ATS score breakdown, issues, and strengths                |
| `/jd-matcher`           | Paste a job description, get a simulated match score       |
| `/skill-gap`            | Skill readiness vs. target role, with recommendations       |
| `/eligibility-checker`  | Check eligibility against role requirements                |
| `/profile`              | Editable profile, skills, and experience                   |

## Notes

- All data lives in `lib/dummy-data.ts` — edit it to change what every page displays.
- Every interactive element (uploads, matches, eligibility checks, profile edits) is wired to local React
  state, so the app feels alive without any server.
- This project intentionally contains **no backend code** (no FastAPI, no PostgreSQL, no API routes) — it's
  meant to be pointed at a real API later.

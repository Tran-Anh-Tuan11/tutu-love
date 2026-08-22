# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## What this is

TuTu & Love — a private journal/companion web app for exactly two people ("Anh"/"Em"), with face+voice login, twice-daily "check-in" phrases, a streak system, a shared to-do list, period tracking, and special-day reminders. Next.js 16 (App Router) + Prisma 6 + Postgres (Neon), deployed on Vercel.

## Commands

```bash
npm install          # also runs `prisma generate` via postinstall
npm run dev          # Turbopack dev server, http://localhost:3000
npm run build
npm run lint         # eslint (flat config, next/core-web-vitals + next/typescript)
npx tsc --noEmit     # type-check (no separate `test` script — no test suite exists)
```

Prisma (schema lives in `prisma/schema.prisma`, uses `prisma.config.ts` so it does **not** read `.env` itself for the CLI — the CLI already has `DATABASE_URL` via `dotenv/config` imported in `prisma.config.ts`):

```bash
npx prisma migrate dev --name <name>   # create+apply a migration against DATABASE_URL
npx prisma generate                    # regenerate the client (also runs on every npm install)
npx prisma db execute --stdin --schema prisma/schema.prisma   # run raw SQL (pipe SQL via stdin)
```

There is one Postgres database (Neon) shared by local dev and production — `DATABASE_URL` in `.env` points at the same real database Vercel uses. **Treat data in it as real, not disposable**: the app has exactly one "nam" and one "nu" `User` row for the two real people using it. Don't run destructive SQL (`DELETE FROM "User"`, full-table wipes) without checking what's actually in the table first.

## Environment variables (`.env`, gitignored)

- `DATABASE_URL` — Postgres/Neon connection string.
- `SETUP_KEY` — required to enroll a new face via `/login`'s "Cài đặt lần đầu" tab.
- `SESSION_SECRET` — HMAC key signing the session cookie (`lib/session.ts`).

Same three vars must be set in Vercel's project settings for production; values there should differ from local. Vercel auto-deploys `main` (no separate branch config).

## Architecture

**Auth has no passwords.** A `User` row's id is always the literal string `"nam"` or `"nu"` (fixed 2-person roles, see `role` field in `prisma/schema.prisma`) — there is no signup/username flow. Login (`/login`, `app/login/page.tsx`) works by: continuously scanning the camera in the background (`components/FaceCapture.tsx`'s `onFrame` prop, no capture button needed) while the user speaks/types their fixed love-phrase (`lib/streak.ts`'s `LOVE_PHRASE` map — `"anh yêu em"` / `"em yêu anh"`). `POST /api/auth/verify` finds the closest enrolled face by Euclidean distance (`lib/faceMatch.ts`, threshold 0.5) and only issues a session if the phrase also matches. A successful login also immediately records a check-in (`lib/checkin.ts`'s `recordCheckIn`) — the daily "lượt mở đầu ngày" doesn't require a separate action. `/api/auth/verify` is reused (without `phrase`) by `StreakCard`'s face-reverify step before streak repair, where it just re-establishes the session without touching check-in.

**Auth state is a single context, not per-component fetches.** `lib/useMe.tsx` exports `MeProvider` (mounted once in the root `app/layout.tsx`) and `useMe()`. Do not add a second independent `fetch("/api/auth/me")` anywhere — everything (Header, the `(app)` layout's redirect guard, every page, `CheckInCard`) should read from this shared context, or client navigation will feel like a full reload again (this was a real perf bug, already fixed once).

**All business dates/times are pinned to Vietnam (UTC+7), never server-local time.** `lib/date.ts` computes everything (`todayKey`, `isAfter18h`, `endOfTodayLocal`, `addDays`, `daysBetween`) via a fixed `+7h` offset read through `getUTC*`, specifically because Vercel's runtime is UTC while a Vietnam-based dev machine is not — using `new Date().getHours()` directly was a real production bug (the "check-in cuối ngày chỉ mở sau 18h" gate was actually gating on 18h UTC = 1am VN). Any new date/time logic must go through `lib/date.ts`'s helpers, not raw `Date` getters/setters — and downstream code that consumes a `parseDateKey()`/`todayKey()` result must not call local Date getters on it either (see `lib/specialDays.ts`'s `ymdOf` helper, which parses "YYYY-MM-DD" strings directly instead).

**Route structure**: `app/(app)/*` (dashboard `/`, `/viec`, `/chu-ky`, `/lich`, `/ky-niem`) is a route group behind `app/(app)/layout.tsx`, which client-side redirects to `/login` when `useMe()` resolves to logged-out. `app/login/page.tsx` sits outside that group (no guard). API routes under `app/api/**/route.ts` are plain Next.js Route Handlers — no separate backend.

**Data model** (`prisma/schema.prisma`): `User` (id "nam"|"nu"), `CheckIn` (one row per user per day, `morningDone`/`eveningDone`), `Streak` (per-user, lazy-recomputed break detection in `lib/streak.ts`), `Todo` (scope `SHARED`/`NAM`/`NU`), `Settings` (singleton row id=1, holds `relationshipStart` + background color), `PeriodLog`, `SpecialDay`, `DismissedReminder`. Streak only advances when both `morningDone` and `eveningDone` are true for a day (`applyDailyCompletion`).

**UI wording vs. internal ids — don't conflate them.** Internally, ids/roles/API scope params stay `"nam"`/`"nu"`/`"NAM"`/`"NU"`/`"chung"` (DB columns, `LOVE_PHRASE` keys, route params) — never rename these, it's a live production schema. But all **user-facing Vietnamese text** uses "Anh"/"Em"/"Chúng ta" instead of "Nam"/"Nữ"/"Chung" (a deliberate rebrand). When adding new UI copy, follow the existing convention rather than the internal id names.

**Prisma generator is deliberately `prisma-client-js` with default output** (not the newer `prisma-client` generator with a custom `output` path). That newer generator isn't in Next.js's `serverExternalPackages` auto-list, so its native query engine binary didn't get bundled into Vercel's serverless functions — every DB call 500'd in production. Don't switch generators without re-verifying a real Vercel deploy.

**Face descriptors** are 128-number arrays from `face-api.js`, computed entirely client-side (`lib/faceModels.ts` loads models from `public/models/`, fetched from the `justadudewhohacks/face-api.js-models` community repo since the npm package ships no weights). The server only ever stores/compares the numeric descriptor (`User.faceDescriptor`, JSON-stringified) — never an image.

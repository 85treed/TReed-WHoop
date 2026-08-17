# TReed-WHoop

A personal WHOOP dashboard: recovery, strain, sleep, and workouts, pulled live
from your own WHOOP account via the official [WHOOP API](https://developer.whoop.com).

Built with Next.js (App Router, TypeScript), Tailwind CSS, and Recharts. Tokens
are stored locally in a SQLite file — nothing is sent anywhere except WHOOP's API.

## 1. Register a WHOOP developer app

1. Go to the [WHOOP Developer Dashboard](https://developer.whoop.com) and create an app.
2. Add a redirect URI. For local development use:
   `http://localhost:3000/api/auth/callback`
3. Request these scopes: `read:recovery`, `read:cycles`, `read:sleep`,
   `read:workout`, `read:profile`, `read:body_measurement`, `offline`
   (`offline` is required to receive a refresh token).
4. Copy the generated **Client ID** and **Client Secret**.

## 2. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in:

- `WHOOP_CLIENT_ID` / `WHOOP_CLIENT_SECRET` — from step 1
- `WHOOP_REDIRECT_URI` — must exactly match what you registered
- `SESSION_SECRET` — a random 32+ character string, e.g. `openssl rand -base64 32`

## 3. Install and run

```bash
npm install
npm run dev
```

Open http://localhost:3000, click **Connect WHOOP account**, and authorize.
You'll land on the dashboard with your latest recovery, strain, sleep, and
recent workouts, plus a trend chart across your most recent cycles.

## How it works

- `src/lib/whoop.ts` — OAuth2 authorization-code flow and typed wrappers
  around the WHOOP v2 endpoints (cycle, recovery, sleep, workout, profile,
  body measurement), with automatic access-token refresh.
- `src/lib/db.ts` — SQLite (`better-sqlite3`) storage for WHOOP tokens, keyed
  by WHOOP user id. File location is set by `DATABASE_PATH` (defaults to
  `./data/whoop.db`).
- `src/lib/session.ts` — encrypted, HTTP-only session cookie (`iron-session`)
  that just holds your WHOOP user id; no data lives in the cookie itself.
- `src/app/api/auth/*` — login (redirect to WHOOP), callback (exchange code,
  store tokens, fetch profile), logout (revoke locally-stored tokens).
- `src/app/page.tsx` — the dashboard itself; fetches fresh data from WHOOP on
  every load (no caching), so it's always current.

## Notes

- This is a single-user app: whoever completes the WHOOP OAuth flow becomes
  "the" user for that SQLite file. It's not built for multi-tenant use.
- `npm audit` will flag a few advisories inherited from Next.js's optional
  `sharp`/image-optimization dependency, which this app doesn't use (no
  `next/image`). Run `npm audit fix --force` to move to Next 16 if you want
  them cleared, but that's a major-version bump and untested here.
- Deploying anywhere other than local: `DATABASE_PATH` needs to point at
  persistent disk (SQLite won't survive on most serverless platforms — a
  small VM, Fly.io, Railway, or similar with a persistent volume works well).

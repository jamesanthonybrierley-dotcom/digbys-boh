# Digbys BOH

Back-of-house scheduling, open shifts, and time tracking for Digbys Events staff. Built as a private web app that installs like a native app on any phone (PWA) — no App Store required.

## Features

- **Events** — every job on the books: client, venue, date, times, guest count, notes.
- **Scheduling** — assign named staff to shifts, or leave a shift open for anyone qualified to claim from their phone. First to claim gets it; the assigning admin is notified.
- **Shift claim/release** — staff can release a shift they can no longer work, putting it back up for grabs.
- **Private hourly rates** — each person's rate is visible only to them and to admins. Other staff never see it, including on the staff directory and schedule.
- **Clock in / clock out** — one tap from a shift, with a live-running timer and a personal history of past entries.
- **Timesheets & payroll export** — admins get a weekly view of hours and pay per person, plus a CSV export for payroll.
- **Time off requests** — staff request time off; admins approve or decline, with notifications either way.
- **Admin-controlled accounts** — admins create logins, set temporary passwords, reset passwords, and deactivate leavers. Everyone sets their own password on first sign-in.
- **Notifications** — an in-app bell for open shifts, claims/releases, and time-off decisions.
- **Installable on any phone** — "Add to Home Screen" on iOS/Android gives it a full-screen app icon, no browser chrome.

## Getting started (local)

Requires Node.js 18.18 or newer, and a Postgres database to point it at. The easiest way to get one for free is [Supabase](https://supabase.com) — create a project there (takes a couple of minutes), then go to **Project Settings → Database → Connection string → URI** and copy the "Transaction pooler" connection string (port 6543).

```bash
npm install
cp .env.example .env
```

Open `.env` and set:
- `DATABASE_URL` — the Supabase connection string you just copied.
- `SESSION_SECRET` — a long random string (used to sign login sessions), e.g. `openssl rand -base64 48`.

Then load some sample data — one admin, four staff, two events with shifts, an open shift, and a time-off request — and start the app:

```bash
npm run db:seed
npm run dev
```

Visit `http://localhost:3000`. Sign in with:

| Role  | Email                        | Password             |
|-------|------------------------------|-----------------------|
| Admin | james@digbysevents.co.uk     | digbys-admin-2026     |
| Staff | ellie@digbysevents.co.uk     | digbys-staff-2026     |
| Staff | tom@digbysevents.co.uk       | digbys-staff-2026     |
| Staff | priya@digbysevents.co.uk     | digbys-staff-2026     |
| Staff | sam@digbysevents.co.uk       | digbys-staff-2026     |

Everyone is asked to set their own password the first time they sign in. To start over with a fresh sample dataset, wipe the tables in your Postgres database and re-run `npm run db:seed` — it won't touch a database that already has real accounts in it.

For a production-style run locally: `npm run build` then `npm run start`.

## Deploying it for real use

**Recommended: Vercel + Supabase.** Supabase hosts the Postgres database; Vercel hosts and runs the app. Both have generous free tiers for a business this size.

1. Push this project to a GitHub repository.
2. Create a [Supabase](https://supabase.com) project (if you haven't already for local dev) and grab the connection string as described above — use it as `DATABASE_URL`.
3. In [Vercel](https://vercel.com), import the GitHub repository as a new project.
4. In the Vercel project's **Settings → Environment Variables**, add `DATABASE_URL`, `SESSION_SECRET`, and `NEXT_PUBLIC_APP_NAME=Digbys BOH`.
5. Deploy. Vercel runs `npm install` and `npm run build` automatically.
6. Run `npm run db:seed` once, locally, with `DATABASE_URL` in your `.env` pointed at the *same* Supabase database Vercel is using, to create the real admin account — or create the first admin account by hand if you'd rather skip the sample data. Either way, delete or change the seeded demo accounts before staff start using it.
7. Point a custom domain at it from the Vercel dashboard if you have one (e.g. `boh.digbysevents.co.uk`).

Any host that runs a Node.js app and can reach a Postgres database works the same way — this pairing is just the simplest to manage day-to-day and matches how the rest of your apps are hosted.

## How the privacy and permissions work

Accounts are either **Admin** or **Staff**. Admins can create/edit/deactivate staff, assign and edit shifts and events, approve or decline time off, reset anyone's password, and see every rate and timesheet. Staff can view their own schedule, claim or release open shifts, clock in/out, request time off, and see only their own rate and hours. There's no public sign-up — every account is created by an admin.

## Security note — before you go live

This app is built on Next.js 14.2.35, the newest release in the 14.x line. `npm audit` flags a batch of high-severity issues that were only fixed in Next.js 16, which is now the current major version — 14.x stopped receiving security backports for these. Worth knowing before this handles real staff data on the open internet:

Most of the flagged issues don't apply to how this app actually uses Next.js — they're in features this app doesn't touch (`next/image` with remote images, Server Actions, custom rewrites, i18n routing, a custom WebSocket server). Everything here goes through explicit API routes with their own validation instead. This app's own build tooling (Tailwind/PostCSS) is already on current, patched versions — the flagged `postcss` issue is a copy bundled inside `next` itself, not something this project controls directly.

The realistic residual risk is around response caching if you ever put a shared cache or CDN in front of the app (e.g. Cloudflare) — don't, until this is upgraded. Vercel's own edge network sits in front of the app either way, but this app doesn't rely on Next's page/data caching for anything sensitive (every page is rendered per-request from the database), so that's a low-risk combination.

The proper fix is upgrading to Next.js 16, which is a real project of its own — Next 15 changed several core APIs to be asynchronous (`cookies()`, and page/route `params`) and 16 builds on that, so it touches most route files rather than being a version-number bump. Worth budgeting time for as dedicated follow-up work, tested thoroughly before replacing this build — not something to do live. Run `npm audit` any time to see the current state.

## Future enhancements worth considering

Roughly in order of likely impact for a business your size:

- **Push notifications** — today's notifications only appear inside the app; real phone push notifications for new open shifts or approved time off would get noticed faster.
- **Manager role** — a permission tier between Staff and Admin, e.g. a supervisor who can manage shifts for one event without seeing payroll.
- **Direct shift swaps** — let two staff privately agree a swap for admin sign-off, instead of releasing to the whole pool.
- **Document/certification storage** — food hygiene certificates, right-to-work documents, etc., with expiry reminders.
- **Payroll export integrations** — direct export to Xero, QuickBooks, or a payroll provider instead of CSV.
- **Geofenced clock-in** — restrict clock-in to when staff are actually at the venue.
- **Live labour-cost budgeting** — a running "cost so far" per event as shifts are worked, not just scheduled cost.
- **Staff ratings/feedback** — a quick post-event rating to track reliability for future assignment.
- **Holiday/leave allowance tracking** — running totals against an annual entitlement, not just a request log.
- **Working Time Regulations warnings** — flag when a schedule would breach UK rest-break or maximum-hours rules.
- **Multi-location support** — useful if Digbys expands beyond one warehouse/base.
- **SMS/email reminders** — a text the morning of a shift.
- **Dark mode** — the app is deliberately a single polished light theme for now.
- **Native app wrapper** — the installable web app covers most of this; a true App Store/Play Store listing is really only worth it if push notifications become a priority.

## Tech notes

Next.js (App Router) with TypeScript, a custom cookie-based login (no third-party auth service), and Postgres (via `pg`, hosted for free on Supabase) as the database. All money is stored in pence and formatted for display, never floated. Times are handled in the Europe/London timezone throughout, including across the GMT/BST clock change, so weekly timesheets always bucket correctly.

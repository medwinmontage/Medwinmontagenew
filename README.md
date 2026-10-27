# Medwin Montage — Freelancing Creative & Digital Services

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind · Prisma · PostgreSQL (Supabase) · deployable on Vercel.

## What is in the app

**Public site** — hero, services, portfolio, packages, FAQ, **Join as Crew**, reviews, footer with clickable phone,
WhatsApp and social icons. Banners (scheduled, optional countdown) sit under the hero. The timed offer is hidden until
a visitor opens it from the gift button.

**Customer portal** (`/account`) — Dashboard, Profile, Bookings, Service History, Quote Requests, Activity, Feedback.
Status flow **Incomplete → Processing → Completed** (or Cancelled / Rejected). Email and phone are read-only.

**Admin** (`/admin/login`) — Dashboard, Content, Services, Portfolio, Packages, Testimonials, FAQ, Event Types,
Bookings, Leads / Service Requests, Quotes, Customers, Banners, SEO Settings, Crew Applications, Reviews / Feedback,
Site Settings.

| Route | Who | Purpose |
|---|---|---|
| `/` | everyone | home page |
| `/join-as-crew` | everyone to read; **crew login/register to apply** | crew application form |
| `/crew` | logged-in crew | crew dashboard: application status timeline, notifications, message to admin (never indexed) |
| `/account` | logged-in customer | customer portal (never indexed) |
| `/admin/*` | admin | admin portal (login at `/admin/login`) |
| `/api/customer/*` | customer | profile, overview, feedback — identity comes from the session cookie only |
| `/api/crew`, `/api/crew/[id]`, `/api/crew/[id]/resume` | public POST / admin | crew applications; resumes are admin-only |
| `/api/auth/crew/register`, `/api/auth/crew/login` | public (rate-limited) | crew accounts (own session cookie, own secret) |
| `/api/notifications` (+ `/message`) | customer / crew / admin | read, mark read, and send a message to the admin — the recipient always comes from the session cookie |
| `/api/admin/notifications`, `/api/admin/recipients` | admin | send a notification to one customer / one crew member / all customers / all crew |
| `/api/videos`, `/api/upload/video[/sign]`, `/uploads/*` | public GET / admin | showreel videos, device uploads, local file serving with Range support |
| `/api/seo`, `/api/feedback`, `/api/banners`, `/api/quotes/[id]` … | admin | management |

## 1. Run it locally (VS Code)

```bash
git clone <your-repo-url> && cd medwin-app
npm install                      # also runs `prisma generate`
cp .env.example .env             # then edit .env (see below)
```

Fill in `.env`:

- `DATABASE_URL` — your Supabase Postgres string (see section 2), or any local Postgres.
- `ADMIN_JWT_SECRET`, `CUSTOMER_JWT_SECRET`, `CREW_JWT_SECRET` — three different long random strings: `openssl rand -base64 48`.
- `MAX_VIDEO_MB` (optional, default 50) — largest video accepted. Supabase's free plan caps a file at 50 MB.
- `SEED_ADMIN_PASSWORD` — pick a real password; it is used once by the seed.
- Leave the `SUPABASE_*` variables empty locally: uploads go to `public/uploads` (banners/logo) and `.private-uploads`
  (resumes), and dashboards refresh by polling.

Create the tables, seed, and start:

```bash
npx prisma validate                       # schema check (needs DATABASE_URL set)
npx prisma migrate dev --name init        # NEW, empty database: creates tables + prisma/migrations/
npm run db:seed                           # admin user, services, packages, FAQ, SEO defaults …
npm run dev                               # http://localhost:3000   ·   admin: /admin/login
```

### Upgrading a database that already has data

This release only **adds** tables and columns (all with defaults — `CrewAccount`, `Notification`, `Video`, `Banner.mobileImageUrl`, `CrewApplication.crewAccountId`), so nothing is dropped.
Applications submitted before this release have no crew account; they stay visible to the admin, and those people simply register to get a dashboard. This repository had no
`prisma/migrations` folder, so for an existing database use:

```bash
npx prisma db push        # shows the planned changes first; none of them delete data
npm run db:seed           # safe to re-run: it only creates rows that are missing
```

Do **not** run `prisma migrate dev` against a database that was created with `db push` — it will offer to reset it.
Old bookings with status `Pending`/`Confirmed` keep working: the app reads them as `Incomplete`/`Processing`
(`src/lib/status.ts`). Optional SQL to rename them for good is at the bottom of `prisma/supabase-setup.sql`.

Production checks:

```bash
npx tsc --noEmit
npm run build
npm start
```

## 2. Supabase setup

1. **Create a project** at supabase.com.
2. **Database URL**: Project Settings → Database → Connection string.
   - Local development and `prisma migrate`/`db push`: the **Session pooler** URI (port 5432) → `DATABASE_URL`.
   - Vercel: the **Transaction pooler** URI (port 6543) with `?pgbouncer=true&connection_limit=1` appended.
3. **Run the SQL** in `prisma/supabase-setup.sql` (SQL Editor) once, after the tables exist. It
   - turns on Row Level Security for every table with no policies, so the public (anon) key can read nothing — the app
     talks to Postgres through Prisma, which is unaffected;
   - creates two storage buckets: `public-media` (public — banners, logo, videos; 50 MB per file; image + mp4/webm/mov types) and `private-files` (private — resumes). **Re-run this script after upgrading** so the bucket accepts videos.
4. **API keys**: Project Settings → API.
   - `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` — the project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the `anon` key (safe in the browser).
   - `SUPABASE_SERVICE_ROLE_KEY` — **server only**. Never prefix it with `NEXT_PUBLIC_`, never commit it.
5. **Realtime**: nothing to switch on. The app uses *Broadcast* channels (`mm-admin`, `mm-public`,
   `mm-customer-<id>`, `mm-crew-<id>`). After a save, the server sends a tiny “something changed” ping; open dashboards hear it and
   re-fetch through the normal authenticated routes. No row data travels over the public channel.

### How live updates behave

| Watching | Updates when |
|---|---|
| Admin pages | a booking, lead, quote, crew application or review arrives or changes |
| Customer portal | the admin changes the status/note of that customer's booking, service or quote |
| Public site | banners, videos, content, services, reviews or SEO change |
| Bell + toast (header on the home page, `/account`, `/crew`; sidebar in admin) | a notification is addressed to that person — admin → customer/crew, customer/crew → admin |

Without Supabase variables the same screens re-check every 20–60 s while the tab is visible, and when you return to the tab.

### Notifications — how they work

- Every notification is a row in `Notification` (`recipientKind` = `admin` | `customer` | `crew`; the admin inbox is shared).
  The text is **never** sent over the realtime channel: the channel only says “something new”, and the browser then
  fetches `/api/notifications` with its own session cookie. So nobody can read someone else's messages by listening in.
- Events create them automatically: new customer/crew account, booking, service request, quote, crew application, review
  (→ admin) and receipts, status changes, admin notes, review decisions, crew status changes (→ the person concerned).
  Admin → **Notifications** sends your own message to one person or everyone, and every inbox item from a customer or
  crew member has a **Reply** button.
- They are one-way messages with a reply button, **not a live chat**. Visitors who have not logged in get no bell
  (there is nobody to address). A signed-in customer/crew member sees the bell on the home page header.
- Without Supabase, the bell re-checks every 15 s (and when you return to the tab).

### Videos

Admin → **Videos**: upload from your device (mp4 / webm / mov), or paste a YouTube, Vimeo or direct `https://…mp4` link.
They appear in the **Showreel** section of the home page and as muted previews in Portfolio cards that have a video link.

- Uploads from the admin go **straight to Supabase Storage** with a short-lived signed URL (Vercel limits request bodies
  to ~4.5 MB). Locally they are saved to `public/uploads/videos` and served by `/uploads/[...path]` (with Range requests).
- **Autoplay is always muted.** Browsers (Chrome, Safari, Firefox) block autoplay with sound; there is no way around this.
  Visitors get a sound button (files) or a “Watch with sound” link (YouTube/Vimeo). Videos loop, play only while on screen,
  and are not downloaded until they scroll into view. With *reduce motion* or *data saver* on, nothing autoplays — a Play
  button is shown instead. iOS Low Power Mode may also block autoplay; the Play button appears then too.
- Use H.264/AAC `.mp4` for the widest compatibility (webm does not play on older iPhones). Keep clips short (≤ 30 s,
  ≤ 10 MB) — it is a showreel, not a streaming site.

### Images always fit the screen

Banners show the **whole** picture (never cropped) over a soft blurred copy of itself, and are never taller than 80 % of the
screen. Admin → Banners has an optional **phone version** for a separate portrait/square design, served only below 640 px.
Images chosen in the admin are resized in the browser first (long edge ≤ 2400 px, ≤ ~3.5 MB), so a 20 MB phone photo works.

## 3. Deploy: GitHub → Vercel

1. Push to GitHub. `.gitignore` already excludes `.env*`, `node_modules`, `.next`, local uploads and `.private-uploads`.
   Run `git status` and confirm no `.env` file is listed before your first commit.
2. Vercel → *Add New Project* → import the repo (framework: Next.js; build `npm run build`).
3. Environment variables (Production **and** Preview):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Supabase transaction-pooler URI (see above) |
   | `ADMIN_JWT_SECRET`, `CUSTOMER_JWT_SECRET`, `CREW_JWT_SECRET` | three different random strings — **required**, the app refuses to sign sessions without them in production |
   | `NEXT_PUBLIC_SITE_URL` | your live address, no trailing slash |
   | `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | from Supabase — **required on Vercel**: its disk is not persistent, so uploads fail without them |
   | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` | for live updates |

4. Create the production tables and seed from your own computer, with the **session-pooler** URL in `.env`:
   `npx prisma migrate deploy` (if you use migrations) or `npx prisma db push`, then `npm run db:seed` once.
5. Deploy. Then log in at `/admin/login`, **change the admin password**, and fill in Admin → Site Settings and
   SEO Settings.
6. Custom domain: add it in Vercel, then set `NEXT_PUBLIC_SITE_URL` to it and redeploy. `admin.yourdomain.com` also
   works: `src/middleware.ts` rewrites any host starting with `admin.` to the admin app.

Note: the rate limiter (`src/lib/rateLimit.ts`) keeps counts in memory per serverless instance, so on Vercel it slows
down abuse but is not a hard guarantee. For a hard limit, back it with Upstash/Redis.

### If the live site shows “Something went wrong” (or “We’ll be right back”)

The page itself cannot say why, so **open `https://your-site/api/health`**. It lists, without showing any secret:
which settings are missing, whether the database is reachable, and which tables are missing — each with the fix.

| `/api/health` says | Fix |
|---|---|
| `DATABASE_URL is missing` / a `*_JWT_SECRET` is missing | Vercel → Settings → Environment Variables (Production), then **Redeploy** |
| `Cannot reach the database server` | Use the Supabase **Transaction pooler** string (port 6543) or Session pooler (5432); check the password (URL-encode symbols) |
| `Tables/columns missing: …` | From your computer, with the Session-pooler URL in `.env`: `npx prisma db push` |
| `The database is empty` | `npm run db:seed` |
| `Prisma engine missing` | Vercel → Deployments → ⋯ → Redeploy → untick “Use existing Build Cache” |

The exact error is also in **Vercel → your project → Logs** (search `[db]`). The public home page now keeps working if an optional
table (videos, reviews, banners …) is missing — it just leaves that section out and logs the reason. The Supabase
pooler flags (`pgbouncer=true&connection_limit=1`) are added automatically when missing (`src/lib/prisma.ts`).

### About the notices in the Vercel build log

This release removes the ones that came from the project: Next.js 14.2.15 “security vulnerability” (now 15.5.28),
`npm audit` findings (now 0), and the deprecated packages `rimraf`, `glob`, `inflight`, `fstream`, `lodash.isequal`, `uuid`
(they all came from the Excel library, which was replaced by a small built-in writer, `src/lib/xlsx.ts`). Two notices remain
and are **not** from this project: `Unknown env config "cache-dir"` (Vercel's own npm setting) and
`install-scripts … not yet covered by allowScripts` (a new npm notice about Prisma's normal install step). Neither affects the build.

## 4. Where each feature lives

- **Status control** — Admin → Bookings / Leads (`BookingsTable`), API `PATCH /api/bookings/[id]`, `/api/leads/[id]`
  (accept only `status` and a customer-visible `adminNotes`). `src/lib/status.ts` holds the status list.
- **Customer privacy** — every customer route calls `requireCustomer()` (`src/lib/session.ts`), which takes the id from
  the signed cookie and re-checks the account. Profile edits use a strict schema (`name`, `company`, `city`, `state`
  only); `email`/`phone` return 403.
- **Feedback** — customers post from the portal; admin approves in Reviews / Feedback; only *Approved* reviews the
  customer allowed to be public appear in the home-page Reviews section. A review can only be attached to the
  customer's own *Completed* booking or service, once.
- **Banners** — Admin → Banners. Stored in UTC; the admin form uses your device's time zone. Shown only while
  enabled and between start and end; the page re-checks every second, so a banner appears/disappears without a reload.
  Links: none / internal (a path on this site) / external (`http(s)://` only — `javascript:` and `data:` are rejected).
- **SEO** — Admin → SEO Settings feeds `src/lib/seo.ts`: title template, description, canonical, Open Graph, Twitter,
  robots, `sitemap.xml`, and JSON-LD (business with location and services, website, FAQ, breadcrumbs). Location and
  service text is written as ordinary sentences — nothing hidden, no generated per-town pages. SEO settings
  prepare the site for search engines; they cannot guarantee any ranking.
- **Contact links** — Admin → Site Settings: phone → `tel:` link, WhatsApp → `https://wa.me/<digits>?text=…` with the
  message “Hi, Need enquiry of services provided by Medwin Montage”, social URLs → real brand icons (orange, only for
  links that are filled in). Booking buttons also use the WhatsApp number from settings.
- **Crew** — public form `/join-as-crew`; Admin → Crew Applications with search, filters, sorting, pagination, status,
  notes and secure resume download. Resume files live in the **private** bucket; the admin route issues a 60-second signed
  link (Supabase) or streams the file (local). File type is decided from the file's bytes, not its name.
- **Crew accounts** — Join as Crew now requires a crew login/register (`CrewGate`, `/api/auth/crew/*`). The application takes
  name and phone from the account (read-only), one application per account, and the server ignores any attempt to send
  status, notes or another account's id. Admin → Crew Applications shows the account email and a **Notify** shortcut.
- **Uploads** — `src/lib/storage.ts` (Supabase Storage when configured, local disk otherwise). Banner/logo images
  accept PNG, JPG, WebP, GIF up to 4 MB; SVG is intentionally not accepted because it can contain scripts.

## 5. Testing — what was and wasn't verified

**Update (Next 15 / crash-proofing):** after moving to Next.js 15.5.28 + React 19 all four browser suites pass (81 + 106 + 170 + 5
checks), including the home page staying up with optional tables missing, a friendly page when the main content cannot be
read, `/api/health` hints, and the Excel export opening in a spreadsheet library with formulas stored as plain text. The real
project builds from a clean `npm ci` with 0 audit findings. Not tested: a real Vercel deployment and a real Supabase database.

**Earlier update (notifications / crew accounts / videos / responsive media):** automated browser tests (Playwright + Chromium, same
in-memory stand-in) pass — 81 + 106 + 170 checks, and the real project's `tsc`, `prisma validate` and `next build` are clean.
The new checks cover: crew register/login/gate, one application per account, tampering refused, crew/customer/admin session
isolation, notifications in all four directions (admin→customer, admin→crew, customer→admin, crew→admin) arriving
live on the home page, `/crew` and the admin panel (verified through the polling path, within ~15 s), unread counts, read
marking, spoofing/XSS/`javascript:` links refused, video link validation, device upload (content sniffing, size limit, auth),
Range requests, muted autoplay while visible and pause when scrolled away, reduce-motion behaviour, deletion removing the
file, banners of five shapes at 320/390/768/1024/1440 px with no overflow and nothing cropped, phone artwork switching at
640 px, and a 23 MB photo being shrunk in the browser before upload.

**Not tested here:** Supabase Realtime (the instant push; only the polling fallback was exercised), Supabase signed
video uploads and the bucket limits, a Vercel deployment, YouTube/Vimeo embeds loading from the real sites (no internet in
the test sandbox), H.264 `.mp4` playback (the test browser has no H.264 — `.webm` was used), iOS Safari / Low Power Mode,
and real phones. Treat the first deployment as the test: upload a 20–40 MB mp4 on the live site, open the home page on
your phone, and send yourself a notification from Admin → Notifications while logged in as a customer in another browser.

### Earlier release

I ran the following in an environment with **no Supabase project and no Postgres**, so database calls were served by an
in-memory stand-in that mimics the Prisma calls this app makes:

- `npx tsc --noEmit` on the real project: clean.
- `npx prisma validate` (with a `DATABASE_URL` set) and `prisma generate`: pass.
- `next build` and `next start` on a copy using the stand-in database; automated browser tests (Playwright, Chromium)
  covered: customer register/login, own-data-only history, email/phone edit refused by the API, status changes from the
  admin appearing in the portal, feedback rules and approval, banner validation / scheduling / timer, crew form rules
  (Fresher/Experienced, server-side checks, resume sniffing, admin-only download), SEO tags / sitemap / robots / JSON-LD,
  tel / WhatsApp / social links, admin authorization, and horizontal-overflow checks on mobile.

**Not verified (needs your environment):** the real Supabase database and migration, Supabase Storage uploads and
signed links, Supabase Realtime broadcasts, and a Vercel deployment. The code for these follows Supabase's documented
REST endpoints, but treat the first deployment as the real test: upload a banner, submit a crew application with a
resume, and change a booking status while the customer page is open.

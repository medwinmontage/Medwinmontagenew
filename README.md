# Medwin Montage — Freelancing Creative & Digital Services

Next.js 14 (App Router) · TypeScript · Tailwind · Prisma · PostgreSQL (Supabase) · deployable on Vercel.

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
| `/join-as-crew` | everyone | crew application form |
| `/account` | logged-in customer | customer portal (never indexed) |
| `/admin/*` | admin | admin portal (login at `/admin/login`) |
| `/api/customer/*` | customer | profile, overview, feedback — identity comes from the session cookie only |
| `/api/crew`, `/api/crew/[id]`, `/api/crew/[id]/resume` | public POST / admin | crew applications; resumes are admin-only |
| `/api/seo`, `/api/feedback`, `/api/banners`, `/api/quotes/[id]` … | admin | management |

## 1. Run it locally (VS Code)

```bash
git clone <your-repo-url> && cd medwin-app
npm install                      # also runs `prisma generate`
cp .env.example .env             # then edit .env (see below)
```

Fill in `.env`:

- `DATABASE_URL` — your Supabase Postgres string (see section 2), or any local Postgres.
- `ADMIN_JWT_SECRET`, `CUSTOMER_JWT_SECRET` — two different long random strings: `openssl rand -base64 48`.
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

This release only **adds** tables and columns (all with defaults), so nothing is dropped. This repository had no
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
   - creates two storage buckets: `public-media` (public — banners and logo) and `private-files` (private — resumes).
4. **API keys**: Project Settings → API.
   - `SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_URL` — the project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` — the `anon` key (safe in the browser).
   - `SUPABASE_SERVICE_ROLE_KEY` — **server only**. Never prefix it with `NEXT_PUBLIC_`, never commit it.
5. **Realtime**: nothing to switch on. The app uses *Broadcast* channels (`mm-admin`, `mm-public`,
   `mm-customer-<id>`). After a save, the server sends a tiny “something changed” ping; open dashboards hear it and
   re-fetch through the normal authenticated routes. No row data travels over the public channel.

### How live updates behave

| Watching | Updates when |
|---|---|
| Admin pages | a booking, lead, quote, crew application or review arrives or changes |
| Customer portal | the admin changes the status/note of that customer's booking, service or quote |
| Public site | banners, content, services, reviews or SEO change |

Without Supabase variables the same screens re-check every 20–60 s while the tab is visible, and when you return to the tab.

## 3. Deploy: GitHub → Vercel

1. Push to GitHub. `.gitignore` already excludes `.env*`, `node_modules`, `.next`, local uploads and `.private-uploads`.
   Run `git status` and confirm no `.env` file is listed before your first commit.
2. Vercel → *Add New Project* → import the repo (framework: Next.js; build `npm run build`).
3. Environment variables (Production **and** Preview):

   | Variable | Value |
   |---|---|
   | `DATABASE_URL` | Supabase transaction-pooler URI (see above) |
   | `ADMIN_JWT_SECRET`, `CUSTOMER_JWT_SECRET` | two different random strings — **required**, the app refuses to sign sessions without them in production |
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
- **Uploads** — `src/lib/storage.ts` (Supabase Storage when configured, local disk otherwise). Banner/logo images
  accept PNG, JPG, WebP, GIF up to 4 MB; SVG is intentionally not accepted because it can contain scripts.

## 5. Testing — what was and wasn't verified

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

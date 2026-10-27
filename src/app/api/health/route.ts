import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { rateLimit, clientKey } from '@/lib/rateLimit';

export const dynamic = 'force-dynamic';

/**
 * Setup check for the site owner: open /api/health after a deploy. It says which settings or tables are missing and what
 * to do about it. It never prints a secret, a connection string or any row data — only yes/no and a short hint.
 */
const long = (v: string | undefined) => !!v && v.length >= 16;

function explain(err: unknown): string {
  const e = err as { code?: string; message?: string };
  const msg = String(e?.message || err);
  if (e?.code === 'P1000') return 'The database rejected the username/password in DATABASE_URL.';
  if (e?.code === 'P1001' || e?.code === 'P1002') return 'Cannot reach the database server. Use the Supabase pooler connection string (Project Settings → Database) and check host and port.';
  if (e?.code === 'P1003') return 'The database name in DATABASE_URL does not exist (Supabase uses "postgres").';
  if (e?.code === 'P1017' || e?.code === 'P2024') return 'Too many or dropped connections. Use the Transaction pooler string (port 6543).';
  if (/prepared statement/i.test(msg)) return 'PgBouncer problem: the Transaction pooler string needs ?pgbouncer=true&connection_limit=1.';
  if (/SSL|certificate/i.test(msg)) return 'SSL problem: add ?sslmode=require to DATABASE_URL.';
  if (/Query Engine|query_engine|binaryTargets/i.test(msg)) return 'Prisma engine missing for this server: redeploy with "Clear build cache" so `prisma generate` runs again.';
  return `Database error${e?.code ? ` ${e.code}` : ''}.`;
}

export async function GET(req: Request) {
  if (!rateLimit(`health:${clientKey(req)}`, 20, 60_000).ok) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Cache-Control': 'no-store' } });
  }

  const env = {
    DATABASE_URL: !!process.env.DATABASE_URL,
    ADMIN_JWT_SECRET: long(process.env.ADMIN_JWT_SECRET),
    CUSTOMER_JWT_SECRET: long(process.env.CUSTOMER_JWT_SECRET),
    CREW_JWT_SECRET: long(process.env.CREW_JWT_SECRET),
    NEXT_PUBLIC_SITE_URL: !!process.env.NEXT_PUBLIC_SITE_URL,
    SUPABASE_URL: !!process.env.SUPABASE_URL,
    SUPABASE_SERVICE_ROLE_KEY: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    NEXT_PUBLIC_SUPABASE_URL: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  };
  const problems: string[] = [];
  const required: (keyof typeof env)[] = ['DATABASE_URL', 'ADMIN_JWT_SECRET', 'CUSTOMER_JWT_SECRET', 'CREW_JWT_SECRET'];
  for (const k of required) if (!env[k]) problems.push(`${k} is missing${k.endsWith('SECRET') ? ' or shorter than 16 characters' : ''} — add it in Vercel → Settings → Environment Variables, then redeploy.`);
  if (!env.SUPABASE_URL || !env.SUPABASE_SERVICE_ROLE_KEY) problems.push('SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY are missing — uploads (banners, videos, resumes) will fail on Vercel.');

  let database = 'not checked';
  const missingTables: string[] = [];
  let seeded = false;
  if (env.DATABASE_URL) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      database = 'connected';
      const tables: [string, () => Promise<unknown>][] = [
        ['SiteContent', () => prisma.siteContent.findFirst({ select: { id: true } })],
        ['Service', () => prisma.service.findFirst({ select: { id: true } })],
        ['PortfolioItem', () => prisma.portfolioItem.findFirst({ select: { id: true } })],
        ['Package', () => prisma.package.findFirst({ select: { id: true } })],
        ['Testimonial', () => prisma.testimonial.findFirst({ select: { id: true } })],
        ['Faq', () => prisma.faq.findFirst({ select: { id: true } })],
        ['EventType', () => prisma.eventType.findFirst({ select: { id: true } })],
        ['Offer', () => prisma.offer.findFirst({ select: { id: true } })],
        ['Banner', () => prisma.banner.findFirst({ select: { id: true, mobileImageUrl: true } })],
        ['Video', () => prisma.video.findFirst({ select: { id: true } })],
        ['Feedback', () => prisma.feedback.findFirst({ select: { id: true } })],
        ['Customer', () => prisma.customer.findFirst({ select: { id: true } })],
        ['CrewAccount', () => prisma.crewAccount.findFirst({ select: { id: true } })],
        ['CrewApplication', () => prisma.crewApplication.findFirst({ select: { id: true, crewAccountId: true } })],
        ['Notification', () => prisma.notification.findFirst({ select: { id: true } })],
        ['SeoSettings', () => prisma.seoSettings.findFirst({ select: { id: true } })],
        ['AdminUser', () => prisma.adminUser.findFirst({ select: { id: true } })],
      ];
      for (const [name, run] of tables) {
        try { await run(); } catch (err) {
          const code = (err as { code?: string })?.code;
          if (code === 'P2021' || code === 'P2022') missingTables.push(name); else throw err;
        }
      }
      if (missingTables.length) problems.push(`Tables/columns missing: ${missingTables.join(', ')} — from your computer run: npx prisma db push`);
      else {
        seeded = !!(await prisma.siteContent.findUnique({ where: { id: 'singleton' }, select: { id: true } }));
        if (!seeded) problems.push('The database is empty — from your computer run: npm run db:seed');
      }
    } catch (err) {
      database = 'error';
      console.error('[health] database check failed:', (err as { code?: string })?.code, String((err as Error)?.message || err).split('\n').slice(-2).join(' ').slice(0, 300));
      problems.push(explain(err));
    }
  }

  const ok = problems.length === 0;
  return NextResponse.json({ ok, database, seeded, missingTables, env, problems }, { status: ok ? 200 : 503, headers: { 'Cache-Control': 'no-store' } });
}

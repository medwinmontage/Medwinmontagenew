import { PrismaClient } from '@prisma/client';

/**
 * Supabase's "transaction pooler" (port 6543 / *.pooler.supabase.com) is PgBouncer. Prisma only works through it when the
 * connection string says `pgbouncer=true`; without it every few requests fail with "prepared statement … already exists"
 * and the site shows "Something went wrong". Serverless functions also should not open more than one connection each.
 * Both flags are added here when they are missing, so a connection string copied straight from Supabase just works.
 */
export function withPoolerFlags(url: string | undefined): string | undefined {
  if (!url) return url;
  const pooled = /pooler\.supabase\.com|:6543\b/.test(url);
  if (!pooled) return url;
  let out = url;
  const add = (flag: string) => { out += (out.includes('?') ? '&' : '?') + flag; };
  if (!/[?&]pgbouncer=/.test(out)) add('pgbouncer=true');
  if (!/[?&]connection_limit=/.test(out)) add('connection_limit=1');
  return out;
}

// Prevents creating a new PrismaClient on every hot-reload in dev
const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

const url = withPoolerFlags(process.env.DATABASE_URL);

export const prisma =
  globalForPrisma.prisma ?? new PrismaClient(url ? { datasources: { db: { url } } } : undefined);

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

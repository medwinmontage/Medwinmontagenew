import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { COLLECTIONS, CollectionKey } from '@/lib/collections';
import { pickFields } from '@/lib/crudFields';
import { notify, TOPIC_PUBLIC } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

type Ctx = { params: { collection: string } };

export async function GET(req: NextRequest, { params }: Ctx) {
  const key = params.collection as CollectionKey;
  const config = COLLECTIONS[key];
  if (!config) return NextResponse.json({ error: 'Unknown collection' }, { status: 404 });

  const admin = await requireAdmin();
  // Public visitors only see enabled items; the admin panel sees everything.
  const where = admin ? {} : { enabled: true };

  // @ts-expect-error - dynamic model access keyed by string is intentional here
  const items = await prisma[config.model].findMany({ where, orderBy: { order: 'asc' } });
  return NextResponse.json(items);
}

export async function POST(req: NextRequest, { params }: Ctx) {
  const key = params.collection as CollectionKey;
  const config = COLLECTIONS[key];
  if (!config) return NextResponse.json({ error: 'Unknown collection' }, { status: 404 });

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = pickFields(config, await req.json().catch(() => ({})));
  // @ts-expect-error - dynamic model access
  const count = await prisma[config.model].count();
  // @ts-expect-error - dynamic model access
  const item = await prisma[config.model].create({ data: { ...body, order: count } });
  await notify(TOPIC_PUBLIC);
  return NextResponse.json(item);
}

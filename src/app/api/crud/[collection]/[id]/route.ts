import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { COLLECTIONS, CollectionKey } from '@/lib/collections';
import { pickFields } from '@/lib/crudFields';
import { notify, TOPIC_PUBLIC } from '@/lib/realtime';

type Ctx = { params: { collection: string; id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const key = params.collection as CollectionKey;
  const config = COLLECTIONS[key];
  if (!config) return NextResponse.json({ error: 'Unknown collection' }, { status: 404 });

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = pickFields(config, await req.json().catch(() => ({})));
  // @ts-expect-error - dynamic model access
  const item = await prisma[config.model].update({ where: { id: params.id }, data: body });
  await notify(TOPIC_PUBLIC);
  return NextResponse.json(item);
}

export async function DELETE(req: NextRequest, { params }: Ctx) {
  const key = params.collection as CollectionKey;
  const config = COLLECTIONS[key];
  if (!config) return NextResponse.json({ error: 'Unknown collection' }, { status: 404 });

  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // @ts-expect-error - dynamic model access
  await prisma[config.model].delete({ where: { id: params.id } });
  await notify(TOPIC_PUBLIC);
  return NextResponse.json({ ok: true });
}

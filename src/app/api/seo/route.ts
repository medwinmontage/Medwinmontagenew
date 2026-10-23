import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { seoSchema, firstError } from '@/lib/validators';
import { notify, TOPIC_PUBLIC } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const row = await prisma.seoSettings.upsert({ where: { id: 'singleton' }, create: { id: 'singleton' }, update: {} });
  return NextResponse.json(row);
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = seoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const row = await prisma.seoSettings.upsert({ where: { id: 'singleton' }, create: { id: 'singleton', ...parsed.data }, update: parsed.data });
  await notify(TOPIC_PUBLIC);
  return NextResponse.json(row);
}

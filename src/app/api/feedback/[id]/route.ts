import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { feedbackAdminSchema, firstError } from '@/lib/validators';
import { notify, TOPIC_ADMIN, TOPIC_PUBLIC, customerTopic } from '@/lib/realtime';

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = feedbackAdminSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const existing = await prisma.feedback.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const row = await prisma.feedback.update({ where: { id: params.id }, data: parsed.data });
  await notify(TOPIC_ADMIN, TOPIC_PUBLIC, customerTopic(row.customerId));
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const existing = await prisma.feedback.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.feedback.delete({ where: { id: params.id } });
  await notify(TOPIC_ADMIN, TOPIC_PUBLIC, customerTopic(existing.customerId));
  return NextResponse.json({ ok: true });
}

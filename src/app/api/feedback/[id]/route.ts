import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { feedbackAdminSchema, firstError } from '@/lib/validators';
import { notify, TOPIC_ADMIN, TOPIC_PUBLIC, customerTopic } from '@/lib/realtime';
import { createNotification } from '@/lib/notifications';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const params = await ctx.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = feedbackAdminSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const existing = await prisma.feedback.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const row = await prisma.feedback.update({ where: { id: params.id }, data: parsed.data });
  await notify(TOPIC_ADMIN, TOPIC_PUBLIC, customerTopic(row.customerId));
  if (row.status !== existing.status && row.status !== 'Pending') {
    await createNotification({
      to: 'customer', toId: row.customerId, link: '/account',
      title: row.status === 'Approved' ? 'Your review is now live' : 'Your review was not published',
      body: row.status === 'Approved' ? 'Thank you for your feedback — it now appears on our website.' : 'Thank you for your feedback. We were not able to publish it.',
    });
  }
  return NextResponse.json(row);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const params = await ctx.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const existing = await prisma.feedback.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.feedback.delete({ where: { id: params.id } });
  await notify(TOPIC_ADMIN, TOPIC_PUBLIC, customerTopic(existing.customerId));
  return NextResponse.json({ ok: true });
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { quoteUpdateSchema, firstError } from '@/lib/validators';
import { notify, TOPIC_ADMIN, customerTopic } from '@/lib/realtime';
import { createNotification } from '@/lib/notifications';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const params = await ctx.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = quoteUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const existing = await prisma.quoteRequest.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const quote = await prisma.quoteRequest.update({ where: { id: params.id }, data: parsed.data });
  await notify(TOPIC_ADMIN, quote.customerId && customerTopic(quote.customerId));
  if (quote.customerId && quote.status !== existing.status) {
    await createNotification({ to: 'customer', toId: quote.customerId, link: '/account', title: `Your quote request ${quote.ref} is now ${quote.status}`, body: quote.status === 'Quoted' ? 'We have prepared your quote — we will share it with you.' : '' });
  }
  return NextResponse.json({ ok: true, status: quote.status });
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const params = await ctx.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const existing = await prisma.quoteRequest.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.quoteRequest.delete({ where: { id: params.id } });
  await notify(TOPIC_ADMIN, existing.customerId && customerTopic(existing.customerId));
  return NextResponse.json({ ok: true });
}

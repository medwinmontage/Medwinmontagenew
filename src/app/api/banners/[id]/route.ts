import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { bannerSchema, firstError } from '@/lib/validators';
import { notify, TOPIC_PUBLIC } from '@/lib/realtime';

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: NextRequest, ctx: Ctx) {
  const params = await ctx.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = bannerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const existing = await prisma.banner.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const data = { ...parsed.data };
  if (data.linkType === 'none') data.linkUrl = '';
  // Check the dates against what is already saved when only one of them is sent.
  const startAt = data.startAt !== undefined ? data.startAt : existing.startAt;
  const endAt = data.endAt !== undefined ? data.endAt : existing.endAt;
  if (startAt && endAt && endAt.getTime() <= startAt.getTime()) return NextResponse.json({ error: 'The end date must be after the start date.' }, { status: 400 });
  if ((data.timerEnabled ?? existing.timerEnabled) && !endAt) return NextResponse.json({ error: 'A timer needs an end date to count down to.' }, { status: 400 });

  const banner = await prisma.banner.update({ where: { id: params.id }, data });
  await notify(TOPIC_PUBLIC);
  return NextResponse.json(banner);
}

export async function DELETE(_req: NextRequest, ctx: Ctx) {
  const params = await ctx.params;
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const existing = await prisma.banner.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.banner.delete({ where: { id: params.id } });
  await notify(TOPIC_PUBLIC);
  return NextResponse.json({ ok: true });
}

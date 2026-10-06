import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { offerSchema, firstError } from '@/lib/validators';
import { notify, TOPIC_PUBLIC } from '@/lib/realtime';

// Without this, Next.js bakes the GET response into the build (stale data) and
// the production server answers PUT with 405, so admin saves fail.
export const dynamic = 'force-dynamic';

export async function GET() {
  const offer = await prisma.offer.findFirst();
  return NextResponse.json(offer);
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = offerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const data = parsed.data;
  const existing = await prisma.offer.findFirst();
  if (!existing && (!data.text || !data.endAt)) return NextResponse.json({ error: 'Offer text and end date are required.' }, { status: 400 });
  const offer = existing
    ? await prisma.offer.update({ where: { id: existing.id }, data })
    : await prisma.offer.create({ data: { enabled: data.enabled ?? true, text: data.text!, url: data.url ?? '', endAt: data.endAt! } });
  await notify(TOPIC_PUBLIC);
  return NextResponse.json(offer);
}

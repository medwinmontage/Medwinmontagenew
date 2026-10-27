import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { bannerSchema, firstError } from '@/lib/validators';
import { bannerState } from '@/lib/links';
import { notify, TOPIC_PUBLIC } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

// Admins get every banner; everyone else only those that are live right now.
export async function GET() {
  const admin = await requireAdmin();
  const banners = await prisma.banner.findMany({ orderBy: { order: 'asc' } });
  return NextResponse.json(admin ? banners : banners.filter((b) => bannerState(b) === 'ACTIVE'));
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = bannerSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  if (!parsed.data.imageUrl) return NextResponse.json({ error: 'Please upload a banner image.' }, { status: 400 });
  const count = await prisma.banner.count();
  const { imageUrl, linkType, linkUrl, ...rest } = parsed.data;
  const banner = await prisma.banner.create({
    data: { ...rest, imageUrl, linkType: linkType ?? 'none', linkUrl: linkType && linkType !== 'none' ? linkUrl ?? '' : '', order: count },
  });
  await notify(TOPIC_PUBLIC);
  return NextResponse.json(banner);
}

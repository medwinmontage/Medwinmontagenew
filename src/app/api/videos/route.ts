import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { videoSchema, firstError } from '@/lib/validators';
import { checkVideoSource } from '@/lib/media';
import { ownedKey } from '@/lib/storage';
import { notify, TOPIC_PUBLIC } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

// Admins get every video; everyone else only the enabled ones.
export async function GET() {
  const admin = await requireAdmin();
  const videos = await prisma.video.findMany({ where: admin ? undefined : { enabled: true }, orderBy: { order: 'asc' } });
  return NextResponse.json(videos);
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = videoSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const { source, url, posterUrl } = parsed.data;

  const problem = checkVideoSource(source, url);
  if (problem) return NextResponse.json({ error: problem }, { status: 400 });
  // An "upload" must point at a file this site stored, so a link can't be passed off as one.
  if (source === 'upload' && !ownedKey(url, 'videos')) return NextResponse.json({ error: 'Please upload a video file first.' }, { status: 400 });

  const count = await prisma.video.count();
  const video = await prisma.video.create({ data: { ...parsed.data, posterUrl: posterUrl ?? '', caption: parsed.data.caption ?? '', order: count } });
  await notify(TOPIC_PUBLIC);
  return NextResponse.json(video);
}

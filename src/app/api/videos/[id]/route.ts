import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { videoUpdateSchema, firstError } from '@/lib/validators';
import { checkVideoSource, VideoSource } from '@/lib/media';
import { ownedKey, deleteOwnedFile } from '@/lib/storage';
import { notify, TOPIC_PUBLIC } from '@/lib/realtime';

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = videoUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const existing = await prisma.video.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Re-check the source/link pair whenever either one changes.
  const source = (parsed.data.source ?? existing.source) as VideoSource;
  const url = parsed.data.url ?? existing.url;
  if (parsed.data.source !== undefined || parsed.data.url !== undefined) {
    const problem = checkVideoSource(source, url);
    if (problem) return NextResponse.json({ error: problem }, { status: 400 });
    if (source === 'upload' && !ownedKey(url, 'videos')) return NextResponse.json({ error: 'Please upload a video file first.' }, { status: 400 });
  }
  const video = await prisma.video.update({ where: { id: params.id }, data: parsed.data });
  // A replaced file or poster is removed from storage.
  if (parsed.data.url && existing.url !== video.url) await deleteOwnedFile(existing.url);
  if (parsed.data.posterUrl !== undefined && existing.posterUrl && existing.posterUrl !== video.posterUrl) await deleteOwnedFile(existing.posterUrl);
  await notify(TOPIC_PUBLIC);
  return NextResponse.json(video);
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const existing = await prisma.video.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.video.delete({ where: { id: params.id } });
  await deleteOwnedFile(existing.url);
  await deleteOwnedFile(existing.posterUrl);
  await notify(TOPIC_PUBLIC);
  return NextResponse.json({ ok: true });
}

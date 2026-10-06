import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { crewAdminSchema, firstError } from '@/lib/validators';
import { deletePrivateFile } from '@/lib/storage';
import { notify, TOPIC_ADMIN } from '@/lib/realtime';

type Ctx = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = crewAdminSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const existing = await prisma.crewApplication.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const row = await prisma.crewApplication.update({ where: { id: params.id }, data: parsed.data });
  await notify(TOPIC_ADMIN);
  return NextResponse.json({ ok: true, status: row.status });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const existing = await prisma.crewApplication.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.crewApplication.delete({ where: { id: params.id } });
  if (existing.resumePath) await deletePrivateFile(existing.resumePath);
  await notify(TOPIC_ADMIN);
  return NextResponse.json({ ok: true });
}

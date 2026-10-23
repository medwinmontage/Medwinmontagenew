import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { crewAdminSchema, firstError } from '@/lib/validators';
import { deletePrivateFile } from '@/lib/storage';
import { notify, TOPIC_ADMIN } from '@/lib/realtime';
import { createNotification } from '@/lib/notifications';

type Ctx = { params: { id: string } };

const CREW_STATUS_HELP: Record<string, string> = {
  New: 'We have your application.',
  Reviewing: 'We are reviewing your application.',
  Shortlisted: 'Good news — you have been shortlisted. We will contact you soon.',
  Hired: 'Welcome to the crew! We will be in touch with the next steps.',
  Rejected: 'We are not able to take your application forward right now. Thank you for applying.',
};

export async function PATCH(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = crewAdminSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const existing = await prisma.crewApplication.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  const row = await prisma.crewApplication.update({ where: { id: params.id }, data: parsed.data });
  await notify(TOPIC_ADMIN);
  // Tell the applicant (only if the application belongs to a crew account).
  if (row.crewAccountId && parsed.data.status && parsed.data.status !== existing.status) {
    await createNotification({
      to: 'crew', toId: row.crewAccountId, link: '/crew',
      title: `Your application ${row.ref} is now ${row.status}`,
      body: CREW_STATUS_HELP[row.status] || '',
    });
  }
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

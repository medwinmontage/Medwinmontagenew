import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { workStatusUpdateSchema, firstError } from '@/lib/validators';
import { normalizeStatus } from '@/lib/status';
import { notify, TOPIC_ADMIN, customerTopic } from '@/lib/realtime';

type Ctx = { params: { id: string } };

// Admin only: change the status and/or the note shown to the customer.
// Only those two fields are accepted — the rest of the record cannot be rewritten from here.
export async function PATCH(req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = workStatusUpdateSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });

  const existing = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { status, adminNotes } = parsed.data;
  const changed = status !== undefined && status !== normalizeStatus(existing.status);
  const row = await prisma.lead.update({
    where: { id: params.id },
    data: {
      ...(adminNotes !== undefined ? { adminNotes } : {}),
      ...(changed ? { status, previousStatus: normalizeStatus(existing.status), statusUpdatedAt: new Date() } : {}),
    },
  });
  // Customers are not messaged automatically (no email/SMS/WhatsApp Business
  // provider is configured); they see the new status in their portal.
  await notify(TOPIC_ADMIN, row.customerId && customerTopic(row.customerId));
  return NextResponse.json({ ok: true, status: normalizeStatus(row.status), previousStatus: row.previousStatus });
}

export async function DELETE(_req: NextRequest, { params }: Ctx) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const existing = await prisma.lead.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  await prisma.lead.delete({ where: { id: params.id } });
  await notify(TOPIC_ADMIN, existing.customerId && customerTopic(existing.customerId));
  return NextResponse.json({ ok: true });
}

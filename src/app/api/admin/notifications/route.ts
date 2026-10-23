import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { adminNotificationSchema, firstError } from '@/lib/validators';
import { rateLimit } from '@/lib/rateLimit';
import { createNotification, createNotificationForMany } from '@/lib/notifications';

// Admin → customer / crew: one person, or everyone with an account.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (!rateLimit(`admin-notify:${admin.sub}`, 60, 60 * 60 * 1000).ok) return NextResponse.json({ error: 'Too many notifications sent — please wait a little.' }, { status: 429 });

  const parsed = adminNotificationSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const { audience, recipientId, title, body, link } = parsed.data;
  const data = { title, body, link: link || (audience.includes('crew') ? '/crew' : '/account') };

  if (audience === 'customer' || audience === 'crew') {
    const exists = audience === 'customer'
      ? await prisma.customer.findUnique({ where: { id: recipientId } })
      : await prisma.crewAccount.findUnique({ where: { id: recipientId } });
    if (!exists) return NextResponse.json({ error: 'That person was not found.' }, { status: 404 });
    await createNotification({ to: audience, toId: recipientId, ...data });
    return NextResponse.json({ ok: true, sent: 1 });
  }

  const kind = audience === 'all-customers' ? 'customer' : 'crew';
  const people = kind === 'customer'
    ? await prisma.customer.findMany({ where: { status: 'Active' } })
    : await prisma.crewAccount.findMany({});
  const sent = await createNotificationForMany(kind, people.map((p: { id: string }) => p.id), data);
  return NextResponse.json({ ok: true, sent });
}

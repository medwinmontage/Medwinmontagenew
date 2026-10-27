import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireCustomer, requireCrew } from '@/lib/session';
import { notificationActionSchema } from '@/lib/validators';
import { ADMIN_INBOX, Audience } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

/**
 * Who is asking? The recipient is worked out from the signed session cookie of
 * the requested kind — never from an id in the request. A visitor therefore can
 * only ever read or mark their own notifications (or, as admin, the admin inbox).
 */
async function recipientFor(kind: Audience): Promise<{ kind: Audience; id: string } | null> {
  if (kind === 'admin') return (await requireAdmin()) ? { kind, id: ADMIN_INBOX } : null;
  if (kind === 'customer') { const c = await requireCustomer(); return c ? { kind, id: c.id } : null; }
  const c = await requireCrew();
  return c ? { kind, id: c.id } : null;
}
const isKind = (v: string | null): v is Audience => v === 'admin' || v === 'customer' || v === 'crew';

export async function GET(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get('kind');
  if (!isKind(kind)) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const who = await recipientFor(kind);
  if (!who) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });

  const limit = Math.min(Math.max(Number(req.nextUrl.searchParams.get('limit')) || 20, 1), 100);
  const where = { recipientKind: who.kind, recipientId: who.id };
  const [items, unread] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, take: limit }),
    prisma.notification.count({ where: { ...where, readAt: null } }),
  ]);
  return NextResponse.json({
    unread,
    items: items.map((n) => ({
      id: n.id, title: n.title, body: n.body, link: n.link, read: !!n.readAt, createdAt: n.createdAt,
      from: n.actorKind && n.actorId ? { kind: n.actorKind, id: n.actorId, name: n.actorName || '' } : null,
    })),
  });
}

// Mark one notification (or all of them) as read.
export async function POST(req: NextRequest) {
  const parsed = notificationActionSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const { kind, action, id } = parsed.data;
  const who = await recipientFor(kind);
  if (!who) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });

  // The recipient is part of every filter, so another person's id can't be marked.
  const where = { recipientKind: who.kind, recipientId: who.id, readAt: null, ...(action === 'read' && id ? { id } : {}) };
  if (action === 'read' && !id) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  await prisma.notification.updateMany({ where, data: { readAt: new Date() } });
  return NextResponse.json({ ok: true });
}

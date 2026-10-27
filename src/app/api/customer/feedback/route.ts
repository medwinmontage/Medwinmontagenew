import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCustomer } from '@/lib/session';
import { feedbackSchema, firstError } from '@/lib/validators';
import { rateLimit } from '@/lib/rateLimit';
import { normalizeStatus } from '@/lib/status';
import { notify, TOPIC_ADMIN, customerTopic } from '@/lib/realtime';
import { createNotification } from '@/lib/notifications';

export async function POST(req: NextRequest) {
  const customer = await requireCustomer();
  if (!customer) return NextResponse.json({ error: 'Please log in to leave feedback.' }, { status: 401 });
  if (!rateLimit(`feedback:${customer.id}`, 5, 60 * 60 * 1000).ok) return NextResponse.json({ error: 'Too many reviews — please try again later.' }, { status: 429 });

  const parsed = feedbackSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const { rating, text, relatedRef, allowPublic } = parsed.data;

  // A review can only be attached to this customer's own, completed work.
  let relatedType: string | null = null;
  if (relatedRef) {
    const [booking, lead] = await Promise.all([
      prisma.booking.findFirst({ where: { ref: relatedRef, customerId: customer.id } }),
      prisma.lead.findFirst({ where: { ref: relatedRef, customerId: customer.id } }),
    ]);
    const record = booking || lead;
    if (!record) return NextResponse.json({ error: 'That booking or request was not found on your account.' }, { status: 404 });
    if (normalizeStatus(record.status) !== 'Completed') return NextResponse.json({ error: 'You can review this once it is completed.' }, { status: 400 });
    const already = await prisma.feedback.findFirst({ where: { customerId: customer.id, relatedRef } });
    if (already) return NextResponse.json({ error: 'You have already reviewed this.' }, { status: 409 });
    relatedType = booking ? 'booking' : 'lead';
  }

  const feedback = await prisma.feedback.create({
    data: { customerId: customer.id, rating, text, relatedRef: relatedRef || null, relatedType, allowPublic },
  });
  await notify(TOPIC_ADMIN, customerTopic(customer.id));
  await createNotification({
    to: 'admin', title: `New review (${rating}/5)`, body: `${customer.name}: ${text.slice(0, 160)}`, link: '/admin/feedback',
    actor: { kind: 'customer', id: customer.id, name: customer.name },
  });
  return NextResponse.json({ ok: true, id: feedback.id, status: feedback.status });
}

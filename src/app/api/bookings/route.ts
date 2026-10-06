import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getCustomerSession } from '@/lib/session';
import { bookingSchema } from '@/lib/validators';
import { rateLimit, clientKey } from '@/lib/rateLimit';
import { nextEventRef } from '@/lib/refCounter';
import { notify, TOPIC_ADMIN, customerTopic } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

// Public: submit a booking request (Booking model = "Event Booking" type)
export async function POST(req: NextRequest) {
  const limited = rateLimit(`booking:${clientKey(req)}`, 5, 10 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: 'Too many requests — please try again later.' }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = bookingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 });
  }
  const customer = await getCustomerSession();
  const ref = await nextEventRef();

  const booking = await prisma.booking.create({
    data: {
      ...parsed.data,
      ref,
      bookingType: 'Event Booking',
      customerId: customer?.sub,
    },
  });

  // Notification is handled client-side: BookingModal opens WhatsApp with the
  // submitted details right after this call succeeds (see requirements doc —
  // WhatsApp is the notification channel here, not email/SMS).
  await notify(TOPIC_ADMIN, customer?.sub && customerTopic(customer.sub));
  return NextResponse.json({ ok: true, ref: booking.ref, status: booking.status });
}

// Admin: list all bookings
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const bookings = await prisma.booking.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(bookings);
}

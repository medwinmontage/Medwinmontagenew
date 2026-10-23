import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCustomer } from '@/lib/session';
import { normalizeStatus } from '@/lib/status';

export const dynamic = 'force-dynamic';

// Everything the customer portal shows. Every query is filtered by the id from
// the session cookie, so one customer can never read another customer's rows.
export async function GET() {
  const customer = await requireCustomer();
  if (!customer) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  const where = { customerId: customer.id };

  const [bookings, leads, quotes, feedback] = await Promise.all([
    prisma.booking.findMany({ where, orderBy: { createdAt: 'desc' } }),
    prisma.lead.findMany({ where, orderBy: { createdAt: 'desc' } }),
    prisma.quoteRequest.findMany({ where, orderBy: { createdAt: 'desc' } }),
    prisma.feedback.findMany({ where, orderBy: { createdAt: 'desc' } }),
  ]);

  return NextResponse.json({
    profile: {
      name: customer.name, email: customer.email, phone: customer.phone,
      company: customer.company || '', city: customer.city || '', state: customer.state || '',
      status: customer.status, createdAt: customer.createdAt,
    },
    bookings: bookings.map((b) => ({
      ref: b.ref, kind: 'Event Booking' as const, title: b.eventType, eventDate: b.eventDate, eventTime: b.eventTime || '',
      location: b.location, budget: b.budget || '', notes: b.notes || '', status: normalizeStatus(b.status),
      note: b.adminNotes || '', createdAt: b.createdAt, updatedAt: b.statusUpdatedAt || b.updatedAt,
    })),
    services: leads.map((l) => ({
      ref: l.ref, kind: l.mode === 'offer' ? ('Offer Booking' as const) : ('Service Request' as const),
      title: l.categories.join(', '), categories: l.categories, items: l.itemsJson, details: l.detailsJson,
      location: l.location, company: l.company || '', status: normalizeStatus(l.status),
      note: l.adminNotes || '', createdAt: l.createdAt, updatedAt: l.statusUpdatedAt || l.updatedAt,
    })),
    quotes: quotes.map((q) => ({
      ref: q.ref, company: q.company || '', phone: q.phone, whatsapp: q.whatsapp, status: q.status,
      createdAt: q.createdAt, updatedAt: q.updatedAt,
    })),
    feedback: feedback.map((f) => ({
      id: f.id, rating: f.rating, text: f.text, relatedRef: f.relatedRef || '', allowPublic: f.allowPublic,
      status: f.status, createdAt: f.createdAt,
    })),
  });
}

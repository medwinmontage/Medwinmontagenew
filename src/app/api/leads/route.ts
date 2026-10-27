import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getCustomerSession } from '@/lib/session';
import { leadSchema } from '@/lib/validators';
import { rateLimit, clientKey } from '@/lib/rateLimit';
import { nextServiceRef } from '@/lib/refCounter';
import { notify, TOPIC_ADMIN, customerTopic } from '@/lib/realtime';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

// Public: submit a Service Wizard request (mode: 'service') or a Book Offer
// waitlist request (mode: 'offer') — same shape, different downstream handling.
// Both use the MMBS- reference series (this project only distinguishes
// MMBE for events and MMBS for everything submitted through the wizard).
export async function POST(req: NextRequest) {
  const limited = rateLimit(`lead:${clientKey(req)}`, 5, 10 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: 'Too many requests — please try again later.' }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = leadSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 });
  }
  const customer = await getCustomerSession();
  const ref = await nextServiceRef();

  const lead = await prisma.lead.create({
    data: { ...parsed.data, ref, customerId: customer?.sub },
  });

  const message = parsed.data.mode === 'offer'
    ? "Your booking is on the waitlist after August 15, 11:59 PM. The lucky winner will be selected. If you are selected, we will contact you."
    : null;

  // Notification is handled client-side: WizardModal opens WhatsApp with the
  // submitted details right after this call succeeds.
  await notify(TOPIC_ADMIN, customer?.sub && customerTopic(customer.sub));
  await createNotification({
    to: 'admin', title: `New ${lead.mode === 'offer' ? 'offer booking' : 'service request'} ${lead.ref}`, body: `${lead.name} — ${lead.categories.join(', ') || 'services'}.`, link: '/admin/leads',
    actor: customer?.sub ? { kind: 'customer', id: customer.sub, name: customer.name } : undefined,
  });
  if (customer?.sub) await createNotification({ to: 'customer', toId: customer.sub, title: `Request ${lead.ref} received`, body: 'We have your request and will be in touch.', link: '/account' });
  return NextResponse.json({ ok: true, ref: lead.ref, message });
}

// Admin: list all leads
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(leads);
}

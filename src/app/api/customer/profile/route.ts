import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCustomer, setCustomerSession } from '@/lib/session';
import { customerProfileSchema, firstError } from '@/lib/validators';
import { rateLimit } from '@/lib/rateLimit';
import { notify, TOPIC_ADMIN } from '@/lib/realtime';

const PROTECTED = ['email', 'phone'];

// A customer may change name, company, city and state — nothing else.
// Email and phone are refused here on the server, not just hidden in the form.
export async function PATCH(req: NextRequest) {
  const customer = await requireCustomer();
  if (!customer) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  if (!rateLimit(`profile:${customer.id}`, 20, 10 * 60 * 1000).ok) return NextResponse.json({ error: 'Too many changes — please try again later.' }, { status: 429 });

  const body = await req.json().catch(() => null);
  if (body && typeof body === 'object' && PROTECTED.some((k) => k in body)) {
    return NextResponse.json({ error: 'Email and phone number can only be changed by an admin. Please contact us.' }, { status: 403 });
  }
  const parsed = customerProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });

  const { name, company, city, state } = parsed.data;
  const updated = await prisma.customer.update({
    where: { id: customer.id },
    data: { name, company: company ?? null, city: city ?? null, state: state ?? null },
  });
  await setCustomerSession({ sub: updated.id, name: updated.name, email: updated.email });
  await notify(TOPIC_ADMIN);
  return NextResponse.json({ ok: true, profile: { name: updated.name, company: updated.company || '', city: updated.city || '', state: updated.state || '' } });
}

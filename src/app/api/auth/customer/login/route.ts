import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { setCustomerSession } from '@/lib/session';
import { customerLoginSchema } from '@/lib/validators';
import { rateLimit, clientKey } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const limited = rateLimit(`customer-login:${clientKey(req)}`, 10, 10 * 60 * 1000);
  if (!limited.ok) return NextResponse.json({ error: 'Too many login attempts — please try again later.' }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = customerLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { identifier, password } = parsed.data;

  const customer = await prisma.customer.findFirst({ where: { OR: [{ email: identifier }, { phone: identifier }] } });
  if (!customer) {
    return NextResponse.json({ error: 'Incorrect email/phone or password.' }, { status: 401 });
  }
  if (customer.status === 'Suspended') {
    return NextResponse.json({ error: 'This account has been suspended. Please contact us.' }, { status: 403 });
  }
  const ok = await verifyPassword(password, customer.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'Incorrect email/phone or password.' }, { status: 401 });
  }

  await prisma.customer.update({ where: { id: customer.id }, data: { lastLogin: new Date() } });
  await setCustomerSession({ sub: customer.id, name: customer.name, email: customer.email });
  return NextResponse.json({ ok: true, id: customer.id, name: customer.name });
}

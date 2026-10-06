import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { setCustomerSession } from '@/lib/session';
import { customerRegisterSchema } from '@/lib/validators';
import { rateLimit, clientKey } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const limited = rateLimit(`customer-register:${clientKey(req)}`, 5, 60 * 60 * 1000); // 5 per hour per IP
  if (!limited.ok) return NextResponse.json({ error: 'Too many registration attempts — please try again later.' }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = customerRegisterSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 });
  }
  const { name, email, phone, password, company, city, state } = parsed.data;

  const existing = await prisma.customer.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) {
    return NextResponse.json({ error: 'An account with this email or phone already exists.' }, { status: 409 });
  }

  const now = new Date();
  const customer = await prisma.customer.create({
    data: { name, email, phone, company, city, state, passwordHash: await hashPassword(password), lastLogin: now },
  });

  await setCustomerSession({ sub: customer.id, name: customer.name, email: customer.email });
  return NextResponse.json({ ok: true, id: customer.id, name: customer.name });
}

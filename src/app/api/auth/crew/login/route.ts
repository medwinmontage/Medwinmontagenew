import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { setCrewSession } from '@/lib/session';
import { crewLoginSchema } from '@/lib/validators';
import { rateLimit, clientKey } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  if (!rateLimit(`crew-login:${clientKey(req)}`, 10, 10 * 60 * 1000).ok) {
    return NextResponse.json({ error: 'Too many login attempts — please try again later.' }, { status: 429 });
  }
  const parsed = crewLoginSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const { identifier, password } = parsed.data;

  // Emails are stored lower-case; phone numbers are matched as typed.
  const account = await prisma.crewAccount.findFirst({ where: { OR: [{ email: identifier.toLowerCase() }, { phone: identifier }] } });
  // Same message for "no such account" and "wrong password".
  if (!account || !(await verifyPassword(password, account.passwordHash))) {
    return NextResponse.json({ error: 'Incorrect email/phone or password.' }, { status: 401 });
  }
  await prisma.crewAccount.update({ where: { id: account.id }, data: { lastLogin: new Date() } });
  await setCrewSession({ sub: account.id, name: account.name, email: account.email });
  return NextResponse.json({ ok: true, id: account.id, name: account.name });
}

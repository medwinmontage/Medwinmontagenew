import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { hashPassword } from '@/lib/auth';
import { setCrewSession } from '@/lib/session';
import { crewRegisterSchema, firstError } from '@/lib/validators';
import { rateLimit, clientKey } from '@/lib/rateLimit';
import { createNotification } from '@/lib/notifications';

// Public: create a crew account. The account can then send one application and
// receive notifications. Nothing but name, email, phone and password is read.
export async function POST(req: NextRequest) {
  if (!rateLimit(`crew-register:${clientKey(req)}`, 8, 60 * 60 * 1000).ok) {
    return NextResponse.json({ error: 'Too many registration attempts — please try again later.' }, { status: 429 });
  }
  const parsed = crewRegisterSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const { name, email, phone, password } = parsed.data;

  const existing = await prisma.crewAccount.findFirst({ where: { OR: [{ email }, { phone }] } });
  if (existing) return NextResponse.json({ error: 'A crew account with this email or phone already exists. Please log in.' }, { status: 409 });

  const account = await prisma.crewAccount.create({
    data: { name, email, phone, passwordHash: await hashPassword(password), lastLogin: new Date() },
  });
  await setCrewSession({ sub: account.id, name: account.name, email: account.email });
  await createNotification({ to: 'admin', title: 'New crew account', body: `${account.name} (${account.email}) registered to join as crew.`, link: '/admin/crew', actor: { kind: 'crew', id: account.id, name: account.name } });
  return NextResponse.json({ ok: true, id: account.id, name: account.name });
}

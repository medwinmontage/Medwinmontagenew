import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyPassword } from '@/lib/auth';
import { setAdminSession } from '@/lib/session';
import { adminLoginSchema } from '@/lib/validators';
import { rateLimit, clientKey } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const limited = rateLimit(`admin-login:${clientKey(req)}`, 8, 10 * 60 * 1000); // 8 attempts / 10 min / IP
  if (!limited.ok) return NextResponse.json({ error: 'Too many login attempts — please try again later.' }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = adminLoginSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }
  const { username, password } = parsed.data;

  const admin = await prisma.adminUser.findUnique({ where: { username } });
  if (!admin) {
    return NextResponse.json({ error: 'Incorrect username or password.' }, { status: 401 });
  }
  const ok = await verifyPassword(password, admin.passwordHash);
  if (!ok) {
    return NextResponse.json({ error: 'Incorrect username or password.' }, { status: 401 });
  }

  await setAdminSession({ sub: admin.id, username: admin.username, role: admin.role });
  return NextResponse.json({ ok: true, username: admin.username, role: admin.role });
}

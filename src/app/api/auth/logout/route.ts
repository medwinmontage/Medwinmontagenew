import { NextResponse } from 'next/server';
import { clearAdminSession, clearCustomerSession } from '@/lib/session';

export async function POST(req: Request) {
  const { kind } = await req.json().catch(() => ({ kind: 'admin' }));
  if (kind === 'customer') clearCustomerSession();
  else clearAdminSession();
  return NextResponse.json({ ok: true });
}

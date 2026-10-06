import { NextResponse } from 'next/server';
import { getAdminSession, requireCustomer } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await getAdminSession();
  const customer = await requireCustomer(); // null if logged out, deleted or suspended
  return NextResponse.json({
    admin: admin ? { username: admin.username } : null,
    customer: customer ? { sub: customer.id, name: customer.name, email: customer.email } : null,
  });
}

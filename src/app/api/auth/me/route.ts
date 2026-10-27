import { NextResponse } from 'next/server';
import { getAdminSession, requireCustomer, requireCrew } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await getAdminSession();
  const customer = await requireCustomer(); // null if logged out, deleted or suspended
  const crew = await requireCrew(); // null if logged out or deleted
  return NextResponse.json({
    admin: admin ? { username: admin.username } : null,
    customer: customer ? { sub: customer.id, name: customer.name, email: customer.email } : null,
    crew: crew ? { sub: crew.id, name: crew.name, email: crew.email } : null,
  });
}

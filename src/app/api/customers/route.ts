import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

// Never returns passwordHash — admin never needs it and it must never reach the client.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const customers = await prisma.customer.findMany({
    orderBy: { createdAt: 'desc' },
    select: {
      id: true, name: true, email: true, phone: true, status: true,
      createdAt: true, lastLogin: true,
      _count: { select: { bookings: true, leads: true, quoteRequests: true } },
    },
  });
  return NextResponse.json(customers);
}

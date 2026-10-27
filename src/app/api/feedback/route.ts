import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await prisma.feedback.findMany({ orderBy: { createdAt: 'desc' } });
  const customers = await prisma.customer.findMany({ select: { id: true, name: true, email: true } });
  const byId = new Map(customers.map((c) => [c.id, c]));
  return NextResponse.json(rows.map((f) => ({ ...f, customerName: byId.get(f.customerId)?.name || 'Customer', customerEmail: byId.get(f.customerId)?.email || '' })));
}

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Admin: the people a notification can be sent to (name + email only).
export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const kind = req.nextUrl.searchParams.get('kind');
  const rows = kind === 'crew'
    ? await prisma.crewAccount.findMany({ orderBy: { createdAt: 'desc' } })
    : await prisma.customer.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows.map((r: { id: string; name: string; email: string }) => ({ id: r.id, name: r.name, email: r.email })));
}

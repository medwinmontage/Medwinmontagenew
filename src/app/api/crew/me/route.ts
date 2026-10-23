import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireCrew } from '@/lib/session';

export const dynamic = 'force-dynamic';

// Everything the crew dashboard shows. Filtered by the id in the session cookie,
// so a crew member can only ever see their own account and application.
// Admin notes on an application are internal and are not returned.
export async function GET() {
  const account = await requireCrew();
  if (!account) return NextResponse.json({ error: 'Please log in.' }, { status: 401 });
  const app = await prisma.crewApplication.findFirst({ where: { crewAccountId: account.id } });
  return NextResponse.json({
    account: { name: account.name, email: account.email, phone: account.phone, createdAt: account.createdAt },
    application: app ? {
      ref: app.ref, role: app.role, status: app.status, experienceType: app.experienceType,
      createdAt: app.createdAt, updatedAt: app.updatedAt, hasResume: !!app.resumePath,
    } : null,
  });
}

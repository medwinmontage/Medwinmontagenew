import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { siteContentSchema, firstError } from '@/lib/validators';
import { notify, TOPIC_PUBLIC } from '@/lib/realtime';

// Without this, Next.js bakes the GET response into the build (stale data) and
// the production server answers PUT with 405, so admin saves fail.
export const dynamic = 'force-dynamic';

export async function GET() {
  const content = await prisma.siteContent.findUnique({ where: { id: 'singleton' } });
  return NextResponse.json(content);
}

export async function PUT(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  // Only known, validated fields are written (the admin form sends the whole
  // row back, so unknown keys such as id/updatedAt are dropped, not rejected).
  const parsed = siteContentSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });
  const content = await prisma.siteContent.update({ where: { id: 'singleton' }, data: parsed.data });
  await notify(TOPIC_PUBLIC);
  return NextResponse.json(content);
}

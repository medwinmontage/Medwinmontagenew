import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { openPrivateFile } from '@/lib/storage';

export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = {
  pdf: 'application/pdf', doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// Admin only. Resumes live in private storage; this is the single way to open one.
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const app = await prisma.crewApplication.findUnique({ where: { id: params.id } });
  if (!app?.resumePath) return NextResponse.json({ error: 'No resume on this application.' }, { status: 404 });
  const file = await openPrivateFile(app.resumePath);
  if (!file) return NextResponse.json({ error: 'The resume file could not be found.' }, { status: 404 });
  if ('url' in file) return NextResponse.redirect(file.url); // signed, expires in 60 seconds
  const ext = app.resumePath.split('.').pop() || 'pdf';
  const name = (app.resumeName || `${app.ref}.${ext}`).replace(/"/g, '');
  return new NextResponse(new Uint8Array(file.data), {
    headers: {
      'Content-Type': TYPES[ext] || 'application/octet-stream',
      'Content-Disposition': `attachment; filename="${name}"`,
      'Cache-Control': 'private, no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}

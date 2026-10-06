import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import { crewApplicationSchema, firstError } from '@/lib/validators';
import { rateLimit, clientKey } from '@/lib/rateLimit';
import { nextCrewRef } from '@/lib/refCounter';
import { savePrivateFile, sniffType, StorageError } from '@/lib/storage';
import { notify, TOPIC_ADMIN } from '@/lib/realtime';

export const dynamic = 'force-dynamic';

const MAX_RESUME = 5 * 1024 * 1024; // 5 MB
const RESUME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// Public: submit a crew application (multipart form, optional resume).
// Status and admin notes are never read from the request.
export async function POST(req: NextRequest) {
  if (!rateLimit(`crew:${clientKey(req)}`, 10, 60 * 60 * 1000).ok) {
    return NextResponse.json({ error: 'Too many applications from this connection — please try again later.' }, { status: 429 });
  }
  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const fields: Record<string, string> = {};
  for (const [key, value] of form.entries()) if (typeof value === 'string') fields[key] = value;
  const parsed = crewApplicationSchema.safeParse(fields);
  if (!parsed.success) {
    return NextResponse.json({ error: firstError(parsed.error), field: parsed.error.issues[0]?.path[0] }, { status: 400 });
  }

  let resumePath: string | null = null;
  let resumeName: string | null = null;
  const file = form.get('resume');
  if (file instanceof File && file.size > 0) {
    if (file.size > MAX_RESUME) return NextResponse.json({ error: 'The resume must be 5 MB or smaller.', field: 'resume' }, { status: 400 });
    const data = Buffer.from(await file.arrayBuffer());
    const kind = sniffType(data); // decided from the file's contents, not its name
    if (kind !== 'pdf' && kind !== 'doc' && kind !== 'docx') {
      return NextResponse.json({ error: 'Please upload your resume as a PDF, DOC or DOCX file.', field: 'resume' }, { status: 400 });
    }
    try {
      resumePath = await savePrivateFile(data, kind, RESUME_TYPES[kind]);
    } catch (e) {
      const message = e instanceof StorageError ? e.message : 'The resume could not be uploaded.';
      return NextResponse.json({ error: `${message} You can submit without a resume.`, field: 'resume' }, { status: 503 });
    }
    resumeName = file.name.replace(/[^\w.\- ]+/g, '_').slice(0, 120) || `resume.${kind}`;
  }

  const ref = await nextCrewRef();
  await prisma.crewApplication.create({ data: { ...parsed.data, ref, resumePath, resumeName } });
  await notify(TOPIC_ADMIN);
  return NextResponse.json({ ok: true, ref });
}

// Admin: list applications. The storage key is replaced by a yes/no flag.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await prisma.crewApplication.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(rows.map(({ resumePath, ...row }) => ({ ...row, hasResume: !!resumePath })));
}

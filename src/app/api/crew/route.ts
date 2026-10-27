import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, requireCrew } from '@/lib/session';
import { crewApplicationSchema, firstError } from '@/lib/validators';
import { rateLimit, clientKey } from '@/lib/rateLimit';
import { nextCrewRef } from '@/lib/refCounter';
import { savePrivateFile, sniffType, StorageError } from '@/lib/storage';
import { notify, TOPIC_ADMIN } from '@/lib/realtime';
import { createNotification } from '@/lib/notifications';

export const dynamic = 'force-dynamic';

const MAX_RESUME = 5 * 1024 * 1024; // 5 MB
const RESUME_TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
};

// Crew members must be logged in to apply. The application is tied to the crew
// account from the session cookie; name and phone come from that account (not
// from the form), and one account can send one application.
// Status and admin notes are never read from the request.
export async function POST(req: NextRequest) {
  const account = await requireCrew();
  if (!account) return NextResponse.json({ error: 'Please log in or register as crew to send your application.' }, { status: 401 });
  if (!rateLimit(`crew:${clientKey(req)}`, 10, 60 * 60 * 1000).ok) {
    return NextResponse.json({ error: 'Too many applications from this connection — please try again later.' }, { status: 429 });
  }
  const already = await prisma.crewApplication.findFirst({ where: { crewAccountId: account.id } });
  if (already) return NextResponse.json({ error: `You have already sent an application (${already.ref}). You can follow it in your crew dashboard.`, ref: already.ref }, { status: 409 });

  const form = await req.formData().catch(() => null);
  if (!form) return NextResponse.json({ error: 'Invalid request' }, { status: 400 });

  const fields: Record<string, string> = {};
  for (const [key, value] of form.entries()) if (typeof value === 'string') fields[key] = value;
  fields.fullName = account.name;
  fields.phone = account.phone;
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
  await prisma.crewApplication.create({ data: { ...parsed.data, ref, resumePath, resumeName, crewAccountId: account.id } });
  await notify(TOPIC_ADMIN);
  await createNotification({
    to: 'admin', title: `New crew application ${ref}`, body: `${account.name} applied as ${parsed.data.role}.`, link: '/admin/crew',
    actor: { kind: 'crew', id: account.id, name: account.name },
  });
  await createNotification({ to: 'crew', toId: account.id, title: 'Application received', body: `Your application ${ref} has been sent. We will update you here when its status changes.`, link: '/crew' });
  return NextResponse.json({ ok: true, ref });
}

// Admin: list applications. The storage key is replaced by a yes/no flag.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const rows = await prisma.crewApplication.findMany({ orderBy: { createdAt: 'desc' }, include: { crewAccount: true } });
  return NextResponse.json(rows.map(({ resumePath, crewAccount, ...row }) => ({
    ...row, hasResume: !!resumePath,
    // Only what the admin needs to reach the person; never the password hash.
    account: crewAccount ? { id: crewAccount.id, email: crewAccount.email } : null,
  })));
}

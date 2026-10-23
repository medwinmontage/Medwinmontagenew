import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { savePublicFile, sniffType, StorageError, usingSupabaseStorage, MAX_VIDEO_BYTES } from '@/lib/storage';
import { VIDEO_FILE_TYPES } from '@/lib/media';

// Admin-only video upload for LOCAL storage (development, or a server with a disk).
// With Supabase configured the browser uploads directly instead (see ./sign), because
// serverless hosts limit request bodies to a few MB.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  if (usingSupabaseStorage()) return NextResponse.json({ error: 'Videos upload directly to storage — please use the upload button on the Videos page.' }, { status: 400 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || !(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.size > MAX_VIDEO_BYTES) return NextResponse.json({ error: `The video must be ${Math.round(MAX_VIDEO_BYTES / 1048576)} MB or smaller.` }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = sniffType(buffer); // judged by content, not by file name
  if (kind !== 'mp4' && kind !== 'webm' && kind !== 'mov') return NextResponse.json({ error: 'Please upload an MP4, WebM or MOV video.' }, { status: 400 });
  try {
    return NextResponse.json({ url: await savePublicFile(buffer, kind, VIDEO_FILE_TYPES[kind], 'videos') });
  } catch (e) {
    return NextResponse.json({ error: e instanceof StorageError ? e.message : 'Upload failed' }, { status: 503 });
  }
}

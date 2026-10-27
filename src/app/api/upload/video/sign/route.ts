import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { createSignedUpload, StorageError, MAX_VIDEO_BYTES } from '@/lib/storage';
import { z } from 'zod';

const bodySchema = z.object({ ext: z.enum(['mp4', 'webm', 'mov']), size: z.number().int().positive() }).strict();

// Admin only: asks for a one-time upload URL. `mode: "local"` means the server has no
// Supabase Storage configured and the browser should post the file to /api/upload/video.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const parsed = bodySchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Please choose an MP4, WebM or MOV video.' }, { status: 400 });
  if (parsed.data.size > MAX_VIDEO_BYTES) return NextResponse.json({ error: `The video must be ${Math.round(MAX_VIDEO_BYTES / 1048576)} MB or smaller.` }, { status: 400 });
  try {
    return NextResponse.json({ ...(await createSignedUpload(parsed.data.ext, 'videos')), maxBytes: MAX_VIDEO_BYTES });
  } catch (e) {
    return NextResponse.json({ error: e instanceof StorageError ? e.message : 'Upload could not be started' }, { status: 503 });
  }
}

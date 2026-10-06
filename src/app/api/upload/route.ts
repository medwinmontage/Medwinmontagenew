import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/session';
import { savePublicFile, sniffType, StorageError } from '@/lib/storage';

const MAX_SIZE = 4 * 1024 * 1024; // 4 MB
const TYPES: Record<string, string> = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp', gif: 'image/gif' };

// Admin-only image upload for banners and the logo.
// Goes to Supabase Storage when it is configured (required on Vercel), or to
// public/uploads on a local machine. The type is checked from the file's own
// bytes; SVG is not accepted because it can carry scripts.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const formData = await req.formData().catch(() => null);
  const file = formData?.get('file');
  if (!file || !(file instanceof File)) return NextResponse.json({ error: 'No file provided' }, { status: 400 });
  if (file.size > MAX_SIZE) return NextResponse.json({ error: 'File must be under 4MB' }, { status: 400 });

  const buffer = Buffer.from(await file.arrayBuffer());
  const kind = sniffType(buffer);
  if (!kind || !(kind in TYPES)) return NextResponse.json({ error: 'Only JPEG, PNG, WebP or GIF images are allowed' }, { status: 400 });

  const folder = formData?.get('folder') === 'logo' ? 'logo' : 'banners';
  try {
    const url = await savePublicFile(buffer, kind, TYPES[kind], folder);
    return NextResponse.json({ url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof StorageError ? e.message : 'Upload failed' }, { status: 503 });
  }
}

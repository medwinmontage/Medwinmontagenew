// Browser-only: uploads a video chosen on the admin's own device.
import { VIDEO_FILE_TYPES } from './media';

export type VideoExt = 'mp4' | 'webm' | 'mov';

/** Looks at the file's first bytes (the server can't, for direct-to-storage uploads). */
export async function sniffVideo(file: File): Promise<VideoExt | null> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const ascii = (a: number, b: number) => String.fromCharCode(...head.slice(a, b));
  if (head.length >= 12 && ascii(4, 8) === 'ftyp') return ascii(8, 12) === 'qt  ' ? 'mov' : 'mp4';
  if (head[0] === 0x1a && head[1] === 0x45 && head[2] === 0xdf && head[3] === 0xa3) return 'webm';
  return null;
}

type Signed =
  | { mode: 'supabase'; bucket: string; path: string; token: string; publicUrl: string; maxBytes: number }
  | { mode: 'local'; maxBytes: number };

/** Uploads the file and returns its public URL. Throws an Error with a message fit to show the admin. */
export async function uploadVideoFile(file: File): Promise<string> {
  const ext = await sniffVideo(file);
  if (!ext) throw new Error('That file is not an MP4, WebM or MOV video.');

  const signRes = await fetch('/api/upload/video/sign', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ext, size: file.size }) }).catch(() => null);
  const signed = (await signRes?.json().catch(() => null)) as (Signed & { error?: string }) | null;
  if (!signRes?.ok || !signed) throw new Error(signed?.error || 'The upload could not be started. Please try again.');

  if (signed.mode === 'local') {
    const fd = new FormData(); fd.append('file', file);
    const res = await fetch('/api/upload/video', { method: 'POST', body: fd }).catch(() => null);
    const data = await res?.json().catch(() => ({}));
    if (!res?.ok) throw new Error(data?.error || 'The upload failed. Please try again.');
    return data.url as string;
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL, anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set for video uploads (see README).');
  const { createClient } = await import('@supabase/supabase-js');
  const client = createClient(url, anon, { auth: { persistSession: false, autoRefreshToken: false } });
  const { error } = await client.storage.from(signed.bucket).uploadToSignedUrl(signed.path, signed.token, file, { contentType: VIDEO_FILE_TYPES[ext] });
  if (error) throw new Error(`Storage refused the upload: ${error.message}. Check that the bucket allows video files (see README).`);
  return signed.publicUrl;
}

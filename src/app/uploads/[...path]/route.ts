import { NextRequest, NextResponse } from 'next/server';
import { readLocalPublic, usingSupabaseStorage } from '@/lib/storage';

// Serves files uploaded to the local disk (no Supabase configured).
//
// Next.js serves public/ files that existed when the app was BUILT; a file the admin
// uploads afterwards would 404 under `npm start`. This route covers that case. Files
// that were already in public/uploads at build time are still served by Next first.
// It supports Range requests, which browsers need to play and seek video.
export const dynamic = 'force-dynamic';

const TYPES: Record<string, string> = {
  png: 'image/png', jpg: 'image/jpeg', webp: 'image/webp', gif: 'image/gif',
  mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime',
};

export async function GET(req: NextRequest, ctx: { params: Promise<{ path: string[] }> }) {
  const params = await ctx.params;
  if (usingSupabaseStorage()) return new NextResponse('Not found', { status: 404 });
  const key = params.path.join('/');
  const ext = key.split('.').pop() || '';
  const type = TYPES[ext];
  const data = type ? await readLocalPublic(key) : null; // readLocalPublic only accepts our own folder/hex.ext keys
  if (!data || !type) return new NextResponse('Not found', { status: 404 });

  const headers: Record<string, string> = { 'Content-Type': type, 'Accept-Ranges': 'bytes', 'Cache-Control': 'public, max-age=31536000, immutable', 'X-Content-Type-Options': 'nosniff' };
  const range = /^bytes=(\d*)-(\d*)$/.exec(req.headers.get('range') || '');
  if (range && (range[1] || range[2])) {
    const total = data.length;
    let start = range[1] ? parseInt(range[1], 10) : total - parseInt(range[2], 10);
    let end = range[1] && range[2] ? parseInt(range[2], 10) : total - 1;
    start = Math.max(0, start); end = Math.min(end, total - 1);
    if (start > end || start >= total) return new NextResponse(null, { status: 416, headers: { 'Content-Range': `bytes */${total}` } });
    return new NextResponse(new Uint8Array(data.subarray(start, end + 1)), { status: 206, headers: { ...headers, 'Content-Range': `bytes ${start}-${end}/${total}`, 'Content-Length': String(end - start + 1) } });
  }
  return new NextResponse(new Uint8Array(data), { status: 200, headers: { ...headers, 'Content-Length': String(data.length) } });
}

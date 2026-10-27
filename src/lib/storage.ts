import 'server-only';
import crypto from 'crypto';
import path from 'path';
import { mkdir, readFile, writeFile, unlink } from 'fs/promises';

// File storage with two back ends:
//  - Supabase Storage when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are set
//    (required on Vercel, whose filesystem is read-only and not persistent);
//  - the local disk otherwise, so the project runs in VS Code with no setup.
//
// Two buckets: a PUBLIC one for banner images and the logo, and a PRIVATE one
// for resumes. Private files are only ever handed out by an admin-only route.
// The service-role key is used on the server only and never reaches the browser.

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const PUBLIC_BUCKET = process.env.SUPABASE_PUBLIC_BUCKET || 'public-media';
export const PRIVATE_BUCKET = process.env.SUPABASE_PRIVATE_BUCKET || 'private-files';

export const usingSupabaseStorage = () => !!(SUPABASE_URL && SERVICE_KEY);

const LOCAL_PUBLIC_DIR = path.join(process.cwd(), 'public', 'uploads');
const LOCAL_PRIVATE_DIR = path.join(process.cwd(), '.private-uploads');

export class StorageError extends Error {}

function randomKey(ext: string, folder: string) {
  return `${folder}/${crypto.randomBytes(16).toString('hex')}.${ext}`;
}

async function supabaseUpload(bucket: string, key: string, data: Buffer, contentType: string) {
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucket}/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY, 'Content-Type': contentType, 'x-upsert': 'false' },
    body: new Uint8Array(data),
  });
  if (!res.ok) {
    console.error('Supabase Storage upload failed', res.status, await res.text().catch(() => ''));
    throw new StorageError('The file could not be stored. Check the storage bucket setup.');
  }
}

async function localWrite(dir: string, key: string, data: Buffer) {
  try {
    const full = path.join(dir, key);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, data);
  } catch (e) {
    console.error('Local upload failed', e);
    throw new StorageError('File storage is not configured. Set the Supabase storage variables (see README).');
  }
}

/** Stores a file anyone may see (banner, logo) and returns its URL. */
export async function savePublicFile(data: Buffer, ext: string, contentType: string, folder = 'banners'): Promise<string> {
  const key = randomKey(ext, folder);
  if (usingSupabaseStorage()) {
    await supabaseUpload(PUBLIC_BUCKET, key, data, contentType);
    return `${SUPABASE_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/${key}`;
  }
  await localWrite(LOCAL_PUBLIC_DIR, key, data);
  return `/uploads/${key}`;
}

/** Stores a file only admins may open (resume) and returns its storage key. */
export async function savePrivateFile(data: Buffer, ext: string, contentType: string, folder = 'resumes'): Promise<string> {
  const key = randomKey(ext, folder);
  if (usingSupabaseStorage()) await supabaseUpload(PRIVATE_BUCKET, key, data, contentType);
  else await localWrite(LOCAL_PRIVATE_DIR, key, data);
  return key;
}

const SAFE_KEY = /^[a-z0-9]+\/[a-f0-9]{32}\.[a-z0-9]{2,5}$/;

/**
 * Returns either a short-lived signed URL (Supabase) or the file bytes (local).
 * Call this only after checking the caller is an admin.
 */
export async function openPrivateFile(key: string): Promise<{ url: string } | { data: Buffer } | null> {
  if (!SAFE_KEY.test(key)) return null;
  if (usingSupabaseStorage()) {
    const res = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${PRIVATE_BUCKET}/${key}`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY, 'Content-Type': 'application/json' },
      body: JSON.stringify({ expiresIn: 60 }),
    });
    if (!res.ok) return null;
    const { signedURL } = (await res.json()) as { signedURL?: string };
    return signedURL ? { url: `${SUPABASE_URL}/storage/v1${signedURL}` } : null;
  }
  try {
    return { data: await readFile(path.join(LOCAL_PRIVATE_DIR, key)) };
  } catch {
    return null;
  }
}

export async function deletePrivateFile(key: string): Promise<void> {
  if (!SAFE_KEY.test(key)) return;
  try {
    if (usingSupabaseStorage()) {
      await fetch(`${SUPABASE_URL}/storage/v1/object/${PRIVATE_BUCKET}/${key}`, {
        method: 'DELETE', headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY },
      });
    } else {
      await unlink(path.join(LOCAL_PRIVATE_DIR, key));
    }
  } catch { /* the database row is the source of truth; a leftover file is harmless */ }
}

/** Checks the first bytes of an upload against the type the browser claimed. */
export function sniffType(data: Buffer): 'png' | 'jpg' | 'webp' | 'gif' | 'pdf' | 'doc' | 'docx' | 'mp4' | 'mov' | 'webm' | null {
  const hex = data.subarray(0, 12).toString('hex');
  // Video containers: MP4 / QuickTime start with a "ftyp" box; WebM (Matroska) with an EBML header.
  if (data.length >= 12 && data.subarray(4, 8).toString('ascii') === 'ftyp') return data.subarray(8, 12).toString('ascii') === 'qt  ' ? 'mov' : 'mp4';
  if (hex.startsWith('1a45dfa3')) return 'webm';
  if (hex.startsWith('89504e470d0a1a0a')) return 'png';
  if (hex.startsWith('ffd8ff')) return 'jpg';
  if (hex.startsWith('52494646') && data.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  if (hex.startsWith('474946383761') || hex.startsWith('474946383961')) return 'gif';
  if (hex.startsWith('25504446')) return 'pdf';
  if (hex.startsWith('d0cf11e0a1b11ae1')) return 'doc';
  if (hex.startsWith('504b0304')) return 'docx';
  return null;
}

// ---------------------------------------------------------------------------
// Videos. They can be large, and Vercel rejects request bodies over ~4.5 MB, so
// with Supabase the admin's browser uploads straight to Storage using a one-time
// signed URL created here (the service-role key never leaves the server).
// Without Supabase (local development) the file goes through /api/upload/video.
// ---------------------------------------------------------------------------

export const MAX_VIDEO_BYTES = Number(process.env.MAX_VIDEO_MB || 50) * 1024 * 1024; // Supabase's free plan allows 50 MB per file

export type SignedUpload =
  | { mode: 'supabase'; bucket: string; path: string; token: string; publicUrl: string }
  | { mode: 'local' };

export async function createSignedUpload(ext: string, folder: 'videos'): Promise<SignedUpload> {
  if (!usingSupabaseStorage()) return { mode: 'local' };
  const key = randomKey(ext, folder);
  const res = await fetch(`${SUPABASE_URL}/storage/v1/object/upload/sign/${PUBLIC_BUCKET}/${key}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY, 'Content-Type': 'application/json' },
    body: '{}',
  });
  if (!res.ok) {
    console.error('Supabase signed upload failed', res.status, await res.text().catch(() => ''));
    throw new StorageError('A video upload could not be started. Check the storage bucket setup.');
  }
  const { url } = (await res.json()) as { url?: string };
  const token = url ? new URL(url, SUPABASE_URL).searchParams.get('token') : null;
  if (!token) throw new StorageError('A video upload could not be started. Check the storage bucket setup.');
  return { mode: 'supabase', bucket: PUBLIC_BUCKET, path: key, token, publicUrl: `${SUPABASE_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/${key}` };
}

const OWN_KEY = /^(videos|posters|banners|logo)\/[a-f0-9]{32}\.[a-z0-9]{2,5}$/;

/** True when `url` points at a file this site stored itself (so it is safe to trust and to delete). */
export function ownedKey(url: string, folder?: string): string | null {
  let key = '';
  if (url.startsWith('/uploads/')) key = url.slice('/uploads/'.length);
  else if (SUPABASE_URL && url.startsWith(`${SUPABASE_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/`)) key = url.slice(`${SUPABASE_URL}/storage/v1/object/public/${PUBLIC_BUCKET}/`.length);
  if (!OWN_KEY.test(key)) return null;
  return !folder || key.startsWith(`${folder}/`) ? key : null;
}

/** Best-effort removal of a file this site stored. A leftover file is harmless, so failures are ignored. */
export async function deleteOwnedFile(url: string | null | undefined): Promise<void> {
  const key = url ? ownedKey(url) : null;
  if (!key) return;
  try {
    if (usingSupabaseStorage()) {
      await fetch(`${SUPABASE_URL}/storage/v1/object/${PUBLIC_BUCKET}/${key}`, { method: 'DELETE', headers: { Authorization: `Bearer ${SERVICE_KEY}`, apikey: SERVICE_KEY } });
    } else {
      await unlink(path.join(LOCAL_PUBLIC_DIR, key));
    }
  } catch { /* ignore */ }
}

/** Reads a locally stored public file (used by the /uploads route in production, where Next only serves files that existed at build time). */
export async function readLocalPublic(key: string): Promise<Buffer | null> {
  if (!OWN_KEY.test(key)) return null;
  try { return await readFile(path.join(LOCAL_PUBLIC_DIR, key)); } catch { return null; }
}
export const LOCAL_PUBLIC_ROOT = LOCAL_PUBLIC_DIR;

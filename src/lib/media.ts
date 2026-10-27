// Video links, shared by the browser and the server (no server-only imports).
//
// What can play on the site:
//   file    – an .mp4 / .webm / .mov / .m4v file (uploaded here, or any direct https link)
//   youtube – a YouTube link, played through the privacy-friendly youtube-nocookie.com embed
//   vimeo   – a Vimeo link, played through player.vimeo.com in "background" mode
//
// The ids are matched strictly (11 characters / digits only) because they are
// placed inside an iframe URL.

export type VideoSource = 'upload' | 'youtube' | 'vimeo' | 'url';
export type ParsedVideo =
  | { kind: 'file'; src: string }
  | { kind: 'youtube'; id: string }
  | { kind: 'vimeo'; id: string };

const YT_ID = /^[A-Za-z0-9_-]{11}$/;
const VIMEO_ID = /^\d{5,12}$/;
const FILE_EXT = /\.(mp4|webm|mov|m4v)(?:$|[?#])/i;

export const VIDEO_FILE_TYPES: Record<string, string> = { mp4: 'video/mp4', webm: 'video/webm', mov: 'video/quicktime' };

function asUrl(raw: string): URL | null {
  try { return new URL(raw.trim()); } catch { return null; }
}

export function parseVideoUrl(raw: string | null | undefined): ParsedVideo | null {
  if (!raw) return null;
  const value = raw.trim();
  // Files stored by this site.
  if (value.startsWith('/uploads/')) return FILE_EXT.test(value) ? { kind: 'file', src: value } : null;

  const u = asUrl(value);
  if (!u || (u.protocol !== 'https:' && u.protocol !== 'http:')) return null;
  const host = u.hostname.replace(/^www\./, '').replace(/^m\./, '');

  if (host === 'youtube.com' || host === 'youtube-nocookie.com') {
    const parts = u.pathname.split('/').filter(Boolean);
    const id = u.searchParams.get('v') || (['embed', 'shorts', 'live', 'v'].includes(parts[0]) ? parts[1] : '');
    return id && YT_ID.test(id) ? { kind: 'youtube', id } : null;
  }
  if (host === 'youtu.be') {
    const id = u.pathname.split('/').filter(Boolean)[0] || '';
    return YT_ID.test(id) ? { kind: 'youtube', id } : null;
  }
  if (host === 'vimeo.com' || host === 'player.vimeo.com') {
    const id = u.pathname.split('/').filter(Boolean).find((p) => VIMEO_ID.test(p)) || '';
    return id ? { kind: 'vimeo', id } : null;
  }
  // Any other host: only a direct link to a video file, and only over https
  // (an http file would be blocked as mixed content on an https site).
  if (u.protocol === 'https:' && FILE_EXT.test(u.pathname + u.search)) return { kind: 'file', src: u.toString() };
  return null;
}

export function embedUrl(v: ParsedVideo): string | null {
  if (v.kind === 'youtube') {
    return `https://www.youtube-nocookie.com/embed/${v.id}?autoplay=1&mute=1&loop=1&playlist=${v.id}&controls=0&playsinline=1&rel=0&modestbranding=1&iv_load_policy=3`;
  }
  if (v.kind === 'vimeo') {
    return `https://player.vimeo.com/video/${v.id}?background=1&autoplay=1&muted=1&loop=1&playsinline=1`;
  }
  return null;
}

/** Thumbnail YouTube serves for any video (no API key needed). */
export function youtubePoster(id: string): string {
  return `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;
}

/** Checks an admin-entered link against the chosen source. Returns an error message, or '' when fine. */
export function checkVideoSource(source: VideoSource, url: string): string {
  const v = parseVideoUrl(url);
  if (source === 'youtube') return v?.kind === 'youtube' ? '' : 'Please paste a YouTube link, for example https://www.youtube.com/watch?v=… or https://youtu.be/…';
  if (source === 'vimeo') return v?.kind === 'vimeo' ? '' : 'Please paste a Vimeo link, for example https://vimeo.com/123456789';
  if (source === 'url') return v?.kind === 'file' && url.trim().startsWith('https://') ? '' : 'Please paste a direct https link to an .mp4 or .webm file.';
  return v?.kind === 'file' ? '' : 'Please upload a video file first.';
}

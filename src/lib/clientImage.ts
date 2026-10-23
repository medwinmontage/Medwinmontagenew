// Browser-only helpers for admin uploads. Never import this from server code.

const MAX_SIDE = 2400; // longest edge, in pixels — plenty for a full-width banner on a 4K screen
const SAFE_BYTES = 3.5 * 1024 * 1024; // the server accepts 4 MB; stay under it

async function decode(file: Blob): Promise<{ draw: (c: CanvasRenderingContext2D, w: number, h: number) => void; width: number; height: number; close: () => void }> {
  if (typeof createImageBitmap === 'function') {
    // 'from-image' applies the phone's EXIF rotation so portrait photos don't come out sideways.
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions);
    return { width: bmp.width, height: bmp.height, draw: (c, w, h) => c.drawImage(bmp, 0, 0, w, h), close: () => bmp.close() };
  }
  const url = URL.createObjectURL(file);
  const img = new Image();
  await new Promise<void>((ok, bad) => { img.onload = () => ok(); img.onerror = () => bad(new Error('decode')); img.src = url; });
  return { width: img.naturalWidth, height: img.naturalHeight, draw: (c, w, h) => c.drawImage(img, 0, 0, w, h), close: () => URL.revokeObjectURL(url) };
}

const toBlob = (c: HTMLCanvasElement, type: string, q?: number) => new Promise<Blob | null>((ok) => c.toBlob(ok, type, q));
const rename = (name: string, ext: string) => name.replace(/\.[^.]+$/, '') + '.' + ext;

/**
 * Makes a photo fit the upload limits and sensible display sizes: very large
 * images (a phone camera photo is often 8–12 MB) are scaled down and re-saved as
 * WebP/PNG, small ones are left exactly as they are. GIFs are never touched
 * (re-encoding would drop the animation). If anything fails the original is returned
 * and the server's own limits decide.
 */
export async function prepareImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file;
  try {
    const src = await decode(file);
    const scale = Math.min(1, MAX_SIDE / Math.max(src.width, src.height));
    if (scale === 1 && file.size <= SAFE_BYTES) { src.close(); return file; }

    let w = Math.max(1, Math.round(src.width * scale));
    let h = Math.max(1, Math.round(src.height * scale));
    const canvas = document.createElement('canvas');
    for (let attempt = 0; attempt < 4; attempt++) {
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) break;
      src.draw(ctx, w, h);
      // Keep PNG for PNG (it may have transparency, e.g. a logo) unless it is still too big.
      const blob = (file.type === 'image/png' && attempt === 0 ? await toBlob(canvas, 'image/png') : null) ?? await toBlob(canvas, 'image/webp', attempt === 0 ? 0.88 : 0.78);
      if (blob && blob.size <= SAFE_BYTES) {
        src.close();
        const ext = blob.type === 'image/png' ? 'png' : 'webp';
        return new File([blob], rename(file.name, ext), { type: blob.type });
      }
      w = Math.round(w * 0.8); h = Math.round(h * 0.8);
    }
    src.close();
    return file;
  } catch {
    return file;
  }
}

/** Grabs a frame near the start of a local video as a JPEG poster. Returns null if the browser can't decode it. */
export async function capturePoster(file: File): Promise<File | null> {
  const url = URL.createObjectURL(file);
  try {
    const video = document.createElement('video');
    video.muted = true; video.playsInline = true; video.preload = 'auto'; video.src = url;
    await new Promise<void>((ok, bad) => {
      const t = setTimeout(() => bad(new Error('timeout')), 9000);
      video.onloadeddata = () => { clearTimeout(t); ok(); };
      video.onerror = () => { clearTimeout(t); bad(new Error('decode')); };
    });
    const target = Math.min(1, (video.duration || 2) * 0.1);
    await new Promise<void>((ok) => { video.onseeked = () => ok(); video.currentTime = target; });
    const scale = Math.min(1, 960 / (video.videoWidth || 960));
    const canvas = document.createElement('canvas');
    canvas.width = Math.max(1, Math.round(video.videoWidth * scale));
    canvas.height = Math.max(1, Math.round(video.videoHeight * scale));
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const blob = await toBlob(canvas, 'image/jpeg', 0.82);
    return blob ? new File([blob], rename(file.name, 'jpg'), { type: 'image/jpeg' }) : null;
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

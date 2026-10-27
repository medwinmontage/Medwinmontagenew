// Helpers for the clickable phone / WhatsApp / banner links on the public site.

export const WHATSAPP_ENQUIRY_MESSAGE = 'Hi, Need enquiry of services provided by Medwin Montage';

/** "+91 94878 97160" → "tel:+919487897160". Returns null if there are too few digits to dial. */
export function telHref(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const trimmed = phone.trim();
  const digits = trimmed.replace(/\D/g, '');
  if (digits.length < 7) return null;
  return `tel:${trimmed.startsWith('+') ? '+' : ''}${digits}`;
}

/** Digits only, with country code. A bare 10-digit Indian mobile number gets 91 added. */
export function whatsappDigits(number: string | null | undefined): string | null {
  if (!number) return null;
  let digits = number.replace(/\D/g, '').replace(/^0+/, '');
  if (digits.length === 10) digits = `91${digits}`;
  return digits.length >= 10 && digits.length <= 15 ? digits : null;
}

export function whatsappHref(number: string | null | undefined, message: string = WHATSAPP_ENQUIRY_MESSAGE): string | null {
  const digits = whatsappDigits(number);
  return digits ? `https://wa.me/${digits}?text=${encodeURIComponent(message)}` : null;
}

/** Only http(s) URLs. Blocks javascript:, data:, vbscript: and anything else. */
export function isSafeExternalUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' || u.protocol === 'http:';
  } catch {
    return false;
  }
}

/** A same-site path such as /join-as-crew or /#packages. Never protocol-relative (//evil.com). */
export function isSafeInternalPath(value: string): boolean {
  return /^\/(?!\/)[A-Za-z0-9\-._~/#?=&%]*$/.test(value);
}

export type BannerLike = { enabled: boolean; startAt: Date | string | null; endAt: Date | string | null };
export type BannerState = 'DISABLED' | 'UPCOMING' | 'EXPIRED' | 'ACTIVE';

export function bannerState(b: BannerLike, now: number = Date.now()): BannerState {
  if (!b.enabled) return 'DISABLED';
  if (b.startAt && new Date(b.startAt).getTime() > now) return 'UPCOMING';
  if (b.endAt && new Date(b.endAt).getTime() <= now) return 'EXPIRED';
  return 'ACTIVE';
}

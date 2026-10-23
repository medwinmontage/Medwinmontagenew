// Client-side only — no secrets involved, just building a wa.me deep link.
// Browsers can't silently send WhatsApp messages without the user pressing
// send themselves, so this opens WhatsApp with the message pre-filled,
// which is the maximum browser-safe automation possible.
export const WHATSAPP_NUMBER = '919487897160';

/** `number` is the one set in Admin → Site Settings; the constant above is only the fallback. */
export function openWhatsApp(message: string, number?: string | null) {
  const digits = (number || '').replace(/\D/g, '');
  const url = `https://wa.me/${digits.length >= 10 ? (digits.length === 10 ? `91${digits}` : digits) : WHATSAPP_NUMBER}?text=${encodeURIComponent(message)}`;
  window.open(url, '_blank', 'noopener');
}

export function buildEventWhatsAppMessage(b: {
  eventType: string; eventDate: string; eventTime?: string; location: string;
  budget?: string; notes?: string; name: string; phone: string; email?: string; ref: string;
}) {
  return [
    `Event type - ${b.eventType}`,
    `Preferred date - ${b.eventDate}`,
    `Preferred time - ${b.eventTime || 'Not specified'}`,
    `Location - ${b.location}`,
    `Budget - ${b.budget || 'Not specified'}`,
    `Additional notes - ${b.notes || 'null'}`,
    `Name - ${b.name}`,
    `Phone - ${b.phone}`,
    `Email - ${b.email || 'null'}`,
    `Reference Id - ${b.ref}`,
  ].join('\n');
}

export function buildServiceWhatsAppMessage(contact: {
  name: string; phone: string; email?: string; location: string; company?: string; gst?: string;
}, categories: string[], ref: string) {
  return [
    `Services Selected - ${categories.join(', ')}`,
    `Full name - ${contact.name}`,
    `Phone - ${contact.phone}`,
    `Email - ${contact.email || 'null'}`,
    `Location - ${contact.location}`,
    `Company name - ${contact.company || 'null'}`,
    `GST number - ${contact.gst || 'null'}`,
    `Reference Id - ${ref}`,
  ].join('\n');
}

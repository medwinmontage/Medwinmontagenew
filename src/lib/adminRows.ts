import type { Booking, Lead } from '@prisma/client';
import { normalizeStatus } from './status';

// Booking (events) and Lead (service / offer requests) shown in one table shape.
export type UnifiedRow = {
  id: string; ref: string; source: 'booking' | 'lead'; bookingType: string; status: string; previousStatus: string;
  name: string; email: string; phone: string; serviceOrEvent: string; date: string; time: string; location: string;
  adminNotes: string; createdAt: string; updatedAt: string;
};

export const bookingRow = (b: Booking): UnifiedRow => ({
  id: b.id, ref: b.ref, source: 'booking', bookingType: 'Event Booking', status: normalizeStatus(b.status), previousStatus: b.previousStatus || '',
  name: b.name, email: b.email, phone: b.phone, serviceOrEvent: b.eventType, date: b.eventDate, time: b.eventTime || '', location: b.location,
  adminNotes: b.adminNotes || '', createdAt: b.createdAt.toISOString(), updatedAt: (b.statusUpdatedAt || b.updatedAt).toISOString(),
});

export const leadRow = (l: Lead): UnifiedRow => ({
  id: l.id, ref: l.ref, source: 'lead', bookingType: l.mode === 'offer' ? 'Offer Booking' : 'Service Booking', status: normalizeStatus(l.status), previousStatus: l.previousStatus || '',
  name: l.name, email: l.email, phone: l.phone, serviceOrEvent: (l.categories || []).join(', '), date: '', time: '', location: l.location,
  adminNotes: l.adminNotes || '', createdAt: l.createdAt.toISOString(), updatedAt: (l.statusUpdatedAt || l.updatedAt).toISOString(),
});

export const byNewest = (a: UnifiedRow, b: UnifiedRow) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

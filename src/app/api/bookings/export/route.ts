import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/session';
import ExcelJS from 'exceljs';
import { normalizeStatus } from '@/lib/status';

export const dynamic = 'force-dynamic';

// Merges Booking (Event Booking) + Lead (Service/Offer Booking) into one
// unified export — same normalization the admin table itself uses, so what
// you see on screen matches what you download.
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [bookings, leads] = await Promise.all([
    prisma.booking.findMany({ orderBy: { createdAt: 'desc' } }),
    prisma.lead.findMany({ orderBy: { createdAt: 'desc' } }),
  ]);

  type Row = {
    id: string; bookingType: string; name: string; email: string; phone: string;
    serviceOrEvent: string; date: string; time: string; location: string;
    budget: string; message: string; status: string; created: Date;
  };
  const rows: Row[] = [
    ...bookings.map((b): Row => ({
      id: b.ref, bookingType: 'Event Booking', name: b.name, email: b.email, phone: b.phone,
      serviceOrEvent: b.eventType, date: b.eventDate, time: b.eventTime || '', location: b.location,
      budget: b.budget || '', message: b.notes || '', status: normalizeStatus(b.status), created: b.createdAt,
    })),
    ...leads.map((l): Row => ({
      id: l.ref, bookingType: l.mode === 'offer' ? 'Offer Booking' : 'Service Booking',
      name: l.name, email: l.email, phone: l.phone,
      serviceOrEvent: (l.categories || []).join(', '), date: '', time: '', location: l.location,
      budget: '', message: '', status: normalizeStatus(l.status), created: l.createdAt,
    })),
  ].sort((a, b) => b.created.getTime() - a.created.getTime());

  const wb = new ExcelJS.Workbook();
  wb.creator = 'Medwin Montage Admin Panel';
  const ws = wb.addWorksheet('Bookings');

  ws.columns = [
    { header: 'Booking ID', key: 'id', width: 14 },
    { header: 'Booking Type', key: 'bookingType', width: 16 },
    { header: 'Customer Name', key: 'name', width: 22 },
    { header: 'Email', key: 'email', width: 26 },
    { header: 'Phone Number', key: 'phone', width: 16 },
    { header: 'Service / Event / Offer', key: 'serviceOrEvent', width: 30 },
    { header: 'Date', key: 'date', width: 12 },
    { header: 'Time', key: 'time', width: 10 },
    { header: 'Location', key: 'location', width: 22 },
    { header: 'Budget', key: 'budget', width: 14 },
    { header: 'Requirements / Message', key: 'message', width: 32 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Created Date & Time', key: 'created', width: 20 },
  ];
  ws.getRow(1).font = { bold: true };
  ws.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFF6A00' } };

  rows.forEach(r => {
    ws.addRow({ ...r, created: r.created.toLocaleString() });
  });

  const buffer = await wb.xlsx.writeBuffer();
  const stamp = new Date().toISOString().slice(0, 10);
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="medwin-montage-bookings-${stamp}.xlsx"`,
    },
  });
}

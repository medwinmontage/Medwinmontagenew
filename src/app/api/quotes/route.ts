import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin, getCustomerSession } from '@/lib/session';
import { quoteSchema } from '@/lib/validators';
import { nextQuoteRef } from '@/lib/refCounter';
import { notify, TOPIC_ADMIN, customerTopic } from '@/lib/realtime';

export const dynamic = 'force-dynamic';
import { rateLimit, clientKey } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  const limited = rateLimit(`quote:${clientKey(req)}`, 5, 10 * 60 * 1000); // 5 per 10 min per IP
  if (!limited.ok) return NextResponse.json({ error: 'Too many requests — please try again later.' }, { status: 429 });

  const body = await req.json().catch(() => null);
  const parsed = quoteSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 });
  }
  const customer = await getCustomerSession();
  const quote = await prisma.quoteRequest.create({
    data: { ...parsed.data, ref: await nextQuoteRef(), customerId: customer?.sub },
  });
  await notify(TOPIC_ADMIN, customer?.sub && customerTopic(customer.sub));
  return NextResponse.json({ ok: true, ref: quote.ref });
}

export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const quotes = await prisma.quoteRequest.findMany({ orderBy: { createdAt: 'desc' } });
  return NextResponse.json(quotes);
}

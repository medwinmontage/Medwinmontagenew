import { NextRequest, NextResponse } from 'next/server';
import { requireCustomer, requireCrew } from '@/lib/session';
import { userMessageSchema, firstError } from '@/lib/validators';
import { rateLimit } from '@/lib/rateLimit';
import { createNotification } from '@/lib/notifications';

// A signed-in customer or crew member writes to the admin. The sender's name and
// id come from the session; the request can only supply the text.
export async function POST(req: NextRequest) {
  const kind = req.nextUrl.searchParams.get('kind');
  if (kind !== 'customer' && kind !== 'crew') return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  const sender = kind === 'customer' ? await requireCustomer() : await requireCrew();
  if (!sender) return NextResponse.json({ error: 'Please log in to send a message.' }, { status: 401 });
  if (!rateLimit(`msg:${kind}:${sender.id}`, 10, 60 * 60 * 1000).ok) {
    return NextResponse.json({ error: 'You have sent several messages recently — please wait a little before sending another.' }, { status: 429 });
  }
  const parsed = userMessageSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: firstError(parsed.error) }, { status: 400 });

  await createNotification({
    to: 'admin',
    title: parsed.data.title || `Message from ${sender.name}`,
    body: parsed.data.body,
    link: kind === 'customer' ? '/admin/customers' : '/admin/crew',
    actor: { kind, id: sender.id, name: sender.name },
  });
  return NextResponse.json({ ok: true });
}

import 'server-only';
import { prisma } from './prisma';
import { notify, TOPIC_ADMIN, customerTopic, crewTopic } from './realtime';

// In-app notifications between the admin panel, customers and crew.
//
// Rows are written here; the live ping goes out over the existing Realtime
// channel (a content-free "something changed" message); the recipient's browser
// then fetches its own notifications through /api/notifications, which checks the
// session. The text never travels over the public channel.

export type Audience = 'admin' | 'customer' | 'crew';
export const ADMIN_INBOX = 'admin';

export function topicFor(kind: Audience, id: string): string {
  return kind === 'admin' ? TOPIC_ADMIN : kind === 'customer' ? customerTopic(id) : crewTopic(id);
}

type Actor = { kind: 'customer' | 'crew'; id: string; name: string };
type Input = { to: Audience; toId?: string; title: string; body?: string; link?: string; actor?: Actor };

/**
 * Stores one notification and pings its recipient. Never throws: a failed
 * notification must not fail the booking, status change or form that caused it.
 */
export async function createNotification(input: Input): Promise<void> {
  try {
    const recipientId = input.to === 'admin' ? ADMIN_INBOX : input.toId;
    if (!recipientId) return;
    await prisma.notification.create({
      data: {
        recipientKind: input.to, recipientId,
        title: input.title.slice(0, 140), body: (input.body || '').slice(0, 1500), link: input.link || '',
        actorKind: input.actor?.kind ?? null, actorId: input.actor?.id ?? null, actorName: input.actor?.name ?? null,
      },
    });
    await notify(topicFor(input.to, recipientId));
  } catch (e) {
    console.warn('Notification failed', e instanceof Error ? e.message : e);
  }
}

/** One notification for many recipients (admin → all customers / all crew). */
export async function createNotificationForMany(kind: 'customer' | 'crew', ids: string[], data: { title: string; body?: string; link?: string }): Promise<number> {
  if (ids.length === 0) return 0;
  try {
    await prisma.notification.createMany({
      data: ids.map((recipientId) => ({
        recipientKind: kind, recipientId,
        title: data.title.slice(0, 140), body: (data.body || '').slice(0, 1500), link: data.link || '',
      })),
    });
    for (let i = 0; i < ids.length; i += 100) await notify(...ids.slice(i, i + 100).map((id) => topicFor(kind, id)));
    return ids.length;
  } catch (e) {
    console.warn('Bulk notification failed', e instanceof Error ? e.message : e);
    return 0;
  }
}

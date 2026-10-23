'use client';
import { isSafeInternalPath } from '@/lib/links';
import NotificationList from './NotificationList';
import { Kind, Notice, useNotifications } from './useNotifications';

/** Full notification list for a dashboard page (customer portal, crew dashboard). */
export default function NotificationsPanel({ kind, topic }: { kind: Kind; topic: string }) {
  const { items, unread, state, markRead, markAll } = useNotifications(kind, topic, { limit: 50 });
  const open = (n: Notice) => {
    if (!n.read) markRead(n.id);
    if (n.link && isSafeInternalPath(n.link) && n.link !== window.location.pathname) window.location.assign(n.link);
  };
  return (
    <section className="card overflow-hidden" aria-label="Notifications">
      <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
        <h3 className="font-display font-bold text-lg">Notifications {unread > 0 && <span className="badge badge-solid ml-1.5 align-middle">{unread} new</span>}</h3>
        <button type="button" onClick={markAll} disabled={unread === 0} className="btn btn-ghost btn-sm">Mark all read</button>
      </div>
      <NotificationList items={items} onOpen={open} empty={state === 'loading' ? 'Loading…' : state === 'error' ? 'Notifications could not be loaded.' : 'No notifications yet. Updates from the team will appear here live.'} />
    </section>
  );
}

'use client';
import Icon from '@/components/site/Icon';
import { Notice, timeAgo } from './useNotifications';

/** The rows of a notification list. Used in the bell dropdown, the crew dashboard and the admin inbox. */
export default function NotificationList({ items, onOpen, renderAction, empty = 'No notifications yet.' }: {
  items: Notice[]; onOpen: (n: Notice) => void; renderAction?: (n: Notice) => React.ReactNode; empty?: string;
}) {
  if (items.length === 0) return <p className="text-sm text-muted px-4 py-8 text-center">{empty}</p>;
  return (
    <ul className="divide-y divide-line">
      {items.map((n) => (
        <li key={n.id} className={`px-4 py-3 ${n.read ? '' : 'bg-accent/5'}`}>
          <div className="flex items-start gap-3">
            <span aria-hidden className={`mt-1.5 w-2 h-2 rounded-full flex-shrink-0 ${n.read ? 'bg-transparent border border-line-strong' : 'bg-accent shadow-[0_0_8px_rgb(var(--accent-rgb))]'}`} />
            <div className="min-w-0 flex-1">
              <button type="button" onClick={() => onOpen(n)} className="text-left w-full group">
                <span className="block text-sm font-bold break-words group-hover:text-accent-ink">
                  {n.title}{!n.read && <span className="sr-only"> (unread)</span>}
                </span>
                {n.body && <span className="block text-[13px] text-muted mt-0.5 whitespace-pre-wrap break-words line-clamp-4">{n.body}</span>}
              </button>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                <time className="text-[11.5px] text-muted" dateTime={n.createdAt}>{timeAgo(n.createdAt)}</time>
                {n.from?.name && <span className="text-[11.5px] text-muted">from {n.from.name}</span>}
                {n.link && <span className="text-[11.5px] font-bold text-accent-ink inline-flex items-center gap-1">Open <Icon name="arrow-right" className="w-3 h-3" /></span>}
                {renderAction?.(n)}
              </div>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

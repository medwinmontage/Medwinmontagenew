'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Icon from '@/components/site/Icon';
import { isSafeInternalPath } from '@/lib/links';
import NotificationList from './NotificationList';
import { Kind, Notice, useNotifications } from './useNotifications';

type Toast = { title: string; body: string; link: string; more: number };

/**
 * Bell with an unread badge, a dropdown of the latest notifications and a toast
 * when a new one arrives while the page is open. Renders nothing when the visitor
 * is not signed in as `kind`.
 */
export default function NotificationBell({ kind, topic, seeAllHref, className = '' }: { kind: Kind; topic: string; seeAllHref?: string; className?: string }) {
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; width: number }>({ top: 64, left: 12, width: 360 });
  const btnRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const timer = useRef<number | undefined>(undefined);

  const onNew = useCallback((n: Notice, count: number) => {
    setToast({ title: n.title, body: n.body, link: n.link, more: count - 1 });
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => setToast(null), 9000);
  }, []);
  const { items, unread, state, markRead, markAll } = useNotifications(kind, topic, { limit: 15, onNew });
  useEffect(() => () => window.clearTimeout(timer.current), []);

  // The dropdown is position:fixed (placed from the button), so it can never be
  // clipped by a scrolling sidebar or header, and it stays on screen on a phone.
  const place = useCallback(() => {
    const r = btnRef.current?.getBoundingClientRect();
    if (!r) return;
    const width = Math.min(380, window.innerWidth - 24);
    const left = Math.min(Math.max(12, r.right - width), window.innerWidth - width - 12);
    setPos({ top: r.bottom + 8, left, width });
  }, []);
  useEffect(() => {
    if (!open) return;
    place();
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { setOpen(false); btnRef.current?.focus(); } };
    const onPointer = (e: PointerEvent) => {
      const t = e.target as Node;
      if (!panelRef.current?.contains(t) && !btnRef.current?.contains(t)) setOpen(false);
    };
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    document.addEventListener('keydown', onKey);
    document.addEventListener('pointerdown', onPointer);
    return () => {
      window.removeEventListener('resize', place); window.removeEventListener('scroll', place, true);
      document.removeEventListener('keydown', onKey); document.removeEventListener('pointerdown', onPointer);
    };
  }, [open, place]);

  const go = (n: Notice) => {
    if (!n.read) markRead(n.id);
    if (n.link && isSafeInternalPath(n.link)) window.location.assign(n.link);
  };

  if (state === 'signed-out') return null;
  const label = unread > 0 ? `Notifications, ${unread} unread` : 'Notifications';

  return (
    <>
      <button ref={btnRef} type="button" onClick={() => setOpen((v) => !v)} aria-label={label} aria-expanded={open} aria-haspopup="dialog" title="Notifications"
        data-testid={`bell-${kind}`} className={`icon-btn relative ${className}`}>
        <Icon name="bell" />
        {unread > 0 && (
          <span data-testid={`bell-count-${kind}`} aria-hidden className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-accent text-on-accent text-[10.5px] font-extrabold leading-[18px] text-center shadow-glow-sm">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && createPortal(
        <div ref={panelRef} role="dialog" aria-label="Notifications" style={{ top: pos.top, left: pos.left, width: pos.width }}
          className="fixed z-[75] card !bg-paper shadow-lift overflow-hidden swap-in">
          <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-line">
            <b className="font-display text-[15px]">Notifications</b>
            <button type="button" onClick={markAll} disabled={unread === 0} className="text-xs font-bold text-accent-ink disabled:opacity-40 disabled:cursor-default underline-offset-2 hover:underline">Mark all read</button>
          </div>
          <div className="max-h-[min(60vh,420px)] overflow-y-auto">
            <NotificationList items={items} onOpen={go} empty={state === 'error' ? 'Notifications could not be loaded.' : 'You are all caught up.'} />
          </div>
          {seeAllHref && <a href={seeAllHref} className="block text-center text-sm font-bold text-accent-ink border-t border-line px-4 py-3 hover:bg-accent/5">See all</a>}
        </div>,
        document.body,
      )}

      {toast && createPortal(
        <div role="status" aria-live="polite" data-testid="notice-toast"
          className="fixed right-3 top-[76px] z-[80] w-[min(92vw,360px)] card !bg-paper shadow-lift border-accent/50 p-3.5 pr-10 swap-in">
          <button type="button" onClick={() => setToast(null)} aria-label="Dismiss notification" className="absolute top-2 right-2 icon-btn !w-7 !h-7"><Icon name="close" className="!w-3.5 !h-3.5" /></button>
          <div className="flex items-start gap-3">
            <span className="icon-tile !w-9 !h-9 !rounded-full flex-shrink-0" aria-hidden><Icon name="bell" /></span>
            <div className="min-w-0">
              <p className="text-sm font-bold break-words">{toast.title}</p>
              {toast.body && <p className="text-[13px] text-muted mt-0.5 line-clamp-2 break-words">{toast.body}</p>}
              <div className="flex items-center gap-3 mt-1.5">
                {toast.link && isSafeInternalPath(toast.link) && <a href={toast.link} className="text-xs font-bold text-accent-ink">Open</a>}
                {toast.more > 0 && <span className="text-xs text-muted">+{toast.more} more</span>}
              </div>
            </div>
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}

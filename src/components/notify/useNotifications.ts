'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLiveUpdates } from '@/components/ui/LiveRefresh';

export type Kind = 'admin' | 'customer' | 'crew';
export type Notice = {
  id: string; title: string; body: string; link: string; read: boolean; createdAt: string;
  from: { kind: string; id: string; name: string } | null;
};

/**
 * Loads one audience's notifications and keeps them live.
 *
 * The live channel only says "something changed"; the notifications themselves
 * are fetched from /api/notifications, which checks the session. `onNew` fires
 * when an unread notification shows up that this page has not seen yet (never for
 * the ones already waiting when the page first loaded).
 */
export function useNotifications(kind: Kind, topic: string | null, opts: { limit?: number; onNew?: (n: Notice, count: number) => void; pollMs?: number } = {}) {
  const { limit = 20, onNew, pollMs = 15000 } = opts;
  const [items, setItems] = useState<Notice[]>([]);
  const [unread, setUnread] = useState(0);
  const [state, setState] = useState<'loading' | 'ok' | 'signed-out' | 'error'>('loading');
  const seen = useRef<Set<string>>(new Set());
  const ready = useRef(false);
  const onNewRef = useRef(onNew);
  onNewRef.current = onNew;

  const reload = useCallback(async () => {
    try {
      const res = await fetch(`/api/notifications?kind=${kind}&limit=${limit}`, { cache: 'no-store' });
      if (res.status === 401) { setState('signed-out'); return; }
      if (!res.ok) throw new Error();
      const data = (await res.json()) as { items: Notice[]; unread: number };
      const fresh = data.items.filter((n) => !n.read && !seen.current.has(n.id));
      data.items.forEach((n) => seen.current.add(n.id));
      if (ready.current && fresh.length > 0) onNewRef.current?.(fresh[0], fresh.length);
      ready.current = true;
      setItems(data.items); setUnread(data.unread); setState('ok');
    } catch {
      setState((s) => (s === 'ok' ? s : 'error'));
    }
  }, [kind, limit]);

  useLiveUpdates(topic, reload, pollMs);
  // First load (useLiveUpdates only reacts to changes and to the tab becoming visible).
  useEffect(() => { reload(); }, [reload]);

  const post = (body: Record<string, unknown>) => fetch('/api/notifications', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ kind, ...body }) }).catch(() => null);
  const markRead = useCallback(async (id: string) => {
    setItems((list) => list.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnread((u) => Math.max(0, u - 1));
    await post({ action: 'read', id });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);
  const markAll = useCallback(async () => {
    setItems((list) => list.map((n) => ({ ...n, read: true })));
    setUnread(0);
    await post({ action: 'readAll' });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [kind]);

  return { items, unread, state, reload, markRead, markAll };
}

export function timeAgo(iso: string): string {
  const s = Math.max(0, (Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 45) return 'just now';
  if (s < 3600) return `${Math.round(s / 60)} min ago`;
  if (s < 86400) return `${Math.round(s / 3600)} h ago`;
  if (s < 86400 * 7) return `${Math.round(s / 86400)} d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

'use client';
import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Calls `onChange` whenever the server announces a change on `topic`.
 *
 * With Supabase configured it listens on a Realtime Broadcast channel (the
 * message is only a "something changed" ping — the data itself is then fetched
 * through the app's own authenticated routes). Without Supabase it checks
 * every `pollMs` while the tab is visible, so local development still updates.
 */
export function useLiveUpdates(topic: string | null, onChange: () => void, pollMs = 20000) {
  const cb = useRef(onChange);
  cb.current = onChange;

  useEffect(() => {
    if (!topic) return;
    let cancelled = false;
    let cleanup = () => {};
    let last = 0;
    const fire = () => {
      // Collapse bursts (e.g. several rows saved at once) into one refresh.
      const now = Date.now();
      if (now - last < 800) return;
      last = now;
      cb.current();
    };

    if (SUPABASE_URL && SUPABASE_ANON_KEY) {
      import('@supabase/supabase-js').then(({ createClient }) => {
        if (cancelled) return;
        const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, { auth: { persistSession: false, autoRefreshToken: false } });
        const channel = client.channel(topic).on('broadcast', { event: 'change' }, fire).subscribe();
        cleanup = () => { client.removeChannel(channel); };
      }).catch(() => { /* fall through: the visibility refresh below still works */ });
    } else {
      const iv = window.setInterval(() => { if (document.visibilityState === 'visible') fire(); }, pollMs);
      cleanup = () => window.clearInterval(iv);
    }
    // Either way, catch up when the tab comes back into view.
    const onVisible = () => { if (document.visibilityState === 'visible') fire(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { cancelled = true; cleanup(); document.removeEventListener('visibilitychange', onVisible); };
  }, [topic, pollMs]);
}

/** Drop into a server-rendered page to re-render it when its data changes. */
export default function LiveRefresh({ topic, pollMs }: { topic: string; pollMs?: number }) {
  const router = useRouter();
  useLiveUpdates(topic, () => router.refresh(), pollMs);
  return null;
}

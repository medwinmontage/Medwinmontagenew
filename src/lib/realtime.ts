import 'server-only';

// Live updates without exposing the database to the browser.
//
// After a change is saved, the server sends a tiny "something changed" message
// over Supabase Realtime *Broadcast*. Open dashboards hear it and re-fetch
// through the normal, authenticated API routes. The message carries no data,
// so nothing sensitive travels over the public channel, and Row Level Security
// can stay locked down on every table.
//
// Without the Supabase variables this is a no-op and dashboards fall back to a
// light poll (see src/components/ui/LiveRefresh.tsx).

const SUPABASE_URL = (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '').replace(/\/$/, '');
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

export const TOPIC_ADMIN = 'mm-admin';
export const TOPIC_PUBLIC = 'mm-public';
export const customerTopic = (customerId: string) => `mm-customer-${customerId}`;

export async function notify(...topics: (string | null | undefined | false)[]): Promise<void> {
  const list = topics.filter((t): t is string => !!t);
  if (!SUPABASE_URL || !SERVICE_KEY || list.length === 0) return;
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2500);
    await fetch(`${SUPABASE_URL}/realtime/v1/api/broadcast`, {
      method: 'POST',
      headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ messages: list.map((topic) => ({ topic, event: 'change', payload: { at: Date.now() } })) }),
      signal: controller.signal,
    });
    clearTimeout(timer);
  } catch (e) {
    // A missed live update must never fail the request that saved the data.
    console.warn('Realtime notify failed', e instanceof Error ? e.message : e);
  }
}

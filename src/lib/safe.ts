import 'server-only';

/**
 * Runs one optional database read. If it fails (table not created yet, a brief connection problem …) the error is written
 * to the server log — it shows up in Vercel → Logs — and the page carries on with `fallback`, so one missing optional
 * section can never turn the whole public site into an error page.
 */
export async function safe<T>(label: string, work: PromiseLike<T>, fallback: T): Promise<T> {
  try {
    return await work;
  } catch (err) {
    const e = err as { code?: string; message?: string };
    console.error(`[db] ${label} failed${e?.code ? ` (${e.code})` : ''}: ${String(e?.message || err).split('\n').slice(-2).join(' ').slice(0, 300)}`);
    return fallback;
  }
}

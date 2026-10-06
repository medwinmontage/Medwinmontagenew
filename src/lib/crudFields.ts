import { COLLECTIONS, CollectionKey } from './collections';

// Keeps only the fields this collection declares (plus enabled/order), with the right types.
export function pickFields(config: (typeof COLLECTIONS)[CollectionKey], body: unknown): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  if (!body || typeof body !== 'object') return out;
  const src = body as Record<string, unknown>;
  for (const f of config.fields) {
    const v = src[f.key];
    if (v === undefined) continue;
    if (f.type === 'list') { if (Array.isArray(v)) out[f.key] = v.filter((x) => typeof x === 'string').map((x) => (x as string).slice(0, 300)).slice(0, 60); }
    else if (f.type === 'checkbox') { if (typeof v === 'boolean') out[f.key] = v; }
    else if (f.type === 'select') { if (typeof v === 'string' && (f.options as readonly string[]).includes(v)) out[f.key] = v; }
    else if (typeof v === 'string') out[f.key] = v.slice(0, 5000);
  }
  if (typeof src.enabled === 'boolean') out.enabled = src.enabled;
  if (typeof src.order === 'number' && Number.isInteger(src.order)) out.order = src.order;
  return out;
}

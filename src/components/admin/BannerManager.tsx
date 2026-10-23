'use client';
import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/site/Icon';
import Modal from '@/components/ui/Modal';
import { FormError } from '@/components/ui/Field';
import { useLiveUpdates } from '@/components/ui/LiveRefresh';
import { bannerState, isSafeExternalUrl, isSafeInternalPath, BannerState } from '@/lib/links';
import { prepareImage } from '@/lib/clientImage';

type Banner = {
  id: string; name: string; imageUrl: string; mobileImageUrl?: string; altText: string; enabled: boolean; order: number;
  linkType: 'none' | 'internal' | 'external'; linkUrl: string; startAt: string | null; endAt: string | null; timerEnabled: boolean;
};
type Draft = Omit<Banner, 'id' | 'order' | 'startAt' | 'endAt'> & { startAt: string; endAt: string };

const EMPTY: Draft = { name: '', imageUrl: '', mobileImageUrl: '', altText: '', enabled: true, linkType: 'none', linkUrl: '', startAt: '', endAt: '', timerEnabled: false };
const STATE_BADGE: Record<BannerState, string> = { ACTIVE: 'badge-ok', UPCOMING: '', EXPIRED: 'badge-bad', DISABLED: 'badge-neutral' };

// Dates are stored in UTC. The <input type="datetime-local"> shows and takes
// the admin's own local time, so convert in both directions here.
const toLocalInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toIso = (local: string) => (local ? new Date(local).toISOString() : null);
const show = (iso: string | null) => (iso ? new Date(iso).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : '—');

export default function BannerManager() {
  const [banners, setBanners] = useState<Banner[] | null>(null);
  const [editing, setEditing] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [preview, setPreview] = useState<Banner | null>(null);
  const [error, setError] = useState('');
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [, setTick] = useState(0);

  const load = useCallback(async () => {
    const res = await fetch('/api/banners', { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) { setError('Banners could not be loaded.'); return; }
    setBanners(await res.json()); setError('');
  }, []);
  useEffect(() => { load(); }, [load]);
  useLiveUpdates('mm-public', load, 60000);
  // Re-evaluate ACTIVE / UPCOMING / EXPIRED once a minute while the page is open.
  useEffect(() => { const t = setInterval(() => setTick((n) => n + 1), 60000); return () => clearInterval(t); }, []);

  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  function startNew() { setDraft(EMPTY); setEditing('new'); setFormError(''); }
  function startEdit(b: Banner) {
    setDraft({ name: b.name, imageUrl: b.imageUrl, mobileImageUrl: b.mobileImageUrl || '', altText: b.altText, enabled: b.enabled, linkType: b.linkType, linkUrl: b.linkUrl, timerEnabled: b.timerEnabled, startAt: toLocalInput(b.startAt), endAt: toLocalInput(b.endAt) });
    setEditing(b.id); setFormError('');
  }

  // Large photos are scaled down in the browser before upload, so a 10 MB phone photo
  // works and visitors on small screens don't download a huge file.
  const upload = (field: 'imageUrl' | 'mobileImageUrl') => async (e: React.ChangeEvent<HTMLInputElement>) => {
    const original = e.target.files?.[0];
    e.target.value = '';
    if (!original) return;
    setUploading(true); setFormError('');
    const file = await prepareImage(original);
    const fd = new FormData(); fd.append('file', file); fd.append('folder', 'banners');
    const res = await fetch('/api/upload', { method: 'POST', body: fd }).catch(() => null);
    const d = await res?.json().catch(() => ({}));
    setUploading(false);
    if (!res?.ok) { setFormError(d?.error || 'Upload failed'); return; }
    set(field, d.url);
  };

  function check(): string {
    if (!draft.imageUrl) return 'Please upload a banner image.';
    if (draft.linkType === 'internal' && !isSafeInternalPath(draft.linkUrl)) return 'Internal links must be a path on this site, for example /join-as-crew or /#packages.';
    if (draft.linkType === 'external' && !isSafeExternalUrl(draft.linkUrl)) return 'External links must start with https://';
    if (draft.startAt && draft.endAt && new Date(draft.endAt) <= new Date(draft.startAt)) return 'The end date must be after the start date.';
    if (draft.timerEnabled && !draft.endAt) return 'A timer needs an end date to count down to.';
    return '';
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    const problem = check();
    if (problem) { setFormError(problem); return; }
    setBusy(true); setFormError('');
    const body = { ...draft, linkUrl: draft.linkType === 'none' ? '' : draft.linkUrl.trim(), startAt: toIso(draft.startAt), endAt: toIso(draft.endAt) };
    const res = await fetch(editing === 'new' ? '/api/banners' : `/api/banners/${editing}`, {
      method: editing === 'new' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) { const d = await res?.json().catch(() => ({})); setFormError(d?.error || 'The banner could not be saved.'); return; }
    setEditing(null);
    load();
  }

  async function patch(id: string, body: object) {
    setError('');
    const res = await fetch(`/api/banners/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
    if (!res?.ok) { const d = await res?.json().catch(() => ({})); setError(d?.error || 'The change could not be saved.'); }
    load();
  }
  async function remove(b: Banner) {
    if (!window.confirm(`Delete the banner “${b.name || b.altText || 'Untitled'}”? This cannot be undone.`)) return;
    const res = await fetch(`/api/banners/${b.id}`, { method: 'DELETE' }).catch(() => null);
    if (!res?.ok) setError('The banner could not be deleted.');
    load();
  }
  async function move(index: number, dir: -1 | 1) {
    if (!banners) return;
    const next = [...banners];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setBanners(next);
    await Promise.all(next.map((b, order) => (b.order === order ? null : fetch(`/api/banners/${b.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order }) }))));
    load();
  }

  const form = (
    <form noValidate onSubmit={save} className="card p-5 sm:p-6 mb-6 flex flex-col gap-4 !border-accent/60">
      <h3 className="font-display font-bold text-lg">{editing === 'new' ? 'Add banner' : 'Edit banner'}</h3>
      <div className="flex items-center gap-4 flex-wrap">
        <span className="w-40 aspect-[21/9] rounded-lg border border-line bg-paper-2 overflow-hidden flex items-center justify-center text-xs text-muted">
          {draft.imageUrl ? <img src={draft.imageUrl} alt="" className="max-w-full max-h-full object-contain" /> : 'No image yet'}
        </span>
        <label className="btn btn-secondary cursor-pointer">
          {uploading ? 'Uploading…' : draft.imageUrl ? 'Replace image' : 'Upload image'}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={upload('imageUrl')} disabled={uploading} />
        </label>
        <p className="hint !mt-0 basis-full">Wide images work best (about 2100×900). The whole image is always shown, on every screen, without cropping. JPEG, PNG, WebP or GIF — big photos are resized automatically.</p>
      </div>
      <div className="flex items-center gap-4 flex-wrap">
        <span className="w-20 aspect-[4/5] rounded-lg border border-line bg-paper-2 overflow-hidden flex items-center justify-center text-[11px] text-muted text-center p-1">
          {draft.mobileImageUrl ? <img src={draft.mobileImageUrl} alt="" className="max-w-full max-h-full object-contain" /> : 'Same as above'}
        </span>
        <label className="btn btn-secondary cursor-pointer">
          {draft.mobileImageUrl ? 'Replace phone image' : 'Add a phone version (optional)'}
          <input type="file" accept="image/png,image/jpeg,image/webp,image/gif" className="sr-only" onChange={upload('mobileImageUrl')} disabled={uploading} />
        </label>
        {draft.mobileImageUrl && <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('mobileImageUrl', '')}>Remove phone version</button>}
        <p className="hint !mt-0 basis-full">Shown instead on phones (screens narrower than 640px). A portrait or square design, about 1080×1350, reads better on a small screen than a wide banner.</p>
      </div>
      <div className="grid sm:grid-cols-2 gap-4">
        <label className="field"><span className="label">Banner name</span><input className="input" maxLength={120} value={draft.name} onChange={(e) => set('name', e.target.value)} placeholder="For your own reference" /></label>
        <label className="field"><span className="label">Alt text</span><input className="input" maxLength={200} value={draft.altText} onChange={(e) => set('altText', e.target.value)} placeholder="What the banner says, for screen readers" /></label>
        <label className="field"><span className="label">Link type</span>
          <select className="input" value={draft.linkType} onChange={(e) => set('linkType', e.target.value as Draft['linkType'])}>
            <option value="none">No link</option><option value="internal">Internal (a page on this site)</option><option value="external">External (another website or WhatsApp link)</option>
          </select>
        </label>
        {draft.linkType !== 'none' && (
          <label className="field"><span className="label">Link destination</span>
            <input className="input" value={draft.linkUrl} onChange={(e) => set('linkUrl', e.target.value)} placeholder={draft.linkType === 'internal' ? '/join-as-crew or /#packages' : 'https://'} />
          </label>
        )}
        <label className="field"><span className="label">Start date &amp; time (optional)</span><input type="datetime-local" className="input" value={draft.startAt} onChange={(e) => set('startAt', e.target.value)} /></label>
        <label className="field"><span className="label">End date &amp; time (optional)</span><input type="datetime-local" className="input" value={draft.endAt} onChange={(e) => set('endAt', e.target.value)} /></label>
      </div>
      <p className="hint !mt-0">Times are in your device&rsquo;s time zone. Before the start the banner is hidden; after the end it hides itself.</p>
      <label className="flex items-center gap-2.5 text-sm font-semibold"><input type="checkbox" checked={draft.timerEnabled} onChange={(e) => set('timerEnabled', e.target.checked)} /> Show a countdown timer to the end time</label>
      <label className="flex items-center gap-2.5 text-sm font-semibold"><input type="checkbox" checked={draft.enabled} onChange={(e) => set('enabled', e.target.checked)} /> Enabled</label>
      <FormError>{formError}</FormError>
      <div className="flex gap-2">
        <button type="submit" disabled={busy || uploading} className="btn btn-primary">{busy ? 'Saving…' : editing === 'new' ? 'Add banner' : 'Save changes'}</button>
        <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)}>Cancel</button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex justify-between items-center gap-3 flex-wrap mb-2">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl">Banners</h2>
        {editing === null && <button type="button" onClick={startNew} className="btn btn-primary"><Icon name="plus" /> Add Banner</button>}
      </div>
      <p className="text-sm text-muted mb-6 max-w-[70ch]">Banners appear in a carousel below the hero on the home page, in the order shown here.</p>
      <FormError className="mb-4">{error}</FormError>
      {editing !== null && form}

      {!banners ? (!error && <p className="text-sm text-muted" role="status">Loading…</p>) : banners.length === 0 ? (
        <p className="empty">No banners yet. Add one to show it on the home page.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {banners.map((b, i) => {
            const state = bannerState(b);
            return (
              <article key={b.id} className={`card p-4 flex flex-wrap items-center gap-4 ${editing === b.id ? '!border-accent/60' : ''}`}>
                <img src={b.imageUrl} alt="" className="w-32 aspect-[21/9] object-contain bg-paper-2 rounded-lg border border-line flex-shrink-0" />
                <div className="flex-1 min-w-[200px]">
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <h3 className="font-bold">{b.name || b.altText || 'Untitled banner'}</h3>
                    <span className={`badge ${STATE_BADGE[state]}`}>{state}</span>
                    {b.timerEnabled && <span className="badge badge-neutral"><Icon name="clock" className="w-3 h-3" /> Timer</span>}
                  </div>
                  <p className="text-xs text-muted">Starts: {show(b.startAt)} · Ends: {show(b.endAt)}</p>
                  <p className="text-xs text-muted break-all">{b.linkType === 'none' || !b.linkUrl ? 'No link' : `${b.linkType === 'internal' ? 'Internal' : 'External'} link: ${b.linkUrl}`}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <button type="button" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up" title="Move up" className="btn btn-ghost btn-sm"><Icon name="arrow-up" /></button>
                  <button type="button" onClick={() => move(i, 1)} disabled={i === banners.length - 1} aria-label="Move down" title="Move down" className="btn btn-ghost btn-sm"><Icon name="arrow-down" /></button>
                  <button type="button" role="switch" aria-checked={b.enabled} aria-label={`${b.enabled ? 'Disable' : 'Enable'} ${b.name || 'banner'}`} title={b.enabled ? 'Enabled' : 'Disabled'} onClick={() => patch(b.id, { enabled: !b.enabled })} className="switch" />
                  <button type="button" onClick={() => setPreview(b)} className="btn btn-ghost btn-sm">Preview</button>
                  <button type="button" onClick={() => startEdit(b)} className="btn btn-ghost btn-sm">Edit</button>
                  <button type="button" onClick={() => remove(b)} className="btn btn-ghost btn-sm">Delete</button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      <Modal open={!!preview} onClose={() => setPreview(null)} title={preview ? `Preview: ${preview.name || 'banner'}` : ''} size="lg">
        {preview && (
          <div>
            <div className="relative overflow-hidden rounded-xl border border-line aspect-[21/9] bg-paper-2">
              <img src={preview.imageUrl} alt={preview.altText} className="max-w-full max-h-full object-contain" />
              {preview.timerEnabled && preview.endAt && <span className="absolute left-3 bottom-3 rounded-lg bg-black/70 text-white text-xs font-bold px-2.5 py-1.5">Countdown to {show(preview.endAt)}</span>}
            </div>
            <p className="hint">Status now: {bannerState(preview)}. {preview.linkUrl ? `Opens ${preview.linkUrl}` : 'Not clickable.'}</p>
          </div>
        )}
      </Modal>
    </div>
  );
}

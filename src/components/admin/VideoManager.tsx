'use client';
import { useCallback, useEffect, useState } from 'react';
import Icon from '@/components/site/Icon';
import AutoVideo from '@/components/site/AutoVideo';
import { FormError } from '@/components/ui/Field';
import { useLiveUpdates } from '@/components/ui/LiveRefresh';
import { checkVideoSource, parseVideoUrl, VideoSource } from '@/lib/media';
import { capturePoster, prepareImage } from '@/lib/clientImage';
import { uploadVideoFile } from '@/lib/videoUpload';

type Video = { id: string; title: string; caption: string; source: VideoSource; url: string; posterUrl: string; enabled: boolean; order: number };
type Draft = Omit<Video, 'id' | 'order'>;
const EMPTY: Draft = { title: '', caption: '', source: 'upload', url: '', posterUrl: '', enabled: true };
const SOURCES: [VideoSource, string][] = [['upload', 'Upload from my device'], ['youtube', 'YouTube link'], ['vimeo', 'Vimeo link'], ['url', 'Direct .mp4 / .webm link']];
const SOURCE_NAME: Record<VideoSource, string> = { upload: 'Uploaded', youtube: 'YouTube', vimeo: 'Vimeo', url: 'Direct link' };

async function uploadImage(file: File): Promise<string> {
  const fd = new FormData(); fd.append('file', await prepareImage(file)); fd.append('folder', 'posters');
  const res = await fetch('/api/upload', { method: 'POST', body: fd }).catch(() => null);
  const d = await res?.json().catch(() => ({}));
  if (!res?.ok) throw new Error(d?.error || 'The image could not be uploaded.');
  return d.url as string;
}

export default function VideoManager() {
  const [videos, setVideos] = useState<Video[] | null>(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState<'new' | string | null>(null);
  const [draft, setDraft] = useState<Draft>(EMPTY);
  const [formError, setFormError] = useState('');
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState(''); // upload progress text
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const load = useCallback(async () => {
    const res = await fetch('/api/videos', { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) { setError('Videos could not be loaded.'); return; }
    setVideos(await res.json()); setError('');
  }, []);
  useEffect(() => { load(); }, [load]);
  useLiveUpdates('mm-admin', load);

  function startNew() { setDraft(EMPTY); setEditing('new'); setFormError(''); setStatus(''); }
  function startEdit(v: Video) {
    setDraft({ title: v.title, caption: v.caption, source: v.source, url: v.url, posterUrl: v.posterUrl, enabled: v.enabled });
    setEditing(v.id); setFormError(''); setStatus('');
  }

  async function onVideoFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setFormError(''); setStatus(`Uploading ${file.name} (${(file.size / 1048576).toFixed(1)} MB)… keep this page open.`);
    try {
      const [url, poster] = await Promise.all([uploadVideoFile(file), draft.posterUrl ? Promise.resolve(null) : capturePoster(file)]);
      let posterUrl = draft.posterUrl;
      if (poster) { try { posterUrl = await uploadImage(poster); } catch { /* the poster is optional */ } }
      setDraft((d) => ({ ...d, url, posterUrl, title: d.title || file.name.replace(/\.[^.]+$/, '').replace(/[_-]+/g, ' ') }));
      setStatus('Uploaded. Check the preview, then save.');
    } catch (err) {
      setStatus(''); setFormError(err instanceof Error ? err.message : 'The upload failed.');
    } finally {
      setBusy(false);
    }
  }
  async function onPosterFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setFormError('');
    try { set('posterUrl', await uploadImage(file)); } catch (err) { setFormError(err instanceof Error ? err.message : 'Upload failed'); } finally { setBusy(false); }
  }

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (busy) return;
    if (draft.title.trim().length < 1) { setFormError('Please add a title.'); return; }
    const problem = checkVideoSource(draft.source, draft.url);
    if (problem) { setFormError(problem); return; }
    setBusy(true); setFormError('');
    const res = await fetch(editing === 'new' ? '/api/videos' : `/api/videos/${editing}`, {
      method: editing === 'new' ? 'POST' : 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...draft, title: draft.title.trim(), caption: draft.caption.trim(), url: draft.url.trim() }),
    }).catch(() => null);
    setBusy(false);
    if (!res?.ok) { const d = await res?.json().catch(() => ({})); setFormError(d?.error || 'The video could not be saved.'); return; }
    setEditing(null); load();
  }

  async function patch(id: string, body: object) {
    setError('');
    const res = await fetch(`/api/videos/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
    if (!res?.ok) { const d = await res?.json().catch(() => ({})); setError(d?.error || 'The change could not be saved.'); }
    load();
  }
  async function remove(v: Video) {
    if (!window.confirm(`Delete the video “${v.title}”? An uploaded file is deleted too. This cannot be undone.`)) return;
    const res = await fetch(`/api/videos/${v.id}`, { method: 'DELETE' }).catch(() => null);
    if (!res?.ok) setError('The video could not be deleted.');
    load();
  }
  async function move(index: number, dir: -1 | 1) {
    if (!videos) return;
    const next = [...videos]; const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setVideos(next);
    await Promise.all(next.map((v, order) => (v.order === order ? null : fetch(`/api/videos/${v.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order }) }))));
    load();
  }

  const parsed = parseVideoUrl(draft.url);

  const form = (
    <form noValidate onSubmit={save} className="card p-5 sm:p-6 mb-6 flex flex-col gap-4 !border-accent/60">
      <h3 className="font-display font-bold text-lg">{editing === 'new' ? 'Add video' : 'Edit video'}</h3>

      <fieldset>
        <legend className="label">Where is the video?</legend>
        <div className="flex flex-wrap gap-2">
          {SOURCES.map(([id, label]) => (
            <label key={id} className={`cursor-pointer rounded-xl border px-3.5 py-2 text-sm font-bold transition-all has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${draft.source === id ? 'border-accent bg-accent/10 text-accent-ink shadow-glow-sm' : 'border-line-strong hover:border-accent/60'}`}>
              <input type="radio" name="video-source" value={id} checked={draft.source === id} onChange={() => setDraft((d) => ({ ...d, source: id, url: id === d.source ? d.url : '' }))} className="sr-only" />
              {label}
            </label>
          ))}
        </div>
      </fieldset>

      {draft.source === 'upload' ? (
        <div className="flex flex-col gap-2">
          <label className="btn btn-secondary cursor-pointer self-start">
            <Icon name="upload" /> {busy && status ? 'Uploading…' : draft.url ? 'Choose a different video' : 'Choose a video file'}
            <input type="file" accept="video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov" className="sr-only" onChange={onVideoFile} disabled={busy} />
          </label>
          <p className="hint !mt-0">MP4 (H.264), WebM or MOV from your phone or computer. Keep it short and compressed — a 10–30 second loop works best. {status}</p>
          {draft.url && <p className="text-xs text-muted break-all">File: {draft.url}</p>}
        </div>
      ) : (
        <label className="field"><span className="label">{draft.source === 'youtube' ? 'YouTube link' : draft.source === 'vimeo' ? 'Vimeo link' : 'Link to the video file'}</span>
          <input className="input" inputMode="url" value={draft.url} onChange={(e) => set('url', e.target.value)}
            placeholder={draft.source === 'youtube' ? 'https://www.youtube.com/watch?v=…' : draft.source === 'vimeo' ? 'https://vimeo.com/123456789' : 'https://…/video.mp4'} />
        </label>
      )}

      <div className="grid sm:grid-cols-2 gap-4">
        <label className="field"><span className="label">Title *</span><input className="input" maxLength={120} value={draft.title} onChange={(e) => set('title', e.target.value)} /></label>
        <label className="field"><span className="label">Short caption (optional)</span><input className="input" maxLength={300} value={draft.caption} onChange={(e) => set('caption', e.target.value)} /></label>
      </div>

      <div className="flex items-center gap-4 flex-wrap">
        <span className="w-28 aspect-video rounded-lg border border-line bg-paper-2 overflow-hidden flex items-center justify-center text-[11px] text-muted text-center">
          {draft.posterUrl ? <img src={draft.posterUrl} alt="" className="max-w-full max-h-full object-contain" /> : 'No poster'}
        </span>
        <label className="btn btn-secondary btn-sm cursor-pointer">{draft.posterUrl ? 'Replace poster image' : 'Add a poster image (optional)'}
          <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={onPosterFile} disabled={busy} />
        </label>
        {draft.posterUrl && <button type="button" className="btn btn-ghost btn-sm" onClick={() => set('posterUrl', '')}>Remove poster</button>}
        <p className="hint !mt-0 basis-full">The poster shows before the video starts and for visitors who use &ldquo;reduce motion&rdquo; or Data Saver. For uploaded files it is made from the video automatically.</p>
      </div>

      {parsed && (
        <div>
          <p className="label">Preview</p>
          <AutoVideo video={parsed} poster={draft.posterUrl || undefined} title={draft.title || 'Preview'} className="aspect-video w-full max-w-md rounded-xl border border-line" />
        </div>
      )}

      <label className="flex items-center gap-2.5 text-sm font-semibold"><input type="checkbox" checked={draft.enabled} onChange={(e) => set('enabled', e.target.checked)} /> Show on the website</label>
      <FormError>{formError}</FormError>
      <div className="flex gap-3 flex-wrap">
        <button type="submit" disabled={busy} className="btn btn-primary">{busy ? 'Please wait…' : editing === 'new' ? 'Add video' : 'Save changes'}</button>
        <button type="button" className="btn btn-ghost" onClick={() => setEditing(null)} disabled={busy}>Cancel</button>
      </div>
    </form>
  );

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <p className="text-sm text-muted max-w-[70ch]">Videos appear in the &ldquo;Showreel&rdquo; section of the home page and start by themselves: muted and looping, only while on screen. Browsers do not allow autoplay with sound, so visitors can turn the sound on with the button on the video.</p>
        {editing === null && <button type="button" onClick={startNew} className="btn btn-primary"><Icon name="plus" /> Add video</button>}
      </div>
      <FormError className="mb-4">{error}</FormError>
      {editing !== null && form}
      {videos === null ? <p className="text-muted" role="status">Loading…</p> : videos.length === 0 && editing === null ? (
        <div className="empty"><p>No videos yet. Add one to show a Showreel section on the home page.</p></div>
      ) : (
        <ul className="flex flex-col gap-3">
          {videos.map((v, i) => {
            const p = parseVideoUrl(v.url);
            return (
              <li key={v.id} className="card p-4 flex flex-wrap items-center gap-4">
                <span className="w-28 aspect-video rounded-lg border border-line bg-paper-2 overflow-hidden flex items-center justify-center flex-shrink-0">
                  {v.posterUrl ? <img src={v.posterUrl} alt="" className="max-w-full max-h-full object-contain" /> : <Icon name="video" className="w-6 h-6 text-muted" />}
                </span>
                <div className="min-w-0 flex-1 basis-48">
                  <h3 className="font-bold break-words">{v.title}</h3>
                  <p className="text-xs text-muted mt-0.5">{SOURCE_NAME[v.source]}{!p && ' · link not playable'}{v.caption ? ` · ${v.caption}` : ''}</p>
                  <span className={`badge mt-1.5 ${v.enabled ? 'badge-ok' : 'badge-neutral'}`}>{v.enabled ? 'Showing' : 'Hidden'}</span>
                </div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button type="button" className="icon-btn !w-9 !h-9" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move ${v.title} up`}><Icon name="arrow-up" /></button>
                  <button type="button" className="icon-btn !w-9 !h-9" onClick={() => move(i, 1)} disabled={i === videos.length - 1} aria-label={`Move ${v.title} down`}><Icon name="arrow-down" /></button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => patch(v.id, { enabled: !v.enabled })}>{v.enabled ? 'Hide' : 'Show'}</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => startEdit(v)}><Icon name="edit" /> Edit</button>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={() => remove(v)}><Icon name="trash" /> Delete</button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

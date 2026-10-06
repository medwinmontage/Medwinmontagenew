'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from '@/components/site/Icon';
import { FormError } from '@/components/ui/Field';
import { useLiveUpdates } from '@/components/ui/LiveRefresh';
import { CREW_STATUSES, statusBadgeClass } from '@/lib/status';
import { CREW_ROLES } from '@/lib/validators';
import { isSafeExternalUrl } from '@/lib/links';

type App = {
  id: string; ref: string; fullName: string; phone: string; age: number; role: string; experienceType: string; experienceYears: number | null;
  workedInOrganization: boolean; organizationName: string | null; educationStatus: string; studiedWhat: string | null; studyingWhatWhere: string | null;
  hasResume: boolean; resumeName: string | null; previousWorkUrl: string | null; status: string; adminNotes: string | null; createdAt: string;
};
const PAGE = 10;
const day = (iso: string) => new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function CrewManager() {
  const [apps, setApps] = useState<App[] | null>(null);
  const [error, setError] = useState('');
  const [q, setQ] = useState('');
  const [role, setRole] = useState('');
  const [exp, setExp] = useState('');
  const [status, setStatus] = useState('');
  const [from, setFrom] = useState('');
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(0);
  const [open, setOpen] = useState<string | null>(null);
  const [note, setNote] = useState('');

  const load = useCallback(async () => {
    const res = await fetch('/api/crew', { cache: 'no-store' }).catch(() => null);
    if (!res?.ok) { setError('Applications could not be loaded.'); return; }
    setApps(await res.json()); setError('');
  }, []);
  useEffect(() => { load(); }, [load]);
  useLiveUpdates('mm-admin', load);
  useEffect(() => { setPage(0); }, [q, role, exp, status, from, sort]);

  const filtered = useMemo(() => {
    if (!apps) return [];
    const needle = q.trim().toLowerCase();
    const list = apps.filter((a) =>
      (!needle || [a.fullName, a.phone, a.ref, a.role].some((v) => v.toLowerCase().includes(needle)))
      && (!role || a.role === role) && (!exp || a.experienceType === exp) && (!status || a.status === status)
      && (!from || a.createdAt.slice(0, 10) >= from));
    const cmp: Record<string, (a: App, b: App) => number> = {
      newest: (a, b) => b.createdAt.localeCompare(a.createdAt), oldest: (a, b) => a.createdAt.localeCompare(b.createdAt),
      name: (a, b) => a.fullName.localeCompare(b.fullName), experience: (a, b) => (b.experienceYears || 0) - (a.experienceYears || 0),
    };
    return [...list].sort(cmp[sort]);
  }, [apps, q, role, exp, status, from, sort]);

  async function call(id: string, init: RequestInit) {
    setError('');
    const res = await fetch(`/api/crew/${id}`, init).catch(() => null);
    if (!res?.ok) { const d = await res?.json().catch(() => ({})); setError(d?.error || 'The change could not be saved.'); return false; }
    await load();
    return true;
  }
  const patch = (id: string, body: object) => call(id, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });

  if (!apps) return error ? <FormError>{error}</FormError> : <p className="text-sm text-muted" role="status">Loading…</p>;
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const shown = filtered.slice(page * PAGE, page * PAGE + PAGE);

  return (
    <div>
      <FormError className="mb-4">{error}</FormError>
      <div className="card p-4 grid grid-cols-2 lg:grid-cols-6 gap-3 mb-5">
        <label className="field col-span-2"><span className="label">Search</span><input className="input" type="search" placeholder="Name, phone, reference" value={q} onChange={(e) => setQ(e.target.value)} /></label>
        <label className="field"><span className="label">Role</span><select className="input" value={role} onChange={(e) => setRole(e.target.value)}><option value="">All roles</option>{CREW_ROLES.map((r) => <option key={r}>{r}</option>)}</select></label>
        <label className="field"><span className="label">Experience</span><select className="input" value={exp} onChange={(e) => setExp(e.target.value)}><option value="">Any</option><option>Fresher</option><option>Experienced</option></select></label>
        <label className="field"><span className="label">Status</span><select className="input" value={status} onChange={(e) => setStatus(e.target.value)}><option value="">All statuses</option>{CREW_STATUSES.map((s) => <option key={s}>{s}</option>)}</select></label>
        <label className="field"><span className="label">Applied since</span><input type="date" className="input" value={from} onChange={(e) => setFrom(e.target.value)} /></label>
        <label className="field col-span-2 lg:col-span-2"><span className="label">Sort by</span><select className="input" value={sort} onChange={(e) => setSort(e.target.value)}><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="name">Name A–Z</option><option value="experience">Most experience</option></select></label>
      </div>
      <p className="text-sm text-muted mb-3" role="status">{filtered.length} of {apps.length} application{apps.length === 1 ? '' : 's'}</p>

      {shown.length === 0 ? <p className="empty">{apps.length === 0 ? 'No crew applications yet. Applications from the “Join as Crew” page appear here.' : 'No applications match these filters.'}</p> : (
        <div className="flex flex-col gap-3">
          {shown.map((a) => {
            const isOpen = open === a.id;
            const workLink = a.previousWorkUrl && isSafeExternalUrl(a.previousWorkUrl) ? a.previousWorkUrl : null;
            return (
              <article key={a.id} className={`card p-4 sm:p-5 transition-colors ${isOpen ? '!border-accent/60' : ''}`}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-muted">{a.ref} · {day(a.createdAt)}</p>
                    <h3 className="font-display font-bold text-lg">{a.fullName}</h3>
                    <p className="text-sm text-muted">{a.role} · {a.experienceType}{a.experienceYears ? `, ${a.experienceYears} yr` : ''} · Age {a.age} · {a.phone}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className={`badge ${statusBadgeClass(a.status)}`}>{a.status}</span>
                    <select className="input !w-auto !py-1.5 !px-2.5 !text-xs" aria-label={`Status for ${a.ref} (${a.fullName})`} value={a.status} onChange={(e) => patch(a.id, { status: e.target.value })}>
                      {CREW_STATUSES.map((s) => <option key={s}>{s}</option>)}
                    </select>
                    <button type="button" className="btn btn-ghost btn-sm" aria-expanded={isOpen} onClick={() => { setOpen(isOpen ? null : a.id); setNote(a.adminNotes || ''); }}>{isOpen ? 'Close' : 'View'}</button>
                  </div>
                </div>
                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-dashed border-line">
                    <dl className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm mb-4">
                      <div><dt className="text-xs text-muted">Worked in another organization</dt><dd className="font-semibold">{a.workedInOrganization ? `Yes${a.organizationName ? ` — ${a.organizationName}` : ''}` : 'No'}</dd></div>
                      <div><dt className="text-xs text-muted">Education</dt><dd className="font-semibold">{a.educationStatus}</dd></div>
                      <div><dt className="text-xs text-muted">Studied</dt><dd className="font-semibold">{a.studiedWhat || '—'}</dd></div>
                      <div><dt className="text-xs text-muted">Studying (what &amp; where)</dt><dd className="font-semibold">{a.studyingWhatWhere || '—'}</dd></div>
                      <div><dt className="text-xs text-muted">Resume</dt><dd>{a.hasResume ? <a className="link-accent text-sm" href={`/api/crew/${a.id}/resume`} target="_blank" rel="noopener noreferrer"><Icon name="download" /> {a.resumeName || 'Open resume'}</a> : 'Not uploaded'}</dd></div>
                      <div className="min-w-0"><dt className="text-xs text-muted">Previous work</dt><dd className="break-all">{workLink ? <a className="link-accent text-sm" href={workLink} target="_blank" rel="noopener noreferrer nofollow">Open link <Icon name="external" /></a> : 'No link given'}</dd></div>
                    </dl>
                    <label className="field"><span className="label">Admin note (only admins see this)</span><textarea className="input" maxLength={2000} value={note} onChange={(e) => setNote(e.target.value)} /></label>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <button type="button" className="btn btn-primary btn-sm" onClick={() => patch(a.id, { adminNotes: note })}>Save note</button>
                      <a className="btn btn-ghost btn-sm" href={`tel:${a.phone.replace(/[^\d+]/g, '')}`}><Icon name="phone" /> Call</a>
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => { if (window.confirm(`Delete the application from ${a.fullName} (${a.ref})? The resume is deleted too.`)) call(a.id, { method: 'DELETE' }); }}><Icon name="trash" /> Delete</button>
                    </div>
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
      {pages > 1 && (
        <nav aria-label="Pages" className="flex items-center justify-center gap-3 mt-6">
          <button type="button" className="btn btn-ghost btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>Previous</button>
          <span className="text-sm text-muted">Page {page + 1} of {pages}</span>
          <button type="button" className="btn btn-ghost btn-sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next</button>
        </nav>
      )}
    </div>
  );
}

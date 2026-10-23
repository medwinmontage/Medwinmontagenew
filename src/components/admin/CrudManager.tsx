'use client';
import { useEffect, useState } from 'react';
import Icon from '@/components/site/Icon';

type Field = { key: string; label: string; type: 'text' | 'textarea' | 'list' | 'checkbox' | 'select'; options?: readonly string[] };

export default function CrudManager({ collection, label, fields, titleField }: {
  collection: string; label: string; fields: readonly Field[]; titleField: string;
}) {
  const [items, setItems] = useState<any[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const res = await fetch(`/api/crud/${collection}`);
    setItems(await res.json());
    setLoading(false);
  }
  useEffect(() => { load(); }, [collection]);

  async function addNew() {
    const blank: any = {};
    fields.forEach((f) => { blank[f.key] = f.type === 'list' ? [] : f.type === 'checkbox' ? false : f.type === 'select' ? f.options?.[0] : ''; });
    blank.enabled = true;
    const res = await fetch(`/api/crud/${collection}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(blank) });
    const created = await res.json();
    await load();
    setEditingId(created.id);
  }
  async function toggleEnabled(item: any) {
    await fetch(`/api/crud/${collection}/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ enabled: !item.enabled }) });
    load();
  }
  async function move(item: any, dir: -1 | 1) {
    const idx = items.findIndex((i) => i.id === item.id);
    const swapIdx = idx + dir;
    if (swapIdx < 0 || swapIdx >= items.length) return;
    const other = items[swapIdx];
    await Promise.all([
      fetch(`/api/crud/${collection}/${item.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: other.order }) }),
      fetch(`/api/crud/${collection}/${other.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ order: item.order }) }),
    ]);
    load();
  }
  async function remove(id: string) {
    await fetch(`/api/crud/${collection}/${id}`, { method: 'DELETE' });
    load();
  }
  async function save(id: string, data: Record<string, any>) {
    await fetch(`/api/crud/${collection}/${id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
    setEditingId(null);
    load();
  }

  if (loading) return <p className="text-sm text-muted" role="status">Loading…</p>;

  return (
    <div>
      <div className="flex justify-between items-center gap-3 flex-wrap mb-6">
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl">{label}</h2>
        <button onClick={addNew} className="btn btn-primary"><Icon name="plus" /> Add</button>
      </div>
      {items.length === 0 ? (
        <p className="empty">No {label.toLowerCase()} yet. Add one to show this on the site.</p>
      ) : (
        <div className="flex flex-col gap-3">
          {items.map((item, idx) => (
            <div key={item.id} className={`card p-4 transition-colors ${editingId === item.id ? '!border-accent/60' : ''}`}>
              <div className="flex justify-between items-center gap-3 flex-wrap">
                <span className="font-bold text-[14.5px]">{item[titleField] || '(untitled)'}</span>
                <div className="flex gap-1.5 flex-wrap items-center">
                  <button type="button" role="switch" aria-checked={item.enabled} aria-label="Show on site" title="Show on site" onClick={() => toggleEnabled(item)} className="switch" />
                  <button onClick={() => move(item, -1)} disabled={idx === 0} aria-label="Move up" title="Move up" className="btn btn-ghost btn-sm"><Icon name="arrow-up" /></button>
                  <button onClick={() => move(item, 1)} disabled={idx === items.length - 1} aria-label="Move down" title="Move down" className="btn btn-ghost btn-sm"><Icon name="arrow-down" /></button>
                  <button onClick={() => setEditingId(editingId === item.id ? null : item.id)} className="btn btn-ghost btn-sm">{editingId === item.id ? 'Close' : 'Edit'}</button>
                  <button onClick={() => remove(item.id)} className="btn btn-ghost btn-sm">Delete</button>
                </div>
              </div>
              {editingId === item.id && <EditForm item={item} fields={fields} onSave={(data) => save(item.id, data)} />}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function EditForm({ item, fields, onSave }: { item: any; fields: readonly Field[]; onSave: (data: any) => void }) {
  const [draft, setDraft] = useState<any>(() => {
    const d: any = {};
    fields.forEach((f) => { d[f.key] = f.type === 'list' ? (item[f.key] || []).join(', ') : item[f.key]; });
    return d;
  });

  function submit() {
    const data: any = {};
    fields.forEach((f) => {
      if (f.type === 'list') data[f.key] = String(draft[f.key] || '').split(',').map((s: string) => s.trim()).filter(Boolean);
      else data[f.key] = draft[f.key];
    });
    onSave(data);
  }

  return (
    <div className="mt-4 pt-4 border-t border-dashed border-line flex flex-col gap-3">
      {fields.map((f) => (
        <label key={f.key} className="field">
          <span className="label">{f.label}</span>
          {f.type === 'textarea' || f.type === 'list' ? (
            <textarea className="input" value={draft[f.key] || ''} onChange={(e) => setDraft((d: any) => ({ ...d, [f.key]: e.target.value }))} />
          ) : f.type === 'checkbox' ? (
            <input type="checkbox" checked={!!draft[f.key]} onChange={(e) => setDraft((d: any) => ({ ...d, [f.key]: e.target.checked }))} />
          ) : f.type === 'select' ? (
            <select className="input" value={draft[f.key] || ''} onChange={(e) => setDraft((d: any) => ({ ...d, [f.key]: e.target.value }))}>
              {f.options?.map((o) => <option key={o} value={o}>{o}</option>)}
            </select>
          ) : (
            <input className="input" value={draft[f.key] || ''} onChange={(e) => setDraft((d: any) => ({ ...d, [f.key]: e.target.value }))} />
          )}
        </label>
      ))}
      <button onClick={submit} className="btn btn-primary w-fit">Save changes</button>
    </div>
  );
}

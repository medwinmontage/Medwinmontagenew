'use client';
import { useState } from 'react';
import Icon from '@/components/site/Icon';
import { Field, FormError } from '@/components/ui/Field';

type Seo = {
  siteTitle: string; seoTitle: string; titleTemplate: string; metaDescription: string; primaryKeywords: string[]; secondaryKeywords: string[];
  businessName: string; businessDescription: string; canonicalUrl: string; ogTitle: string; ogDescription: string; ogImage: string;
  twitterTitle: string; twitterDescription: string; twitterImage: string;
  primaryLocation: string; city: string; district: string; state: string; country: string; serviceAreas: string[]; nearbyLocations: string[];
  mainServices: string[]; serviceKeywords: string[]; localDescription: string;
  robotsIndex: boolean; robotsFollow: boolean; sitemapEnabled: boolean; structuredData: boolean;
};
type ListKey = 'primaryKeywords' | 'secondaryKeywords' | 'serviceAreas' | 'nearbyLocations' | 'mainServices' | 'serviceKeywords';
type TextKey = Exclude<keyof Seo, ListKey | 'robotsIndex' | 'robotsFollow' | 'sitemapEnabled' | 'structuredData'>;
type BoolKey = 'robotsIndex' | 'robotsFollow' | 'sitemapEnabled' | 'structuredData';

const toList = (s: string) => Array.from(new Set(s.split(/[,\n]/).map((x) => x.trim()).filter(Boolean)));

function Card({ title, intro, children }: { title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="card p-5 sm:p-6 flex flex-col gap-4">
      <div><h3 className="font-display font-bold text-lg">{title}</h3>{intro && <p className="hint !mt-1">{intro}</p>}</div>
      {children}
    </section>
  );
}

export default function SeoForm({ initial, siteUrl }: { initial: Seo; siteUrl: string }) {
  const [seo, setSeo] = useState<Seo>(initial);
  // Lists are edited as comma-separated text and split on save.
  const [lists, setLists] = useState<Record<ListKey, string>>({
    primaryKeywords: initial.primaryKeywords.join(', '), secondaryKeywords: initial.secondaryKeywords.join(', '),
    serviceAreas: initial.serviceAreas.join(', '), nearbyLocations: initial.nearbyLocations.join(', '),
    mainServices: initial.mainServices.join(', '), serviceKeywords: initial.serviceKeywords.join(', '),
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const text = (key: TextKey, label: string, opts: { hint?: string; max?: number; area?: boolean; placeholder?: string } = {}) => (
    <Field label={label} hint={opts.max ? `${opts.hint ? `${opts.hint} ` : ''}${seo[key].length}/${opts.max} characters` : opts.hint}>
      {opts.area
        ? <textarea className="input" maxLength={opts.max} value={seo[key]} placeholder={opts.placeholder} onChange={(e) => setSeo((s) => ({ ...s, [key]: e.target.value }))} />
        : <input className="input" maxLength={opts.max} value={seo[key]} placeholder={opts.placeholder} onChange={(e) => setSeo((s) => ({ ...s, [key]: e.target.value }))} />}
    </Field>
  );
  const list = (key: ListKey, label: string, hint: string) => (
    <Field label={label} hint={hint}><input className="input" value={lists[key]} onChange={(e) => setLists((l) => ({ ...l, [key]: e.target.value }))} /></Field>
  );
  const toggle = (key: BoolKey, label: string) => (
    <label className="flex items-start gap-2.5 text-sm">
      <input type="checkbox" className="mt-0.5" checked={seo[key]} onChange={(e) => setSeo((s) => ({ ...s, [key]: e.target.checked }))} />
      <span>{label}</span>
    </label>
  );

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    setSaving(true); setError(''); setSaved(false);
    const body = { ...seo, ...Object.fromEntries((Object.keys(lists) as ListKey[]).map((k) => [k, toList(lists[k])])) };
    const res = await fetch('/api/seo', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
    setSaving(false);
    if (!res?.ok) { const d = await res?.json().catch(() => ({})); setError(d?.error || 'The SEO settings could not be saved.'); return; }
    setSaved(true); setTimeout(() => setSaved(false), 2500);
  }

  // A few natural "service in location" phrases built from what is entered, as a writing aid only.
  const city = seo.city || seo.primaryLocation;
  const phrases = city ? toList(lists.mainServices).slice(0, 6).map((s) => `${s} in ${city}`) : [];

  return (
    <form noValidate onSubmit={save} className="flex flex-col gap-6 max-w-3xl">
      <Card title="Global SEO">
        {text('siteTitle', 'Site Title', { max: 70, hint: 'The short name of the site.' })}
        {text('seoTitle', 'SEO Title (home page)', { max: 70, hint: 'Shown in the browser tab and as the headline in search results. Around 50–60 characters reads best.' })}
        {text('titleTemplate', 'Title template for other pages', { max: 80, hint: '%s is replaced by the page name, e.g. “Join as Crew | Medwin Montage”.' })}
        {text('metaDescription', 'Meta Description', { max: 200, area: true, hint: 'One or two plain sentences. Around 150 characters reads best.' })}
        {list('primaryKeywords', 'Primary Keywords', 'Separate with commas. A handful of real phrases people search for.')}
        {list('secondaryKeywords', 'Secondary Keywords', 'Separate with commas.')}
        {text('businessName', 'Business Name', { max: 100 })}
        {text('businessDescription', 'Business Description', { max: 600, area: true, hint: 'Shown in the footer and in structured data.' })}
      </Card>

      <Card title="Social previews" intro="How a link to the site looks when shared. Leave a field empty to reuse the SEO title and description.">
        {text('ogTitle', 'Default OG Title', { max: 90 })}
        {text('ogDescription', 'Default OG Description', { max: 200, area: true })}
        {text('ogImage', 'OG Image URL', { placeholder: 'https://…', hint: 'A 1200×630 image works best. Full URL starting with https://' })}
        {text('twitterTitle', 'Twitter/X Card Title', { max: 90 })}
        {text('twitterDescription', 'Twitter/X Card Description', { max: 200, area: true })}
        {text('twitterImage', 'Twitter/X Card Image URL', { placeholder: 'https://…' })}
      </Card>

      <Card title="Location SEO" intro="Where the business is and where it works. Used in structured data, the services intro and the footer.">
        {text('primaryLocation', 'Primary Location', { max: 120, placeholder: 'e.g. Thanjavur, Tamil Nadu' })}
        <div className="grid sm:grid-cols-2 gap-4">
          {text('city', 'City', { max: 80 })}
          {text('district', 'District', { max: 80 })}
          {text('state', 'State', { max: 80 })}
          {text('country', 'Country', { max: 80 })}
        </div>
        {list('serviceAreas', 'Service Areas', 'Cities or areas you take work in. Separate with commas.')}
        {list('nearbyLocations', 'Nearby / target locations', 'Separate with commas.')}
      </Card>

      <Card title="Business & service SEO">
        {list('mainServices', 'Main services', 'e.g. Video editing, Videography, Website development, Digital marketing. Separate with commas.')}
        {list('serviceKeywords', 'Service keywords', 'Separate with commas.')}
        {text('localDescription', 'Local business description', { max: 600, area: true, hint: 'A natural sentence or two, shown under the Services heading. Write it for people, not as a keyword list.' })}
        {phrases.length > 0 && (
          <div className="rounded-xl border border-line bg-paper-2 p-4">
            <p className="text-xs font-bold text-muted mb-2">Service + location phrases you could work into your description</p>
            <ul className="flex flex-wrap gap-1.5">{phrases.map((p) => <li key={p} className="badge badge-neutral">{p}</li>)}</ul>
            <p className="hint">Use the ones that are true, in normal sentences. Repeating phrases or listing every town reads as spam and can hurt.</p>
          </div>
        )}
      </Card>

      <Card title="Technical SEO">
        {text('canonicalUrl', 'Default Canonical URL', { placeholder: siteUrl || 'https://www.yourdomain.com', hint: `The main address of the site. Leave empty to use NEXT_PUBLIC_SITE_URL${siteUrl ? ` (${siteUrl})` : ''}.` })}
        {toggle('robotsIndex', 'Allow search engines to index the site')}
        {toggle('robotsFollow', 'Allow search engines to follow links')}
        {toggle('sitemapEnabled', 'Publish /sitemap.xml')}
        {toggle('structuredData', 'Add structured data (business, website, services, FAQ, breadcrumbs)')}
        {!seo.robotsIndex && <FormError>Indexing is off: the site will ask search engines not to list it.</FormError>}
      </Card>

      <FormError>{error}</FormError>
      <div className="sticky bottom-4 z-10 w-fit card card-glass p-2.5 flex items-center gap-3">
        <button type="submit" disabled={saving} className="btn btn-primary btn-cta">{saving ? 'Saving…' : 'Save SEO settings'}</button>
      </div>
      <div role="status" aria-live="polite">{saved && <div className="toast"><Icon name="check" /> SEO settings saved</div>}</div>
    </form>
  );
}

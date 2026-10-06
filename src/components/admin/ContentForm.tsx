'use client';
import { useState } from 'react';
import Icon from '@/components/site/Icon';
import { Field, FormError } from '@/components/ui/Field';

type Content = {
  heroEyebrow: string; heroHeadline: string; heroSub: string; heroStats: { value: string; label: string }[];
  whoHeadline: string; whoText: string;
  contactAddress: string; contactPhone: string; contactEmail: string; contactHours: string;
  socialInstagram: string; socialFacebook: string; socialYoutube: string; socialLinkedin: string; socialTwitter: string;
  privacyMode: string; privacyText: string; privacyUrl: string;
  termsMode: string; termsText: string; termsUrl: string;
  refundMode: string; refundText: string; refundUrl: string;
  bookOfferEnabled: boolean; themeMode: string;
  whatsappNumber: string; logoUrl: string;
};
type Offer = { id: string; enabled: boolean; text: string; url: string; endAt: string };

/**
 * `section` picks which cards are shown: "content" (Admin → Content) or
 * "settings" (Admin → Site Settings). Both save through the same API.
 */
export default function ContentForm({ initialContent, initialOffer, section }: { initialContent: Content; initialOffer: Offer; section: 'content' | 'settings' }) {
  const [content, setContent] = useState(initialContent);
  const [offer, setOffer] = useState(initialOffer);
  const [savedMsg, setSavedMsg] = useState('');
  const [offerError, setOfferError] = useState('');
  const [saveError, setSaveError] = useState('');
  const [uploading, setUploading] = useState(false);
  const isContent = section === 'content';

  function set<K extends keyof Content>(key: K, value: Content[K]) { setContent((c) => ({ ...c, [key]: value })); }
  function setStat(i: number, key: 'value' | 'label', value: string) {
    setContent((c) => { const stats = [...c.heroStats]; stats[i] = { ...stats[i], [key]: value }; return { ...c, heroStats: stats }; });
  }

  async function put(body: unknown, okMessage: string) {
    setSaveError('');
    const res = await fetch('/api/content', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).catch(() => null);
    if (!res?.ok) { const d = await res?.json().catch(() => ({})); setSaveError(d?.error || 'Not saved. Please try again.'); return false; }
    flash(okMessage);
    return true;
  }
  const saveContent = () => put(content, isContent ? 'Content updated' : 'Settings updated');

  // Logo: PNG, JPG or WebP up to 4 MB (SVG is not accepted because it can carry scripts).
  async function uploadLogo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setUploading(true); setSaveError('');
    const fd = new FormData(); fd.append('file', file); fd.append('folder', 'logo');
    const res = await fetch('/api/upload', { method: 'POST', body: fd }).catch(() => null);
    const d = await res?.json().catch(() => ({}));
    setUploading(false);
    if (!res?.ok) { setSaveError(d?.error || 'Upload failed'); return; }
    set('logoUrl', d.url);
    await put({ logoUrl: d.url }, 'Logo updated');
  }
  async function removeLogo() { set('logoUrl', ''); await put({ logoUrl: '' }, 'Logo removed'); }
  async function saveOffer() {
    if (offer.url) {
      try { new URL(offer.url); } catch { setOfferError('Please enter a valid URL, including https://'); return; }
    }
    setOfferError('');
    const res = await fetch('/api/offer', {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled: offer.enabled, text: offer.text, url: offer.url, endAt: new Date(offer.endAt).toISOString() }),
    });
    if (!res.ok) { const d = await res.json().catch(() => ({})); setOfferError(d.error || 'Save failed'); return; }
    flash('Offer updated');
  }
  const saveTheme = () => put({ themeMode: content.themeMode, bookOfferEnabled: content.bookOfferEnabled }, 'Settings updated');
  function flash(msg: string) { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 2500); }

  return (
    <div className="flex flex-col gap-8 max-w-2xl">
      <div role="status" aria-live="polite">{savedMsg && <div className="toast"><Icon name="check" /> {savedMsg}</div>}</div>
      {saveError && <div className="sticky top-20 z-20"><FormError>{saveError}</FormError></div>}

      <Card show={!isContent} title="Logo">
        <div className="flex items-center gap-4 flex-wrap">
          <span className="w-16 h-16 rounded-xl border border-line bg-paper-2 flex items-center justify-center overflow-hidden">
            <img src={content.logoUrl || '/mark-orange.png'} alt="Current logo" className="max-w-full max-h-full object-contain" />
          </span>
          <label className="btn btn-secondary cursor-pointer">
            {uploading ? 'Uploading…' : 'Upload logo'}
            <input type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" onChange={uploadLogo} disabled={uploading} />
          </label>
          {content.logoUrl && <button type="button" onClick={removeLogo} className="btn btn-ghost">Use the built-in logo</button>}
        </div>
        <p className="hint">Shown in the header and footer. A square PNG or WebP with a transparent background works best; up to 4 MB.</p>
      </Card>

      <Card show={isContent} title="Hero Section">
        <Field label="Eyebrow text"><input className="input" value={content.heroEyebrow} onChange={(e) => set('heroEyebrow', e.target.value)} /></Field>
        <Field label="Headline" hint="The last two words are shown in orange. To choose the words yourself, wrap them in asterisks — for example: We create videos that *grow your brand*."><input className="input" value={content.heroHeadline} onChange={(e) => set('heroHeadline', e.target.value)} /></Field>
        <Field label="Subheading"><textarea className="input" value={content.heroSub} onChange={(e) => set('heroSub', e.target.value)} /></Field>
        <p className="text-xs font-bold text-muted mt-2 mb-1">Stats panel</p>
        <div className="grid grid-cols-2 gap-3">
          {content.heroStats.map((s, i) => (
            <div key={i} className="contents">
              <input className="input" aria-label={`Stat ${i + 1} value`} placeholder="Value" value={s.value} onChange={(e) => setStat(i, 'value', e.target.value)} />
              <input className="input" aria-label={`Stat ${i + 1} label`} placeholder="Label" value={s.label} onChange={(e) => setStat(i, 'label', e.target.value)} />
            </div>
          ))}
        </div>
        <button type="button" onClick={saveContent} className="btn btn-primary mt-4 w-fit">Save changes</button>
      </Card>

      <Card show={isContent} title="Who Section">
        <Field label="Headline"><input className="input" value={content.whoHeadline} onChange={(e) => set('whoHeadline', e.target.value)} /></Field>
        <Field label="Bio text (separate paragraphs with a blank line)">
          <textarea className="input min-h-[160px]" value={content.whoText} onChange={(e) => set('whoText', e.target.value)} />
        </Field>
        <button type="button" onClick={saveContent} className="btn btn-primary mt-2 w-fit">Save changes</button>
      </Card>

      <Card show={!isContent} title="Site Settings">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={content.bookOfferEnabled} onChange={(e) => set('bookOfferEnabled', e.target.checked)} />
          Let visitors join the offer waitlist (&ldquo;Book offer&rdquo;)
        </label>
        <Field label="Default theme for new visitors">
          <select className="input" value={content.themeMode} onChange={(e) => set('themeMode', e.target.value)}>
            <option value="dark">Dark (black + orange)</option>
            <option value="light">Light (white + orange)</option>
            <option value="system">Match the visitor&rsquo;s device</option>
          </select>
        </Field>
        <p className="hint">A visitor&rsquo;s own light/dark toggle choice always overrides this once they&rsquo;ve used it.</p>
        <button type="button" onClick={saveTheme} className="btn btn-primary mt-2 w-fit">Save changes</button>
      </Card>

      <Card show={isContent} title="Offer">
        <label className="flex items-center gap-2 text-sm font-semibold">
          <input type="checkbox" checked={offer.enabled} onChange={(e) => setOffer((o) => ({ ...o, enabled: e.target.checked }))} />
          Offer is running (visitors open it from the gift button in the header)
        </label>
        <Field label="Offer text"><input className="input" value={offer.text} onChange={(e) => setOffer((o) => ({ ...o, text: e.target.value }))} /></Field>
        <Field label="Offer URL" hint="&ldquo;Claim offer&rdquo; opens this URL. Leave blank to open the service wizard instead.">
          <input className="input" value={offer.url} onChange={(e) => setOffer((o) => ({ ...o, url: e.target.value }))} placeholder="https://..." />
        </Field>
        <Field label="Ends at"><input type="datetime-local" className="input" value={offer.endAt.slice(0, 16)} onChange={(e) => setOffer((o) => ({ ...o, endAt: e.target.value }))} /></Field>
        <FormError>{offerError}</FormError>
        <button type="button" onClick={saveOffer} className="btn btn-primary mt-2 w-fit">Save changes</button>
      </Card>

      <Card show={!isContent} title="Contact & Social">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Address"><input className="input" value={content.contactAddress} onChange={(e) => set('contactAddress', e.target.value)} /></Field>
          <Field label="Phone" hint="Shown in the footer as a tap-to-call link."><input className="input" type="tel" value={content.contactPhone} onChange={(e) => set('contactPhone', e.target.value)} /></Field>
          <Field label="WhatsApp number" hint="With country code, e.g. +91 94878 97160. Used for the footer WhatsApp link and for booking messages. Leave blank to hide the link."><input className="input" type="tel" value={content.whatsappNumber} onChange={(e) => set('whatsappNumber', e.target.value)} /></Field>
          <Field label="Email"><input className="input" value={content.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} /></Field>
          <Field label="Working hours"><input className="input" value={content.contactHours} onChange={(e) => set('contactHours', e.target.value)} /></Field>
        </div>
        <p className="text-xs font-bold text-muted mt-3 mb-1">Social links — paste the full address starting with https:// (blank hides the icon)</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Instagram"><input className="input" value={content.socialInstagram} onChange={(e) => set('socialInstagram', e.target.value)} /></Field>
          <Field label="Facebook"><input className="input" value={content.socialFacebook} onChange={(e) => set('socialFacebook', e.target.value)} /></Field>
          <Field label="YouTube"><input className="input" value={content.socialYoutube} onChange={(e) => set('socialYoutube', e.target.value)} /></Field>
          <Field label="LinkedIn"><input className="input" value={content.socialLinkedin} onChange={(e) => set('socialLinkedin', e.target.value)} /></Field>
          <Field label="X / Twitter"><input className="input" value={content.socialTwitter} onChange={(e) => set('socialTwitter', e.target.value)} /></Field>
        </div>
        <button type="button" onClick={saveContent} className="btn btn-primary mt-4 w-fit">Save changes</button>
      </Card>

      {(['privacy', 'terms', 'refund'] as const).map((k) => (
        <Card show={isContent} key={k} title={{ privacy: 'Privacy Policy', terms: 'Terms & Conditions', refund: 'Refund Policy' }[k]}>
          <div className="flex gap-2 mb-3">
            <button type="button" onClick={() => set(`${k}Mode` as any, 'text')} className={`flex-1 py-2.5 border rounded-xl text-sm font-bold ${content[`${k}Mode` as keyof Content] === 'text' ? 'border-accent text-accent-ink bg-accent/10' : 'border-line-strong'}`}>Write policy text</button>
            <button type="button" onClick={() => set(`${k}Mode` as any, 'url')} className={`flex-1 py-2.5 border rounded-xl text-sm font-bold ${content[`${k}Mode` as keyof Content] === 'url' ? 'border-accent text-accent-ink bg-accent/10' : 'border-line-strong'}`}>Link external URL</button>
          </div>
          {content[`${k}Mode` as keyof Content] === 'text' ? (
            <textarea className="input min-h-[120px]" value={content[`${k}Text` as keyof Content] as string} onChange={(e) => set(`${k}Text` as any, e.target.value)} />
          ) : (
            <input className="input" value={content[`${k}Url` as keyof Content] as string} onChange={(e) => set(`${k}Url` as any, e.target.value)} placeholder="https://..." />
          )}
          <button type="button" onClick={saveContent} className="btn btn-primary mt-3 w-fit">Save changes</button>
        </Card>
      ))}
    </div>
  );
}

function Card({ title, children, show = true }: { title: string; children: React.ReactNode; show?: boolean }) {
  if (!show) return null;
  return (
    <div className="card p-6">
      <h4 className="font-display font-bold text-lg mb-4">{title}</h4>
      <div className="flex flex-col gap-3">{children}</div>
    </div>
  );
}

'use client';
import { useRef, useState } from 'react';
import { Field, FormError, SuccessMark } from '@/components/ui/Field';
import { CREW_ROLES } from '@/lib/validators';

const MAX_RESUME = 5 * 1024 * 1024;
const RESUME_EXT = /\.(pdf|doc|docx)$/i;

type Values = {
  fullName: string; phone: string; age: string; role: string; experienceType: '' | 'Fresher' | 'Experienced'; experienceYears: string;
  workedInOrganization: '' | 'Yes' | 'No'; organizationName: string; educationStatus: '' | 'Studying' | 'Studied' | 'Neither';
  studiedWhat: string; studyingWhatWhere: string; previousWorkUrl: string;
};
const EMPTY: Values = { fullName: '', phone: '', age: '', role: '', experienceType: '', experienceYears: '', workedInOrganization: '', organizationName: '', educationStatus: '', studiedWhat: '', studyingWhatWhere: '', previousWorkUrl: '' };

/** One-of-many choice rendered as radio buttons, so only a single answer is possible. */
function Choice<T extends string>({ legend, name, options, value, onChange }: { legend: string; name: string; options: readonly T[]; value: string; onChange: (v: T) => void }) {
  return (
    <fieldset>
      <legend className="label">{legend}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label key={o} className={`cursor-pointer rounded-xl border px-4 py-2.5 text-sm font-bold transition-all duration-200 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent ${value === o ? 'border-accent bg-accent/10 text-accent-ink shadow-glow-sm' : 'border-line-strong hover:border-accent/60'}`}>
            <input type="radio" name={name} value={o} checked={value === o} onChange={() => onChange(o)} className="sr-only" />
            {o}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function CrewForm() {
  const [v, setV] = useState<Values>(EMPTY);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [doneRef, setDoneRef] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Values>(k: K, value: Values[K]) => setV((s) => ({ ...s, [k]: value }));

  // Same rules as the server (src/lib/validators.ts) — the server is the one that counts.
  function check(): string {
    if (v.fullName.trim().length < 2) return 'Please enter your full name.';
    if (!/^\+?[0-9][0-9\s\-()]{6,17}$/.test(v.phone.trim())) return 'Please enter a valid phone number.';
    const age = Number(v.age);
    if (!v.age || !Number.isInteger(age) || age < 16 || age > 70) return 'Please enter your age (16 to 70).';
    if (!v.role) return 'Please choose a role.';
    if (!v.experienceType) return 'Please choose Fresher or Experienced.';
    if (v.experienceType === 'Experienced' && !(Number(v.experienceYears) >= 0.5)) return 'Please enter how many years of experience you have.';
    if (!v.workedInOrganization) return 'Please tell us whether you have worked in another organization or company.';
    if (!v.educationStatus) return 'Please tell us whether you are studying or have studied.';
    if (v.educationStatus === 'Studying' && !v.studyingWhatWhere.trim()) return 'Please tell us what and where you are studying.';
    if (v.previousWorkUrl.trim() && !/^https:\/\/\S+\.\S+/.test(v.previousWorkUrl.trim())) return 'Please paste a full link starting with https://';
    if (file && !RESUME_EXT.test(file.name)) return 'Please upload your resume as a PDF, DOC or DOCX file.';
    if (file && file.size > MAX_RESUME) return 'The resume must be 5 MB or smaller.';
    return '';
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (loading) return;
    const problem = check();
    if (problem) { setError(problem); return; }
    setError(''); setLoading(true);
    const body = new FormData();
    Object.entries(v).forEach(([k, value]) => body.append(k, value));
    if (file) body.append('resume', file);
    try {
      const res = await fetch('/api/crew', { method: 'POST', body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) { setError(data.error || 'Something went wrong. Please try again.'); return; }
      setDoneRef(data.ref);
      window.scrollTo({ top: 0 });
    } catch {
      setError('We could not reach the server. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (doneRef) {
    return (
      <div className="card p-8 sm:p-10 text-center" role="status">
        <SuccessMark />
        <h2 className="font-display font-extrabold text-2xl sm:text-3xl mb-3">Application sent</h2>
        <p className="text-muted mb-5">Thank you, {v.fullName.trim()}. We will call you on {v.phone.trim()} if there is a fit.</p>
        <span className="badge badge-neutral">Reference: {doneRef}</span>
        <div className="mt-8"><a href="/" className="btn btn-secondary">Back to the home page</a></div>
      </div>
    );
  }

  return (
    <form noValidate onSubmit={submit} className="card p-5 sm:p-8 flex flex-col gap-6">
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Full Name *"><input className="input" autoComplete="name" value={v.fullName} onChange={(e) => set('fullName', e.target.value)} /></Field>
        <Field label="Phone Number *"><input type="tel" inputMode="tel" className="input" autoComplete="tel" value={v.phone} onChange={(e) => set('phone', e.target.value)} /></Field>
        <Field label="Age *"><input type="number" inputMode="numeric" min={16} max={70} className="input" value={v.age} onChange={(e) => set('age', e.target.value)} /></Field>
        <Field label="Role *">
          <select className="input" value={v.role} onChange={(e) => set('role', e.target.value)}>
            <option value="">Select a role</option>
            {CREW_ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </Field>
      </div>

      <Choice legend="Experienced or Fresher *" name="experienceType" options={['Fresher', 'Experienced'] as const} value={v.experienceType} onChange={(x) => set('experienceType', x)} />
      {v.experienceType === 'Experienced' && (
        <div className="swap-in max-w-xs">
          <Field label="How many years of experience? *"><input type="number" inputMode="decimal" min={0.5} max={50} step={0.5} className="input" value={v.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} /></Field>
        </div>
      )}

      <Choice legend="Whether Worked In Any Other Organization/Company? *" name="workedInOrganization" options={['Yes', 'No'] as const} value={v.workedInOrganization} onChange={(x) => set('workedInOrganization', x)} />
      {v.workedInOrganization === 'Yes' && (
        <div className="swap-in">
          <Field label="Organization / company, your role and how long (optional)"><input className="input" autoComplete="organization" value={v.organizationName} onChange={(e) => set('organizationName', e.target.value)} placeholder="e.g. ABC Studios, video editor, 1 year" /></Field>
        </div>
      )}

      <Choice legend="Are You Studying Or Studied? *" name="educationStatus" options={['Studying', 'Studied', 'Neither'] as const} value={v.educationStatus} onChange={(x) => set('educationStatus', x)} />
      {v.educationStatus !== 'Neither' && v.educationStatus !== '' && (
        <div className="grid sm:grid-cols-2 gap-5 swap-in">
          <Field label="What You Have Studied?"><input className="input" value={v.studiedWhat} onChange={(e) => set('studiedWhat', e.target.value)} placeholder="e.g. B.Sc Visual Communication" /></Field>
          {v.educationStatus === 'Studying' && (
            <Field label="What & Where Are You Studying? *"><input className="input" value={v.studyingWhatWhere} onChange={(e) => set('studyingWhatWhere', e.target.value)} placeholder="Course and college / school" /></Field>
          )}
        </div>
      )}

      <div>
        <Field label="Upload Your Resume" hint="Resume upload is optional. You may skip this question. PDF, DOC or DOCX, up to 5 MB.">
          <input ref={fileRef} type="file" accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="input file:mr-3 file:rounded-lg file:border-0 file:bg-accent file:px-3 file:py-1.5 file:text-sm file:font-bold file:text-on-accent"
            onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </Field>
        {file && <button type="button" className="link-plain text-xs font-bold mt-2 underline" onClick={() => { setFile(null); if (fileRef.current) fileRef.current.value = ''; }}>Remove {file.name}</button>}
      </div>

      <Field label="Paste The Link Of Your Work Done Before" hint="Drive, WeTransfer, or other platforms. Optional.">
        <input type="url" inputMode="url" className="input" value={v.previousWorkUrl} onChange={(e) => set('previousWorkUrl', e.target.value)} placeholder="https://" />
      </Field>

      <FormError>{error}</FormError>
      <button type="submit" disabled={loading} className="btn btn-primary btn-cta btn-lg sm:self-start">{loading ? 'Sending…' : 'Send application'}</button>
    </form>
  );
}

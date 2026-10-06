import { ReactNode } from 'react';
import Icon from '@/components/site/Icon';

/**
 * A form field. The control sits inside the <label>, so the label text is
 * announced by screen readers and clicking it focuses the control. The hint
 * sits outside it so it doesn't become part of the field's name.
 */
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <div>
      <label className="field">
        <span className="label">{label}</span>
        {children}
      </label>
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
}

/** Error message: icon + text + border, so it never depends on colour alone. */
export function FormError({ children, className = '' }: { children: ReactNode; className?: string }) {
  if (!children) return null;
  return (
    <p role="alert" className={`form-error ${className}`}>
      <Icon name="alert" />
      <span>{children}</span>
    </p>
  );
}

/** Confirmation tick shown after a form has been submitted. */
export function SuccessMark() {
  return <div className="success-mark"><Icon name="check" /></div>;
}

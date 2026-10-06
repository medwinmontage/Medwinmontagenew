import Icon from '@/components/site/Icon';
import { WorkStatus, statusBadgeClass } from '@/lib/status';

const FLOW = ['Request received', 'Incomplete', 'Processing', 'Completed'] as const;

export function StatusBadge({ status }: { status: string }) {
  return <span className={`badge ${statusBadgeClass(status)}`}>{status}</span>;
}

/**
 * Request received → Incomplete → Processing → Completed.
 * Each step says "done", "current" or "next" in words (visually hidden) and
 * uses a tick / filled dot / empty ring, so it never relies on colour alone.
 */
export default function StatusTimeline({ status }: { status: WorkStatus }) {
  const stopped = status === 'Cancelled' || status === 'Rejected';
  const steps: readonly string[] = stopped ? ['Request received', status] : FLOW;
  const current = stopped ? 1 : FLOW.indexOf(status);
  const allDone = status === 'Completed';

  return (
    <ol className="flex items-start" aria-label={`Progress: ${status}`}>
      {steps.map((label, i) => {
        const done = i < current || allDone;
        const isCurrent = i === current && !allDone;
        const state = done ? 'done' : isCurrent ? 'current' : 'next';
        return (
          <li key={label} className="relative flex-1 flex flex-col items-center text-center min-w-0" aria-current={isCurrent ? 'step' : undefined}>
            {i > 0 && <span aria-hidden className={`absolute top-[11px] right-1/2 w-full h-0.5 -z-0 ${done || isCurrent ? 'bg-accent' : 'bg-line-strong'}`} />}
            <span className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center border-2 ${
              stopped && isCurrent ? 'border-[var(--bad)] bg-card text-[var(--bad)]'
                : done ? 'border-accent bg-accent text-on-accent'
                : isCurrent ? 'border-accent bg-card shadow-glow-sm'
                : 'border-line-strong bg-card'}`}>
              {stopped && isCurrent ? <Icon name="close" className="w-3 h-3" /> : done ? <Icon name="check" className="w-3.5 h-3.5" /> : isCurrent ? <span className="w-2 h-2 rounded-full bg-accent" /> : null}
            </span>
            <span className={`mt-2 px-1 text-[11.5px] leading-tight ${isCurrent ? 'font-extrabold text-ink' : done ? 'font-semibold text-ink-2' : 'text-muted'}`}>
              {label}<span className="sr-only"> ({state})</span>
            </span>
          </li>
        );
      })}
    </ol>
  );
}

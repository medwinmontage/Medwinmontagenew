// One status vocabulary for event bookings and service/offer requests.
// Customers see the three-step flow  Incomplete → Processing → Completed;
// Cancelled and Rejected end the flow early.
export const WORK_STATUSES = ['Incomplete', 'Processing', 'Completed', 'Cancelled', 'Rejected'] as const;
export type WorkStatus = (typeof WORK_STATUSES)[number];

export const QUOTE_STATUSES = ['Requested', 'Quoted', 'Closed'] as const;
export const CREW_STATUSES = ['New', 'Reviewing', 'Shortlisted', 'Rejected', 'Hired'] as const;
export const FEEDBACK_STATUSES = ['Pending', 'Approved', 'Rejected'] as const;

// Rows created before this upgrade used Pending / Confirmed. They are read as
// their new equivalents, so no data has to be rewritten for the app to work.
const LEGACY: Record<string, WorkStatus> = { Pending: 'Incomplete', Confirmed: 'Processing' };

export function normalizeStatus(status: string | null | undefined): WorkStatus {
  if (!status) return 'Incomplete';
  if ((WORK_STATUSES as readonly string[]).includes(status)) return status as WorkStatus;
  return LEGACY[status] ?? 'Incomplete';
}

export const STATUS_HELP: Record<WorkStatus, string> = {
  Incomplete: 'We have your request and are confirming the details.',
  Processing: 'Work is under way.',
  Completed: 'This work is finished.',
  Cancelled: 'This request was cancelled.',
  Rejected: 'We could not take this request on.',
};

/** Badge colour class (see .badge-* in globals.css). Always shown with the status text. */
export function statusBadgeClass(status: string): string {
  if (status === 'Completed' || status === 'Approved' || status === 'Hired' || status === 'Quoted' || status === 'Active') return 'badge-ok';
  if (status === 'Cancelled' || status === 'Rejected' || status === 'Suspended') return 'badge-bad';
  if (status === 'Closed') return 'badge-neutral';
  return '';
}

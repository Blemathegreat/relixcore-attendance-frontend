import { useEffect, useRef } from 'react';

export function Notice({ tone = 'info', title, children, className = '' }) {
  const border = { info: 'border-brand-teal', success: 'border-brand-teal', warn: 'border-brand-orange', error: 'border-brand-red' }[tone];
  return (
    <div role={tone === 'error' ? 'alert' : 'status'} className={`rounded-xl border-l-4 bg-white p-4 text-sm ${border} ${className}`}>
      {title && <p className="mb-0.5 font-bold text-brand-ink">{title}</p>}
      <div className="text-brand-ink">{children}</div>
    </div>
  );
}

export function Spinner({ label = 'Loading' }) {
  return (
    <div className="flex items-center gap-2 p-4 text-sm" role="status">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-brand-teal border-t-transparent motion-reduce:animate-none" />
      {label}…
    </div>
  );
}

export function Field({ label, hint, error, children, htmlFor }) {
  return (
    <div>
      <label className="label" htmlFor={htmlFor}>{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs">{hint}</p>}
      {error && <p className="mt-1 text-xs font-bold text-brand-ink">{error}</p>}
    </div>
  );
}

const BADGES = {
  on_time: ['bg-brand-teal', 'On time'],
  late: ['bg-brand-orange', 'Late'],
  absent: ['bg-brand-red', 'Potential absence'],
  pending: ['bg-brand-ink/40', 'Not in yet'],
  missing: ['bg-brand-red', 'Missing sign-out'],
  progress: ['bg-brand-teal', 'Signed in'],
  off: ['bg-brand-ink/30', 'Non-working day'],
};

/** Dot + dark text keeps contrast high; colour never carries meaning alone. */
export function Badge({ kind, children }) {
  const [dot, label] = BADGES[kind] || BADGES.off;
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-black/10 bg-white px-2.5 py-0.5 text-xs font-bold text-brand-ink">
      <span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />
      {children || label}
    </span>
  );
}

/** Calculated day -> badges. */
export function DayBadges({ day }) {
  const out = [];
  if (day.dayStatus === 'absent') out.push(<Badge key="a" kind="absent" />);
  else if (day.dayStatus === 'pending') out.push(<Badge key="p" kind="pending" />);
  else if (day.dayStatus === 'non_working' && !day.recorded) {
    out.push(<Badge key="o" kind="off">{day.nonWorkingReason === 'holiday' ? `Holiday: ${day.holidayName}` : 'Weekend'}</Badge>);
  } else if (day.recorded) {
    if (day.punctuality === 'late') out.push(<Badge key="l" kind="late">Late {day.lateMinutes}m</Badge>);
    else out.push(<Badge key="t" kind="on_time" />);
    if (day.missingSignOut) out.push(<Badge key="m" kind="missing" />);
    if (day.inProgress) out.push(<Badge key="i" kind="progress" />);
  }
  return <span className="flex flex-wrap gap-1">{out}</span>;
}

/** Native <dialog>: focus trapping and Esc come for free. Bottom sheet on phones, centred card from 640 px. */
export function Modal({ open, onClose, title, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog
      ref={ref}
      onClose={onClose}
      className={`mb-0 mt-auto max-h-[92dvh] w-full max-w-none rounded-b-none rounded-t-2xl p-0 backdrop:bg-brand-ink/60 sm:m-auto sm:max-h-[90dvh] sm:w-[calc(100%-2rem)] sm:rounded-2xl ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'}`}
    >
      {open && (
        <div className="p-5">
          <div className="mb-4 flex items-start justify-between gap-3">
            <h2 className="text-xl">{title}</h2>
            <button type="button" onClick={onClose} className="btn btn-secondary btn-sm" aria-label="Close">Close</button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}
export function PageTitle({ children, action }) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3 print:hidden">
      <h1 className="text-2xl sm:text-3xl">{children}</h1>
      {action}
    </div>
  );
}

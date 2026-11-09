const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
export const WEEKDAY_OPTIONS = [
  { value: 1, label: 'Mon' }, { value: 2, label: 'Tue' }, { value: 3, label: 'Wed' },
  { value: 4, label: 'Thu' }, { value: 5, label: 'Fri' }, { value: 6, label: 'Sat' }, { value: 0, label: 'Sun' },
];

const dateFmt = new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
const monthFmt = new Intl.DateTimeFormat('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' });

/** '2026-10-29' -> 'Thu 29 Oct 2026'. Calendar dates carry no timezone. */
export function fmtDate(str) {
  if (!str) return '';
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAYS[dt.getUTCDay()]} ${dateFmt.format(dt)}`;
}

export function fmtShortDate(str) {
  const [y, m, d] = str.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return `${WEEKDAYS[dt.getUTCDay()]} ${d} ${new Intl.DateTimeFormat('en-GB', { month: 'short', timeZone: 'UTC' }).format(dt)}`;
}

export function fmtMonth(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  return monthFmt.format(new Date(Date.UTC(y, m - 1, 1)));
}

export function fmtDateTime(iso, tz) {
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: tz,
  }).format(new Date(iso));
}

export function fmtMinutes(min) {
  if (min === null || min === undefined) return '';
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}

/** Today's date (YYYY-MM-DD) in the company timezone. */
export function todayIn(tz) {
  const p = Object.fromEntries(
    new Intl.DateTimeFormat('en-GB', { timeZone: tz, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date()).map((x) => [x.type, x.value]),
  );
  return `${p.year}-${p.month}-${p.day}`;
}

export const monthOf = (dateStr) => dateStr.slice(0, 7);

export const ACTION_LABELS = {
  'attendance.correct': 'Corrected attendance',
  'attendance.create_manual': 'Added attendance record',
  'employee.create': 'Created employee',
  'employee.update': 'Updated employee',
  'employee.activate': 'Activated employee',
  'employee.deactivate': 'Deactivated employee',
  'employee.reset_password': 'Reset password',
  'settings.update': 'Changed settings',
  'holiday.create': 'Added holiday',
  'holiday.delete': 'Removed holiday',
};

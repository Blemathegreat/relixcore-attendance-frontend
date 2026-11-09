import { Logo } from './Logo.jsx';
import { fmtDateTime, fmtMinutes, fmtMonth, fmtShortDate } from '../lib/format.js';

function dayText(d) {
  if (d.dayStatus === 'absent') return 'Potential absence';
  if (d.dayStatus === 'pending') return 'Not in yet';
  if (d.dayStatus === 'non_working' && !d.recorded) return d.nonWorkingReason === 'holiday' ? `Holiday: ${d.holidayName}` : 'Weekend';
  if (!d.recorded) return '';
  const parts = [d.punctuality === 'late' ? `Late (${d.lateMinutes} min)` : 'On time'];
  if (d.missingSignOut) parts.push('Missing sign-out');
  if (d.inProgress) parts.push('Still signed in');
  return parts.join('; ');
}

/** Same markup on screen and on paper (white, A4-friendly, branded header). */
export function PrintableReport({ report, month, timezone }) {
  const { meta, employees } = report;
  const generated = fmtDateTime(meta.generatedAt, timezone);
  return (
    <article className="bg-white text-brand-ink print:text-black">
      <header className="report-section flex items-start justify-between gap-4 border-b-4 border-brand-teal p-5 print:px-0">
        <div>
          <h1 className="text-2xl">Monthly attendance report</h1>
          <p className="mt-1 text-lg font-bold">{fmtMonth(month)}</p>
          <p className="mt-2 text-xs">
            Period {meta.from} to {meta.to} · Generated {generated} ({timezone})
          </p>
          <p className="text-xs">
            Work {meta.policy.resumeTime}–{meta.policy.closeTime} · Grace {meta.policy.graceMinutes} min · Lateness counts from {meta.policy.resumeTime}
          </p>
        </div>
        <Logo className="h-24 w-auto shrink-0" />
      </header>

      <section className="report-section p-5 print:px-0">
        <h2 className="mb-2 text-lg">Summary</h2>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b-2 border-brand-teal">
                {['Employee', 'Working days', 'Present', 'On time', 'Late', 'Late min', 'Potential absences', 'Missing sign-out'].map((h) => (
                  <th key={h} className="th !whitespace-normal">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {employees.map((e) => (
                <tr key={e.userId}>
                  <td className="td"><span className="font-bold">{e.fullName}</span> <span className="text-xs">({e.employeeId})</span></td>
                  <td className="td">{e.totals.workingDays}</td>
                  <td className="td">{e.totals.presentDays}</td>
                  <td className="td">{e.totals.onTimeDays}</td>
                  <td className="td">{e.totals.lateDays}</td>
                  <td className="td">{e.totals.totalLateMinutes}</td>
                  <td className="td">{e.totals.absentDays}</td>
                  <td className="td">{e.totals.missingSignOutDays}</td>
                </tr>
              ))}
              {employees.length === 0 && <tr><td className="td" colSpan={8}>No employees for this selection.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs">
          "Potential absence" means no sign-in was recorded on a working day after closing time; HR should review each one. Missing
          sign-outs are shown as recorded: no times are estimated.
        </p>
      </section>

      {employees.map((e, i) => (
        <section key={e.userId} className={`p-5 print:px-0 ${i >= 0 ? 'report-break' : ''}`}>
          <div className="mb-2 flex flex-wrap items-end justify-between gap-2 border-b-2 border-brand-teal pb-2">
            <div>
              <h2 className="text-lg">{e.fullName}</h2>
              <p className="text-xs">{e.employeeId}{e.department ? ` · ${e.department}` : ''}{e.jobTitle ? ` · ${e.jobTitle}` : ''}</p>
            </div>
            <p className="text-xs">{month} · {e.totals.presentDays} present · {e.totals.lateDays} late · {e.totals.absentDays} potential absences</p>
          </div>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-black/20">
                {['Date', 'Sign in', 'Sign out', 'Hours', 'Status'].map((h) => <th key={h} className="th">{h}</th>)}
              </tr>
            </thead>
            <tbody className="divide-y divide-black/10">
              {e.days.filter((d) => d.dayStatus !== 'future' && d.dayStatus !== 'not_employed').map((d) => (
                <tr key={d.workDate} className={d.dayStatus === 'non_working' && !d.recorded ? 'bg-brand-platinum/50' : ''}>
                  <td className="td whitespace-nowrap">{fmtShortDate(d.workDate)}</td>
                  <td className="td">{d.signInTime || '—'}</td>
                  <td className="td">{d.signOutTime || (d.missingSignOut ? 'Missing' : '—')}</td>
                  <td className="td">{d.workedMinutes != null ? fmtMinutes(d.workedMinutes) : '—'}</td>
                  <td className="td">{dayText(d)}{d.source === 'correction' ? ' · edited by HR' : ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <footer className="p-5 text-xs print:px-0">Location checks use phone GPS and are an aid, not proof of presence.</footer>
    </article>
  );
}

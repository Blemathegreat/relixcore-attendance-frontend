import { useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { fmtDate } from '../lib/format.js';
import { DayBadges, Notice, PageTitle, Spinner } from '../components/ui.jsx';

const TILES = [
  ['signedIn', 'Signed in', 'bg-brand-teal'],
  ['onTime', 'On time', 'bg-brand-teal'],
  ['late', 'Late', 'bg-brand-orange'],
  ['notYetIn', 'Not in yet', 'bg-brand-ink/40'],
  ['absent', 'Potential absences', 'bg-brand-red'],
  ['missingSignOut', 'Missing sign-out', 'bg-brand-red'],
];

export default function HrDashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const load = useCallback(async () => {
    try { setData(await api.get('/hr/dashboard/today')); setError(''); } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => {
    load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [load]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!data) return <Spinner />;
  const nonWorking = data.isWorkingDay === false;

  return (
    <>
      <PageTitle action={<button className="btn btn-secondary btn-sm" onClick={load}>Refresh</button>}>
        Today, {fmtDate(data.date)}
      </PageTitle>
      {nonWorking && (
        <Notice className="mb-4" tone="info">
          {data.nonWorkingReason === 'holiday' ? `Today is a holiday (${data.holidayName}).` : 'Today is not a working day.'} No absences are counted.
        </Notice>
      )}
      <p className="mb-3 text-sm">
        Employees are only flagged as potential absences after closing time ({data.closeTime}). Until then they show as "Not in yet".
      </p>
      <ul className="mb-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {TILES.map(([key, label, dot]) => (
          <li key={key} className="card !p-4">
            <p className="font-display text-3xl text-brand-teal">{data.summary[key]}</p>
            <p className="mt-1 flex items-center gap-1.5 text-xs"><span className={`h-2 w-2 rounded-full ${dot}`} aria-hidden="true" />{label}</p>
          </li>
        ))}
      </ul>
      <div className="card overflow-x-auto !p-0">
        <table className="w-full">
          <thead className="border-b border-black/10">
            <tr><th className="th">Employee</th><th className="th">Department</th><th className="th">In</th><th className="th">Out</th><th className="th">Status</th></tr>
          </thead>
          <tbody className="divide-y divide-black/5">
            {data.employees.map((e) => (
              <tr key={e.userId}>
                <td className="td"><span className="font-bold">{e.fullName}</span><br /><span className="text-xs">{e.employeeId}</span></td>
                <td className="td">{e.department || '—'}</td>
                <td className="td">{e.signInTime || '—'}</td>
                <td className="td">{e.signOutTime || '—'}</td>
                <td className="td"><DayBadges day={e} /></td>
              </tr>
            ))}
            {data.employees.length === 0 && <tr><td className="td" colSpan={5}>No active employees yet. Add them under Employees.</td></tr>}
          </tbody>
        </table>
      </div>
    </>
  );
}

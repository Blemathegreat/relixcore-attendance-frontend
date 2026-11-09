import { useCallback, useEffect, useState } from 'react';
import { api, qs } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { monthOf, todayIn } from '../lib/format.js';
import { PrintableReport } from '../components/PrintableReport.jsx';
import { Field, Notice, PageTitle, Spinner } from '../components/ui.jsx';

export default function HrReports() {
  const { company } = useAuth();
  const [month, setMonth] = useState(() => monthOf(todayIn(company.timezone)));
  const [userId, setUserId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [report, setReport] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => { api.get('/hr/employees?status=all').then((r) => setEmployees(r.employees)).catch(() => {}); }, []);
  const load = useCallback(async () => {
    setReport(null);
    try { setReport(await api.get(`/hr/reports/monthly${qs({ month, userId })}`)); setError(''); }
    catch (e) { setError(e.message); }
  }, [month, userId]);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageTitle
        action={
          <div className="flex gap-2">
            <a className="btn btn-secondary" href={`/api/hr/reports/monthly.csv${qs({ month, userId })}`}>Download CSV</a>
            <button className="btn btn-primary" disabled={!report} onClick={() => window.print()}>Print report</button>
          </div>
        }
      >
        Monthly report
      </PageTitle>
      <div className="card mb-4 grid gap-3 sm:grid-cols-3 print:hidden">
        <Field label="Month" htmlFor="m"><input id="m" type="month" className="input" value={month} max={monthOf(todayIn(company.timezone))} onChange={(e) => e.target.value && setMonth(e.target.value)} /></Field>
        <div className="sm:col-span-2">
          <Field label="Employee" htmlFor="e">
            <select id="e" className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">All employees</option>
              {employees.map((x) => <option key={x.id} value={x.id}>{x.fullName} ({x.employeeId})</option>)}
            </select>
          </Field>
        </div>
      </div>
      {error && <Notice tone="error">{error}</Notice>}
      {!report && !error && <Spinner label="Building report" />}
      {report && (
        <div className="overflow-hidden rounded-2xl border border-black/5 print:rounded-none print:border-0">
          <PrintableReport report={report} month={month} timezone={company.timezone} />
        </div>
      )}
      <p className="mt-3 text-xs print:hidden">Tip: in the print window choose "Save as PDF" to keep a digital copy.</p>
    </>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, qs } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { fmtShortDate, monthOf, todayIn } from '../lib/format.js';
import { DayBadges, Field, Modal, Notice, PageTitle, Spinner } from '../components/ui.jsx';

function CorrectionForm({ employees, initial, onDone, onCancel }) {
  const [f, setF] = useState({ userId: '', workDate: '', signInTime: '', signOutTime: '', reason: '', ...initial });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const locked = Boolean(initial?.userId);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      await api.post('/hr/attendance/corrections', {
        userId: Number(f.userId), workDate: f.workDate,
        signInTime: f.signInTime || undefined, signOutTime: f.signOutTime || undefined, reason: f.reason,
      });
      onDone();
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      <Notice tone="info">Times are in company time. Every correction is saved in the audit log with your reason.</Notice>
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Employee" htmlFor="c-emp">
        <select id="c-emp" className="input" value={f.userId} onChange={set('userId')} disabled={locked} required>
          <option value="">Choose…</option>
          {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName} ({e.employeeId})</option>)}
        </select>
      </Field>
      <Field label="Date" htmlFor="c-date"><input id="c-date" type="date" className="input" value={f.workDate} onChange={set('workDate')} disabled={locked} required /></Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Sign-in time" htmlFor="c-in"><input id="c-in" type="time" className="input" value={f.signInTime} onChange={set('signInTime')} /></Field>
        <Field label="Sign-out time" htmlFor="c-out"><input id="c-out" type="time" className="input" value={f.signOutTime} onChange={set('signOutTime')} /></Field>
      </div>
      <Field label="Reason" htmlFor="c-why" hint="Required. For example: phone battery died, confirmed by supervisor.">
        <textarea id="c-why" className="input !min-h-[88px] py-2" value={f.reason} onChange={set('reason')} maxLength={500} required />
      </Field>
            <div className="sheet-actions">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={busy || f.reason.trim().length < 5}>{busy ? 'Saving…' : 'Save correction'}</button>
      </div>
    </form>
  );
}

export default function HrRecords() {
  const { company } = useAuth();
  const today = todayIn(company.timezone);
  const [from, setFrom] = useState(`${monthOf(today)}-01`);
  const [to, setTo] = useState(today);
  const [userId, setUserId] = useState('');
  const [employees, setEmployees] = useState([]);
  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [correction, setCorrection] = useState(null);

  useEffect(() => { api.get('/hr/employees?status=all').then((r) => setEmployees(r.employees)).catch(() => {}); }, []);
  const load = useCallback(async () => {
    setRows(null);
    try { setRows((await api.get(`/hr/attendance${qs({ from, to, userId })}`)).records); setError(''); }
    catch (e) { setError(e.message); setRows([]); }
  }, [from, to, userId]);
  useEffect(() => { load(); }, [load]);

  return (
    <>
      <PageTitle action={<button className="btn btn-primary" onClick={() => setCorrection({})}>Add or correct a record</button>}>Attendance records</PageTitle>
      <div className="card mb-4 grid gap-3 sm:grid-cols-4">
        <Field label="From" htmlFor="r-from"><input id="r-from" type="date" className="input" value={from} max={to} onChange={(e) => setFrom(e.target.value)} /></Field>
        <Field label="To" htmlFor="r-to"><input id="r-to" type="date" className="input" value={to} min={from} onChange={(e) => setTo(e.target.value)} /></Field>
        <div className="sm:col-span-2">
          <Field label="Employee" htmlFor="r-emp">
            <select id="r-emp" className="input" value={userId} onChange={(e) => setUserId(e.target.value)}>
              <option value="">Everyone</option>
              {employees.map((e) => <option key={e.id} value={e.id}>{e.fullName} ({e.employeeId}){e.isActive ? '' : ' — deactivated'}</option>)}
            </select>
          </Field>
        </div>
      </div>
      {error && <Notice tone="error" className="mb-4">{error}</Notice>}
      {!rows ? <Spinner /> : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full">
            <thead className="border-b border-black/10"><tr>
              <th className="th">Date</th><th className="th">Employee</th><th className="th">In</th><th className="th">Out</th><th className="th">Status</th><th className="th"><span className="sr-only">Actions</span></th>
            </tr></thead>
            <tbody className="divide-y divide-black/5">
              {rows.map((r) => (
                <tr key={`${r.userId}-${r.workDate}`}>
                  <td className="td whitespace-nowrap">{fmtShortDate(r.workDate)}</td>
                  <td className="td"><span className="font-bold">{r.fullName}</span><br /><span className="text-xs">{r.employeeId}</span></td>
                  <td className="td">{r.signInTime || '—'}</td>
                  <td className="td">{r.signOutTime || (r.missingSignOut ? 'Missing' : '—')}</td>
                  <td className="td"><DayBadges day={r} />{r.source === 'correction' && <p className="mt-1 text-xs">Edited by HR</p>}</td>
                  <td className="td text-right">
                    {r.dayStatus !== 'pending' && (
                      <button className="btn btn-secondary btn-sm" onClick={() => setCorrection({ userId: String(r.userId), workDate: r.workDate, signInTime: r.signInTime || '', signOutTime: r.signOutTime || '' })}>
                        {r.recorded ? 'Correct' : 'Add record'}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {rows.length === 0 && <tr><td className="td" colSpan={6}>No records in this range.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
      <p className="mt-3 text-xs">Every change is listed in the <Link to="/hr/audit" className="underline">audit log</Link>.</p>
      <Modal open={Boolean(correction)} onClose={() => setCorrection(null)} title="Correct attendance">
        {correction && <CorrectionForm employees={employees.filter((e) => e.isActive || String(e.id) === correction.userId)} initial={correction} onCancel={() => setCorrection(null)} onDone={() => { setCorrection(null); load(); }} />}
      </Modal>
    </>
  );
}

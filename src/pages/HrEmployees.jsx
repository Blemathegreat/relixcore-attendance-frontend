import { useCallback, useEffect, useState } from 'react';
import { api, qs } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { fmtDateTime } from '../lib/format.js';
import { Badge, Field, Modal, Notice, PageTitle, Spinner } from '../components/ui.jsx';

const EMPTY = { employeeId: '', fullName: '', email: '', phone: '', department: '', jobTitle: '', startDate: '' };

function EmployeeForm({ initial, editing, onSaved, onCancel }) {
  const [f, setF] = useState({ ...EMPTY, ...initial });
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try {
      const body = { fullName: f.fullName, email: f.email, phone: f.phone, department: f.department, jobTitle: f.jobTitle };
      if (f.startDate) body.startDate = f.startDate;
      const res = editing
        ? await api.patch(`/hr/employees/${initial.id}`, body)
        : await api.post('/hr/employees', { ...body, employeeId: f.employeeId });
      onSaved(res);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  return (
    <form onSubmit={submit} className="space-y-3">
      {error && <Notice tone="error">{error}</Notice>}
      <Field label="Employee ID" htmlFor="f-eid" hint={editing ? 'The ID is the login name and cannot be changed.' : 'Used to log in, e.g. RC-014.'}>
        <input id="f-eid" className="input" value={f.employeeId} onChange={set('employeeId')} disabled={editing} required />
      </Field>
      <Field label="Full name" htmlFor="f-name"><input id="f-name" className="input" value={f.fullName} onChange={set('fullName')} required /></Field>
      <div className="grid gap-3 sm:grid-cols-2">
        <Field label="Department" htmlFor="f-dep"><input id="f-dep" className="input" value={f.department || ''} onChange={set('department')} /></Field>
        <Field label="Job title" htmlFor="f-job"><input id="f-job" className="input" value={f.jobTitle || ''} onChange={set('jobTitle')} /></Field>
        <Field label="Email (optional)" htmlFor="f-mail"><input id="f-mail" type="email" className="input" value={f.email || ''} onChange={set('email')} /></Field>
        <Field label="Phone (optional)" htmlFor="f-tel"><input id="f-tel" type="tel" className="input" value={f.phone || ''} onChange={set('phone')} /></Field>
      </div>
      <Field label="Start date" htmlFor="f-start" hint="Days before this are never counted as absences. Leave blank for today.">
        <input id="f-start" type="date" className="input" value={f.startDate || ''} onChange={set('startDate')} />
      </Field>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" className="btn btn-secondary" onClick={onCancel}>Cancel</button>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : editing ? 'Save changes' : 'Create account'}</button>
      </div>
    </form>
  );
}

function CredentialsSlip({ employeeId, fullName, password, onClose }) {
  const [copied, setCopied] = useState(false);
  return (
    <div>
      <div className="rounded-xl border-2 border-dashed border-brand-teal p-4 print:border-solid" id="credentials-slip">
        <p className="text-sm">{fullName}</p>
        <p className="mt-2 text-xs">Employee ID</p>
        <p className="font-display text-2xl text-brand-teal">{employeeId}</p>
        <p className="mt-2 text-xs">One-time password</p>
        <p className="select-all font-display text-2xl tracking-wider text-brand-teal">{password}</p>
      </div>
      <Notice className="mt-3" tone="warn">
        This password is shown only once and is not stored in readable form. The employee must choose their own password when they first log in.
      </Notice>
      <div className="mt-4 flex flex-wrap justify-end gap-2">
        <button className="btn btn-secondary" onClick={async () => { await navigator.clipboard?.writeText(`Employee ID: ${employeeId}\nOne-time password: ${password}`); setCopied(true); }}>
          {copied ? 'Copied' : 'Copy'}
        </button>
        <button className="btn btn-primary" onClick={onClose}>I've shared it</button>
      </div>
    </div>
  );
}

export default function HrEmployees() {
  const { company } = useAuth();
  const [list, setList] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const [form, setForm] = useState(null); // {editing, initial}
  const [slip, setSlip] = useState(null);

  const load = useCallback(async () => {
    try { setList((await api.get(`/hr/employees${qs({ search, status })}`)).employees); setError(''); }
    catch (e) { setError(e.message); }
  }, [search, status]);
  useEffect(() => { const t = setTimeout(load, 200); return () => clearTimeout(t); }, [load]);

  async function toggle(emp) {
    const verb = emp.isActive ? 'Deactivate' : 'Reactivate';
    if (!window.confirm(`${verb} ${emp.fullName}? ${emp.isActive ? 'They will be logged out and unable to sign in.' : ''}`)) return;
    try { await api.patch(`/hr/employees/${emp.id}`, { isActive: !emp.isActive }); load(); } catch (e) { setError(e.message); }
  }
  async function reset(emp) {
    if (!window.confirm(`Reset the password for ${emp.fullName}? They will be logged out everywhere.`)) return;
    try {
      const r = await api.post(`/hr/employees/${emp.id}/reset-password`);
      setSlip({ employeeId: emp.employeeId, fullName: emp.fullName, password: r.temporaryPassword });
      load();
    } catch (e) { setError(e.message); }
  }

  return (
    <>
      <PageTitle action={<button className="btn btn-primary" onClick={() => setForm({ editing: false, initial: {} })}>Add employee</button>}>Employees</PageTitle>
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input max-w-xs" placeholder="Search name, ID or email" aria-label="Search employees" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input !w-auto" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option><option value="active">Active</option><option value="inactive">Deactivated</option>
        </select>
      </div>
      {error && <Notice tone="error" className="mb-4">{error}</Notice>}
      {!list ? <Spinner /> : (
        <div className="card overflow-x-auto !p-0">
          <table className="w-full">
            <thead className="border-b border-black/10"><tr>
              <th className="th">Employee</th><th className="th">Department</th><th className="th">Status</th><th className="th">Last login</th><th className="th"><span className="sr-only">Actions</span></th>
            </tr></thead>
            <tbody className="divide-y divide-black/5">
              {list.map((e) => (
                <tr key={e.id}>
                  <td className="td"><span className="font-bold">{e.fullName}</span><br /><span className="text-xs">{e.employeeId}{e.jobTitle ? ` · ${e.jobTitle}` : ''}</span></td>
                  <td className="td">{e.department || '—'}</td>
                  <td className="td">
                    <Badge kind={e.isActive ? 'on_time' : 'off'}>{e.isActive ? 'Active' : 'Deactivated'}</Badge>
                    {e.mustChangePassword && <span className="ml-1"><Badge kind="late">Awaiting first login</Badge></span>}
                  </td>
                  <td className="td">{e.lastLoginAt ? fmtDateTime(e.lastLoginAt, company.timezone) : 'Never'}</td>
                  <td className="td">
                    <div className="flex flex-wrap justify-end gap-2">
                      <button className="btn btn-secondary btn-sm" onClick={() => setForm({ editing: true, initial: e })}>Edit</button>
                      <button className="btn btn-secondary btn-sm" onClick={() => reset(e)}>Reset password</button>
                      <button className={`btn btn-sm ${e.isActive ? 'btn-danger' : 'btn-secondary'}`} onClick={() => toggle(e)}>{e.isActive ? 'Deactivate' : 'Reactivate'}</button>
                    </div>
                  </td>
                </tr>
              ))}
              {list.length === 0 && <tr><td className="td" colSpan={5}>No employees match. Use "Add employee" to create the first account.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={Boolean(form)} onClose={() => setForm(null)} title={form?.editing ? 'Edit employee' : 'Add employee'} wide>
        {form && (
          <EmployeeForm initial={form.initial} editing={form.editing} onCancel={() => setForm(null)}
            onSaved={(res) => {
              setForm(null); load();
              if (res.temporaryPassword) setSlip({ employeeId: res.employee.employeeId, fullName: res.employee.fullName, password: res.temporaryPassword });
            }} />
        )}
      </Modal>
      <Modal open={Boolean(slip)} onClose={() => setSlip(null)} title="Login details">
        {slip && <CredentialsSlip {...slip} onClose={() => setSlip(null)} />}
      </Modal>
    </>
  );
}

import { useCallback, useEffect, useState } from 'react';
import { api, qs } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { fmtDateTime } from '../lib/format.js';
import { ActionMenu } from '../components/ActionMenu.jsx';
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
      <div className="sheet-actions">
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
      <div className="rounded-xl border-2 border-dashed border-brand-teal p-4">
        <p className="text-sm">{fullName}</p>
        <p className="mt-2 text-xs">Employee ID</p>
        <p className="break-all font-display text-xl text-brand-teal sm:text-2xl">{employeeId}</p>
        <p className="mt-2 text-xs">One-time password</p>
        <p className="select-all break-all font-display text-xl text-brand-teal sm:text-2xl">{password}</p>
      </div>
      <Notice className="mt-3" tone="warn">
        Shown only once and not stored in readable form. The employee chooses their own password at first login.
      </Notice>
      <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
        <button
          className="btn btn-secondary w-full sm:w-auto"
          onClick={async () => {
            try { await navigator.clipboard.writeText(`Employee ID: ${employeeId}\nOne-time password: ${password}`); setCopied(true); } catch { setCopied(false); }
          }}
        >
          {copied ? 'Copied' : 'Copy details'}
        </button>
        <button className="btn btn-primary w-full sm:w-auto" onClick={onClose}>I've shared it</button>
      </div>
    </div>
  );
}

/** Edit button plus a three-dots menu for the rarer, riskier actions. */
function EmployeeActions({ emp, onEdit, onReset, onToggle, block = false }) {
  return (
    <div className="flex items-center gap-2">
      <button className={`btn btn-secondary btn-sm ${block ? 'flex-1' : ''}`} onClick={() => onEdit(emp)}>Edit</button>
      <ActionMenu
        label={`More actions for ${emp.fullName}`}
        triggerClassName="btn btn-secondary btn-sm !w-9 !px-0"
        items={[
          { label: 'Reset password', onSelect: () => onReset(emp) },
          { label: emp.isActive ? 'Deactivate' : 'Reactivate', danger: emp.isActive, onSelect: () => onToggle(emp) },
        ]}
      />
    </div>
  );
}

function StatusBadges({ emp }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Badge kind={emp.isActive ? 'on_time' : 'off'}>{emp.isActive ? 'Active' : 'Deactivated'}</Badge>
      {emp.mustChangePassword && <Badge kind="late">Awaiting first login</Badge>}
    </div>
  );
}

export default function HrEmployees() {
  const { company } = useAuth();
  const [list, setList] = useState(null);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('all');
  const [error, setError] = useState('');
  const [form, setForm] = useState(null);
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
  const edit = (emp) => setForm({ editing: true, initial: emp });
  const lastLogin = (e) => (e.lastLoginAt ? fmtDateTime(e.lastLoginAt, company.timezone) : 'Never');

  return (
    <>
      <PageTitle action={<button className="btn btn-primary" onClick={() => setForm({ editing: false, initial: {} })}>Add employee</button>}>Employees</PageTitle>
      <div className="mb-4 flex flex-wrap gap-3">
        <input className="input min-w-0 flex-1 sm:max-w-xs" placeholder="Search name, ID or email" aria-label="Search employees" value={search} onChange={(e) => setSearch(e.target.value)} />
        <select className="input !w-auto" aria-label="Status" value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option><option value="active">Active</option><option value="inactive">Deactivated</option>
        </select>
      </div>
      {error && <Notice tone="error" className="mb-4">{error}</Notice>}
      {!list ? <Spinner /> : (
        <>
          {/* Phones and small tablets: one card per person */}
          <ul className="grid gap-3 sm:grid-cols-2 md:hidden">
            {list.map((e) => (
              <li key={e.id} className="card !p-4">
                <p className="truncate font-bold">{e.fullName}</p>
                <p className="text-xs">{e.employeeId}{e.jobTitle ? ` · ${e.jobTitle}` : ''}</p>
                {e.department && <p className="mt-2 text-sm">{e.department}</p>}
                <div className="mt-2"><StatusBadges emp={e} /></div>
                <p className="mt-2 text-xs">Last login: {lastLogin(e)}</p>
                <div className="mt-3 flex">
                  <div className="flex-1"><EmployeeActions emp={e} onEdit={edit} onReset={reset} onToggle={toggle} block /></div>
                </div>
              </li>
            ))}
            {list.length === 0 && <li className="card text-sm">No employees match. Use "Add employee" to create the first account.</li>}
          </ul>

          {/* Tablets, foldables (inner screen) and laptops: table */}
          <div className="card hidden overflow-x-auto !p-0 md:block">
            <table className="w-full">
              <thead className="border-b border-black/10"><tr>
                <th className="th">Employee</th><th className="th">Department</th><th className="th">Status</th>
                <th className="th hidden lg:table-cell">Last login</th><th className="th"><span className="sr-only">Actions</span></th>
              </tr></thead>
              <tbody className="divide-y divide-black/5">
                {list.map((e) => (
                  <tr key={e.id}>
                    <td className="td"><span className="font-bold">{e.fullName}</span><br /><span className="text-xs">{e.employeeId}{e.jobTitle ? ` · ${e.jobTitle}` : ''}</span></td>
                    <td className="td">{e.department || '—'}</td>
                    <td className="td"><StatusBadges emp={e} /></td>
                    <td className="td hidden lg:table-cell">{lastLogin(e)}</td>
                    <td className="td"><div className="flex justify-end"><EmployeeActions emp={e} onEdit={edit} onReset={reset} onToggle={toggle} /></div></td>
                  </tr>
                ))}
                {list.length === 0 && <tr><td className="td" colSpan={5}>No employees match. Use "Add employee" to create the first account.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
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
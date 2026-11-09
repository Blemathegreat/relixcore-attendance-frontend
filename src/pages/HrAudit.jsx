import { useCallback, useEffect, useState } from 'react';
import { api, qs } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { ACTION_LABELS, fmtDateTime } from '../lib/format.js';
import { Notice, PageTitle, Spinner } from '../components/ui.jsx';

const PAGE = 50;

export default function HrAudit() {
  const { company } = useAuth();
  const [logs, setLogs] = useState(null);
  const [more, setMore] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async (offset = 0) => {
    try {
      const r = await api.get(`/hr/audit-logs${qs({ limit: PAGE, offset })}`);
      setLogs((prev) => (offset ? [...(prev || []), ...r.logs] : r.logs));
      setMore(r.logs.length === PAGE);
    } catch (e) { setError(e.message); }
  }, []);
  useEffect(() => { load(0); }, [load]);

  if (error) return <Notice tone="error">{error}</Notice>;
  if (!logs) return <Spinner />;
  return (
    <>
      <PageTitle>Audit log</PageTitle>
      <p className="mb-3 text-sm">A permanent record of corrections and administrative changes. Entries cannot be edited here.</p>
      <div className="card overflow-x-auto !p-0">
        <table className="w-full">
          <thead className="border-b border-black/10"><tr>
            <th className="th">When</th><th className="th">Action</th><th className="th">By</th><th className="th">Employee</th><th className="th">Reason and details</th>
          </tr></thead>
          <tbody className="divide-y divide-black/5 align-top">
            {logs.map((l) => (
              <tr key={l.id}>
                <td className="td whitespace-nowrap">{fmtDateTime(l.createdAt, company.timezone)}</td>
                <td className="td">{ACTION_LABELS[l.action] || l.action}</td>
                <td className="td">{l.actor.name}<br /><span className="text-xs">{l.actor.employeeId}</span></td>
                <td className="td">{l.target ? <>{l.target.name}<br /><span className="text-xs">{l.target.employeeId}</span></> : '—'}</td>
                <td className="td">
                  {l.reason && <p className="mb-1 font-bold">“{l.reason}”</p>}
                  {(l.oldValues || l.newValues) && (
                    <details>
                      <summary className="cursor-pointer text-xs underline">Before and after</summary>
                      <pre className="mt-1 max-w-md overflow-x-auto whitespace-pre-wrap rounded-lg bg-brand-platinum p-2 text-xs">
                        {JSON.stringify({ before: l.oldValues, after: l.newValues }, null, 2)}
                      </pre>
                    </details>
                  )}
                </td>
              </tr>
            ))}
            {logs.length === 0 && <tr><td className="td" colSpan={5}>Nothing recorded yet.</td></tr>}
          </tbody>
        </table>
      </div>
      {more && <button className="btn btn-secondary mt-4" onClick={() => load(logs.length)}>Load more</button>}
    </>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Field, Notice, PageTitle } from '../components/ui.jsx';

export default function ChangePassword() {
  const { user, changePassword } = useAuth();
  const navigate = useNavigate();
  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [again, setAgain] = useState('');
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const forced = user.mustChangePassword;

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (next !== again) { setError('The new passwords do not match.'); return; }
    setBusy(true);
    try {
      await changePassword(current, next);
      setDone(true);
      setTimeout(() => navigate(user.role === 'hr' ? '/hr' : '/', { replace: true }), 900);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md">
      <PageTitle>{forced ? 'Choose your own password' : 'Change password'}</PageTitle>
      <form onSubmit={submit} className="card space-y-4">
        {forced && <Notice tone="warn">You are using a one-time password from HR. Set a new one to continue.</Notice>}
        {error && <Notice tone="error">{error}</Notice>}
        {done && <Notice tone="success">Password changed. Taking you to your dashboard…</Notice>}
        <Field label={forced ? 'One-time password from HR' : 'Current password'} htmlFor="cur">
          <input id="cur" className="input" type="password" autoComplete="current-password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
        </Field>
        <Field label="New password" htmlFor="new" hint="At least 8 characters with a letter and a number. Do not include your employee ID.">
          <input id="new" className="input" type="password" autoComplete="new-password" value={next} onChange={(e) => setNext(e.target.value)} required />
        </Field>
        <Field label="Repeat new password" htmlFor="again">
          <input id="again" className="input" type="password" autoComplete="new-password" value={again} onChange={(e) => setAgain(e.target.value)} required />
        </Field>
        <button className="btn btn-primary w-full" disabled={busy || done || !current || !next || !again}>
          {busy ? 'Saving…' : 'Save new password'}
        </button>
        {!forced && <p className="text-xs">Changing your password logs you out on other devices.</p>}
      </form>
    </div>
  );
}

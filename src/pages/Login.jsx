import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { Logo } from '../components/Logo.jsx';
import { Field, Notice } from '../components/ui.jsx';

export default function Login() {
  const { user, login } = useAuth();
  const navigate = useNavigate();
  const [employeeId, setEmployeeId] = useState('');
  const [password, setPassword] = useState('');
  const [show, setShow] = useState(false);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={user.mustChangePassword ? '/change-password' : user.role === 'hr' ? '/hr' : '/'} replace />;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const u = await login(employeeId.trim(), password);
      navigate(u.mustChangePassword ? '/change-password' : u.role === 'hr' ? '/hr' : '/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen md:grid-cols-2">
      <div className="on-teal flex items-center justify-center bg-brand-teal px-6 py-10">
        <Logo light className="h-40 w-auto md:h-80" />
      </div>
      <div className="flex items-center justify-center px-5 py-10">
        <form onSubmit={submit} className="card w-full max-w-sm space-y-4" noValidate>
          <h1 className="text-2xl">Log in to mark attendance</h1>
          {error && <Notice tone="error">{error}</Notice>}
          <Field label="Employee ID" htmlFor="eid">
            <input id="eid" className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}
              autoComplete="username" autoCapitalize="characters" required />
          </Field>
          <Field label="Password" htmlFor="pw">
            <div className="flex gap-2">
              <input id="pw" className="input" type={show ? 'text' : 'password'} value={password}
                onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
              <button type="button" className="btn btn-secondary btn-sm" onClick={() => setShow((s) => !s)}>
                {show ? 'Hide' : 'Show'}
              </button>
            </div>
          </Field>
          <button className="btn btn-primary w-full" disabled={busy || !employeeId || !password}>
            {busy ? 'Logging in…' : 'Log in'}
          </button>
          <p className="text-xs">No account yet? HR creates accounts. Ask them for your Employee ID and one-time password.</p>
        </form>
      </div>
    </div>
  );
}

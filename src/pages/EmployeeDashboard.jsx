import { useCallback, useEffect, useRef, useState } from 'react';
import { api, qs } from '../lib/api.js';
import { useAuth } from '../lib/auth.jsx';
import { getFreshPosition, newRequestId, LocationError } from '../lib/geolocation.js';
import { fmtShortDate, fmtMonth, fmtMinutes, monthOf, todayIn } from '../lib/format.js';
import { AttendanceToggle } from '../components/AttendanceToggle.jsx';
import { Badge, DayBadges, Notice, Spinner } from '../components/ui.jsx';

const STATE_TEXT = {
  not_signed_in: 'Not signed in',
  signed_in: "You're signed in",
  completed: "You're done for today",
};

export default function EmployeeDashboard() {
  const { user, company } = useAuth();
  const [today, setToday] = useState(null);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(null); // 'locating' | 'sending' | null
  const [outcome, setOutcome] = useState(null);
  const pendingIds = useRef({ 'sign-in': null, 'sign-out': null });

  const [month, setMonth] = useState(() => monthOf(todayIn(company.timezone)));
  const [history, setHistory] = useState(null);

  const loadToday = useCallback(async () => {
    try { setToday(await api.get('/me/attendance/today')); setLoadError(''); }
    catch (e) { setLoadError(e.message); }
  }, []);
  const loadHistory = useCallback(async () => {
    try { setHistory(await api.get(`/me/attendance${qs({ month })}`)); } catch { setHistory({ days: [], totals: null }); }
  }, [month]);

  useEffect(() => { loadToday(); }, [loadToday]);
  useEffect(() => { loadHistory(); }, [loadHistory]);

  async function mark(kind) {
    setOutcome(null);
    setBusy('locating');
    let pos;
    try {
      pos = await getFreshPosition();
    } catch (e) {
      setBusy(null);
      setOutcome({ tone: 'error', title: 'Location needed', message: e instanceof LocationError ? e.message : 'We could not get your location.' });
      return;
    }
    setBusy('sending');
    // Same ID on a network retry so a repeated request can never double-record.
    const requestId = pendingIds.current[kind] || newRequestId();
    pendingIds.current[kind] = requestId;
    try {
      const res = await api.post(`/me/attendance/${kind}`, { ...pos, requestId });
      pendingIds.current[kind] = null;
      setOutcome({ tone: 'success', title: kind === 'sign-in' ? 'Signed in' : 'Signed out', message: res.message, extra: `You were about ${res.distanceM} m from the office.` });
    } catch (e) {
      if (e.code !== 'NETWORK') pendingIds.current[kind] = null;
      const d = e.details || {};
           const where = `Your phone reported ${pos.latitude.toFixed(5)}, ${pos.longitude.toFixed(5)} (accurate to about ${Math.round(pos.accuracy)} m).`;
      const extra = e.code === 'OUTSIDE_GEOFENCE' ? `Distance now: about ${d.distanceM} m. Allowed: ${d.radiusM} m. ${where}` : undefined;
      setOutcome({
        tone: 'error',
        title: e.code === 'NETWORK' ? 'Not confirmed' : "Attendance wasn't recorded",
        message: e.code === 'NETWORK' ? `${e.message} Tap again to retry; it won't be recorded twice.` : e.message,
        extra,
      });
    } finally {
      setBusy(null);
      loadToday();
      loadHistory();
    }
  }

  if (!today) return loadError ? <Notice tone="error">{loadError}</Notice> : <Spinner />;
  const rec = today.record;
  const p = today.policy;

  return (
    <div className="mx-auto max-w-md space-y-4">
      <section className="card">
        <div className="flex items-center gap-5">
          <AttendanceToggle state={today.state} />
          <div className="min-w-0">
            <p className="text-sm">Hello, {user.fullName.split(' ')[0]}</p>
            <h1 className="text-2xl leading-tight">{STATE_TEXT[today.state]}</h1>
            {rec && (
              <p className="mt-2 text-sm">
                In {rec.signInTime}{rec.signOutTime ? ` · Out ${rec.signOutTime}` : ''}
              </p>
            )}
            {rec && (
              <div className="mt-2">
                {rec.punctuality === 'late' ? <Badge kind="late">Late {rec.lateMinutes}m</Badge> : <Badge kind="on_time" />}
              </div>
            )}
          </div>
        </div>

        {!today.isWorkingDay && (
          <Notice className="mt-4" tone="info">
            {today.nonWorkingReason === 'holiday' ? `Today is a holiday (${today.holidayName}).` : "Today isn't a working day."} Attendance isn't recorded.
          </Notice>
        )}
        {!p.officeConfigured && <Notice className="mt-4" tone="warn">HR hasn't set the office location yet, so attendance can't be marked.</Notice>}
        {today.previousOpenSession && (
          <Notice className="mt-4" tone="warn" title="A sign-out is missing">
            Your sign-in on {fmtShortDate(today.previousOpenSession)} has no sign-out. Ask HR to correct it.
          </Notice>
        )}

        <div className="mt-5 grid gap-3">
          <button className="btn btn-primary h-14 text-lg" disabled={!today.canSignIn || !p.officeConfigured || busy} onClick={() => mark('sign-in')}>
            {busy && today.canSignIn ? (busy === 'locating' ? 'Finding your location…' : 'Signing in…') : 'Sign in'}
          </button>
          <button className="btn btn-secondary h-14 text-lg" disabled={!today.canSignOut || busy} onClick={() => mark('sign-out')}>
            {busy && today.canSignOut ? (busy === 'locating' ? 'Finding your location…' : 'Signing out…') : 'Sign out'}
          </button>
        </div>

        {outcome && (
          <Notice className="mt-4" tone={outcome.tone} title={outcome.title}>
            <p>{outcome.message}</p>
            {outcome.extra && <p className="mt-1 text-xs">{outcome.extra}</p>}
          </Notice>
        )}

        <p className="mt-4 text-xs">
          Work starts {p.resumeTime} ({p.graceMinutes} min grace) and ends {p.closeTime}. You must be within {p.geofenceRadiusM} m of the
          office. Allow location when your phone asks.
        </p>
      </section>

      <section className="card">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-xl">My attendance</h2>
          <input type="month" aria-label="Month" className="input !w-auto" value={month} max={monthOf(todayIn(company.timezone))} onChange={(e) => e.target.value && setMonth(e.target.value)} />
        </div>
        {!history ? <Spinner /> : (
          <>
            {history.totals && (
              <p className="mb-3 text-sm">
                {fmtMonth(month)}: {history.totals.presentDays} present · {history.totals.lateDays} late · {history.totals.absentDays} potential absences
              </p>
            )}
            <ul className="divide-y divide-black/5">
              {history.days
                .filter((d) => !['future', 'not_employed'].includes(d.dayStatus) && !(d.dayStatus === 'non_working' && !d.recorded))
                .reverse()
                .map((d) => (
                  <li key={d.workDate} className="flex flex-wrap items-center justify-between gap-2 py-2.5">
                    <div>
                      <p className="text-sm font-bold">{fmtShortDate(d.workDate)}</p>
                      <p className="text-xs">
                        {d.signInTime ? `In ${d.signInTime}` : 'No sign-in'}
                        {d.signOutTime ? ` · Out ${d.signOutTime}` : d.signInTime ? ' · No sign-out' : ''}
                        {d.workedMinutes != null ? ` · ${fmtMinutes(d.workedMinutes)}` : ''}
                      </p>
                    </div>
                    <DayBadges day={d} />
                  </li>
                ))}
            </ul>
            {history.days.every((d) => !d.recorded && d.dayStatus !== 'absent') && <p className="py-3 text-sm">No attendance this month yet.</p>}
          </>
        )}
      </section>
    </div>
  );
}

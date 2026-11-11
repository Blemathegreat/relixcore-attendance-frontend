import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import { getBestPosition } from '../lib/geolocation.js';
import { fmtDate, WEEKDAY_OPTIONS } from '../lib/format.js';
import { Field, Notice, PageTitle, Spinner } from '../components/ui.jsx';

function Holidays() {
  const [list, setList] = useState(null);
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');
  const load = () => api.get('/hr/holidays').then((r) => setList(r.holidays)).catch((e) => setError(e.message));
  useEffect(() => { load(); }, []);

  async function add(e) {
    e.preventDefault(); setError('');
    try { await api.post('/hr/holidays', { date, description }); setDate(''); setDescription(''); load(); }
    catch (err) { setError(err.message); }
  }
  async function remove(h) {
    if (!window.confirm(`Remove ${h.description} (${fmtDate(h.date)})?`)) return;
    try { await api.del(`/hr/holidays/${h.id}`); load(); } catch (err) { setError(err.message); }
  }
  return (
    <section className="card">
      <h2 className="mb-1 text-xl">Non-working days</h2>
      <p className="mb-3 text-sm">Public holidays and closures. These days are never counted as absences.</p>
      {error && <Notice tone="error" className="mb-3">{error}</Notice>}
      <form onSubmit={add} className="mb-4 grid gap-3 sm:grid-cols-[10rem_1fr_auto] sm:items-end">
        <Field label="Date" htmlFor="h-d"><input id="h-d" type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} required /></Field>
        <Field label="Description" htmlFor="h-t"><input id="h-t" className="input" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={160} required /></Field>
        <button className="btn btn-primary">Add</button>
      </form>
      {!list ? <Spinner /> : (
        <ul className="divide-y divide-black/5">
          {list.map((h) => (
            <li key={h.id} className="flex items-center justify-between gap-3 py-2 text-sm">
              <span><span className="font-bold">{fmtDate(h.date)}</span> · {h.description}</span>
              <button className="btn btn-secondary btn-sm" onClick={() => remove(h)}>Remove</button>
            </li>
          ))}
          {list.length === 0 && <li className="py-2 text-sm">No holidays configured.</li>}
        </ul>
      )}
    </section>
  );
}

export default function HrSettings() {
  const [f, setF] = useState(null);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [locNote, setLocNote] = useState('');

  useEffect(() => {
    api.get('/hr/settings').then(({ settings: s }) => setF({
      officeLatitude: s.officeLatitude ?? '', officeLongitude: s.officeLongitude ?? '',
      geofenceRadiusM: s.geofenceRadiusM, maxAccuracyM: s.maxAccuracyM,
      resumeTime: s.resumeTime.slice(0, 5), closeTime: s.closeTime.slice(0, 5),
      graceMinutes: s.graceMinutes, workingDays: s.workingDays, timezone: s.timezone,
    })).catch((e) => setError(e.message));
  }, []);

  if (!f) return error ? <Notice tone="error">{error}</Notice> : <Spinner />;
  const set = (k) => (e) => { setSaved(false); setF((s) => ({ ...s, [k]: e.target.value })); };

   async function useHere() {
    setLocNote('Listening for GPS for a few seconds. Stay still…');
    try {
      const p = await getBestPosition(8000);
      if (p.accuracy > 30) {
        setLocNote(`Not used: the best reading is only accurate to about ${Math.round(p.accuracy)} m. Go outdoors with a clear sky, make sure Location is on with high accuracy, wait, and press the button again. Or pick the office from the satellite map instead.`);
        return;
      }
      setF((s) => ({ ...s, officeLatitude: Number(p.latitude.toFixed(6)), officeLongitude: Number(p.longitude.toFixed(6)) }));
      const wander = p.spreadM > 200 ? ` The readings moved about ${Math.round(p.spreadM)} m while listening, so double-check the point on the map.` : '';
      setLocNote(`Filled from the best of ${p.readings} readings (accurate to about ${Math.round(p.accuracy)} m). Not saved yet: press "Save settings" at the bottom.${wander}`);
      setSaved(false);
    } catch (e) { setLocNote(e.message); }
  }

  async function submit(e) {
    e.preventDefault(); setBusy(true); setError(''); setSaved(false);
    try {
      await api.put('/hr/settings', {
        officeLatitude: Number(f.officeLatitude), officeLongitude: Number(f.officeLongitude),
        geofenceRadiusM: Number(f.geofenceRadiusM), maxAccuracyM: Number(f.maxAccuracyM),
        resumeTime: f.resumeTime, closeTime: f.closeTime, graceMinutes: Number(f.graceMinutes),
        workingDays: f.workingDays, timezone: f.timezone.trim(),
      });
      setSaved(true);
    } catch (err) { setError(err.message); } finally { setBusy(false); }
  }
  const toggleDay = (d) => { setSaved(false); setF((s) => ({ ...s, workingDays: s.workingDays.includes(d) ? s.workingDays.filter((x) => x !== d) : [...s.workingDays, d] })); };

  return (
    <div className="space-y-5">
      <PageTitle>Settings</PageTitle>
      <form onSubmit={submit} className="space-y-5">
        {error && <Notice tone="error">{error}</Notice>}
        {saved && <Notice tone="success">Settings saved. They apply to new attendance from now on.</Notice>}

        <section className="card space-y-4">
          <h2 className="text-xl">Office location</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Latitude" htmlFor="lat"><input id="lat" className="input" inputMode="decimal" value={f.officeLatitude} onChange={set('officeLatitude')} required /></Field>
            <Field label="Longitude" htmlFor="lng"><input id="lng" className="input" inputMode="decimal" value={f.officeLongitude} onChange={set('officeLongitude')} required /></Field>
          </div>
          <div>
            <button type="button" className="btn btn-secondary btn-sm" onClick={useHere}>Use my current location</button>
            {locNote && <p className="mt-2 text-xs">{locNote}</p>}
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Allowed distance (metres)" htmlFor="rad" hint="Default 50. Employees must be this close to sign in or out."><input id="rad" type="number" min="10" max="5000" className="input" value={f.geofenceRadiusM} onChange={set('geofenceRadiusM')} required /></Field>
            <Field label="Worst GPS accuracy accepted (metres)" htmlFor="acc" hint="Readings less accurate than this are rejected. Raise only if staff are blocked indoors."><input id="acc" type="number" min="5" max="500" className="input" value={f.maxAccuracyM} onChange={set('maxAccuracyM')} required /></Field>
          </div>
        </section>

        <section className="card space-y-4">
          <h2 className="text-xl">Working hours</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <Field label="Resumption time" htmlFor="rt"><input id="rt" type="time" className="input" value={f.resumeTime} onChange={set('resumeTime')} required /></Field>
            <Field label="Closing time" htmlFor="ct" hint="Absences are only flagged after this time."><input id="ct" type="time" className="input" value={f.closeTime} onChange={set('closeTime')} required /></Field>
            <Field label="Grace period (minutes)" htmlFor="gr" hint="Arriving up to this long after resumption is still on time."><input id="gr" type="number" min="0" max="120" className="input" value={f.graceMinutes} onChange={set('graceMinutes')} required /></Field>
          </div>
          <fieldset>
            <legend className="label">Working days</legend>
            <div className="flex flex-wrap gap-2">
              {WEEKDAY_OPTIONS.map((d) => (
                <label key={d.value} className={`flex min-h-[44px] cursor-pointer items-center gap-2 rounded-full border-2 px-4 text-sm font-bold ${f.workingDays.includes(d.value) ? 'border-brand-teal bg-brand-teal text-brand-platinum' : 'border-brand-teal/30 bg-white'}`}>
                  <input type="checkbox" className="sr-only" checked={f.workingDays.includes(d.value)} onChange={() => toggleDay(d.value)} />
                  {d.label}
                </label>
              ))}
            </div>
          </fieldset>
          <Field label="Timezone" htmlFor="tz" hint="Default Africa/Lagos."><input id="tz" className="input max-w-xs" value={f.timezone} onChange={set('timezone')} required /></Field>
        </section>

        <Notice tone="warn" title="About location checks">
          Phone GPS can be off by tens of metres, especially indoors, and a determined person can fake a location. The server checks every attempt,
          but a location match is an aid for HR, not proof that someone was physically present.
        </Notice>
        <button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : 'Save settings'}</button>
      </form>
      <Holidays />
    </div>
  );
}

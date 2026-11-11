export class LocationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function explain(err) {
  if (err.code === 1) return new LocationError('DENIED', 'Location access is blocked. Allow location for this site in your browser settings, then try again.');
  if (err.code === 3) return new LocationError('TIMEOUT', 'Finding your location took too long. Make sure Location is on, then try again.');
  return new LocationError('UNAVAILABLE', "Your phone couldn't work out where you are. Turn on Location (GPS), move near a window, and try again.");
}

function checkSupport() {
  if (!('geolocation' in navigator)) {
    return new LocationError('UNSUPPORTED', "This browser can't share its location. Try Chrome or Safari on your phone.");
  }
  if (!window.isSecureContext) {
    return new LocationError('INSECURE', 'Location only works on a secure (HTTPS) connection. Ask IT to open the app using its https:// address.');
  }
  return null;
}

const reading = (pos) => ({
  latitude: pos.coords.latitude,
  longitude: pos.coords.longitude,
  accuracy: pos.coords.accuracy,
  positionTimestamp: pos.timestamp,
});

/** One fresh reading (maximumAge: 0). Kept for simple cases. */
export function getFreshPosition() {
  return new Promise((resolve, reject) => {
    const problem = checkSupport();
    if (problem) { reject(problem); return; }
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve(reading(pos)),
      (err) => reject(explain(err)),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  });
}

/**
 * Phones often return a rough first position (Wi-Fi or mobile tower) and only later a real GPS fix.
 * This listens for a few seconds and returns the MOST ACCURATE reading it saw, plus how many
 * readings it collected and how far apart they were (spreadM), so rough fixes can be rejected.
 * It stops early as soon as a reading is accurate to goodEnoughM metres or better.
 */
export function getBestPosition(durationMs = 8000, goodEnoughM = 15) {
  return new Promise((resolve, reject) => {
    const problem = checkSupport();
    if (problem) { reject(problem); return; }
    let best = null;
    let count = 0;
    let minLat = Infinity; let maxLat = -Infinity; let minLng = Infinity; let maxLng = -Infinity;
    let finished = false;
    let watchId = null;
    let timer = null;

    const finish = (err) => {
      if (finished) return;
      finished = true;
      navigator.geolocation.clearWatch(watchId);
      clearTimeout(timer);
      if (best) {
        const midLat = (minLat + maxLat) / 2;
        const spreadM = Math.max(
          (maxLat - minLat) * 111195,
          (maxLng - minLng) * 111195 * Math.cos((midLat * Math.PI) / 180),
        );
        resolve({ ...best, readings: count, spreadM });
      } else {
        reject(err || explain({ code: 2 }));
      }
    };

    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        const r = reading(pos);
        count += 1;
        minLat = Math.min(minLat, r.latitude); maxLat = Math.max(maxLat, r.latitude);
        minLng = Math.min(minLng, r.longitude); maxLng = Math.max(maxLng, r.longitude);
        if (!best || r.accuracy < best.accuracy) best = r;
        if (r.accuracy <= goodEnoughM) finish();
      },
      (err) => { if (!best) finish(explain(err)); },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
    timer = setTimeout(() => finish(), durationMs);
  });
}

export function newRequestId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `r-${Date.now()}-${Math.random().toString(16).slice(2, 12)}`;
}
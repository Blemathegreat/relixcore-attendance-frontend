export class LocationError extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

/**
 * Always asks the device for a NEW reading (maximumAge: 0). The server re-checks
 * everything; this only gathers the coordinates and explains failures kindly.
 */
export function getFreshPosition() {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject(new LocationError('UNSUPPORTED', "This browser can't share its location. Try Chrome or Safari on your phone."));
      return;
    }
    if (!window.isSecureContext) {
      reject(new LocationError('INSECURE', 'Location only works on a secure (HTTPS) connection. Ask IT to open the app using its https:// address.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        resolve({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          positionTimestamp: pos.timestamp,
        }),
      (err) => {
        if (err.code === 1) {
          reject(new LocationError('DENIED', 'Location access is blocked. Allow location for this site in your browser settings, then try again.'));
        } else if (err.code === 3) {
          reject(new LocationError('TIMEOUT', 'Finding your location took too long. Make sure Location is on, then try again.'));
        } else {
          reject(new LocationError('UNAVAILABLE', "Your phone couldn't work out where you are. Turn on Location (GPS), move near a window, and try again."));
        }
      },
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 0 },
    );
  });
}

export function newRequestId() {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `r-${Date.now()}-${Math.random().toString(16).slice(2, 12)}`;
}

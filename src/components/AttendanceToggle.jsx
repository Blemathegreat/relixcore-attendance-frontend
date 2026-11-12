import { useEffect, useRef, useState } from 'react';

/**
 * The RelixCore mark as the attendance status light.
 *   Not signed in / finished for the day: the inner circle is dark (brand Dark Grey).
 *   Signed in: the circle fades up to the logo's red, with one soft ring that expands and fades.
 * The ring is a still image (logo-ring.png, 1215 x 884); the circle is drawn on top at the
 * logo's own coordinates.
 */
const DOT = { cx: 776.5, cy: 437.5, r: 195.5 };
const OFF = '#4a494a'; // brand Dark Grey
const ON = '#E52029'; // the logo's red

export function AttendanceToggle({ state, className = 'h-28 w-auto shrink-0' }) {
  const on = state === 'signed_in';
  const label = { not_signed_in: 'Not signed in', signed_in: 'Signed in', completed: 'Signed out for the day' }[state];

  // Play the ring only when the state CHANGES to signed in, not when the page loads already signed in.
  const previous = useRef(state);
  const [pulse, setPulse] = useState(0);
  useEffect(() => {
    if (previous.current !== 'signed_in' && state === 'signed_in') setPulse((p) => p + 1);
    previous.current = state;
  }, [state]);

  return (
    <svg viewBox="0 0 1215 884" className={className} role="img" aria-label={label}>
      <image href="/logo-ring.png" x="0" y="0" width="1215" height="884" />
      {pulse > 0 && (
        <circle key={pulse} className="logo-pulse" cx={DOT.cx} cy={DOT.cy} r={DOT.r} fill="none" stroke={ON} strokeWidth="14" />
      )}
      <circle
        cx={DOT.cx}
        cy={DOT.cy}
        r={DOT.r}
        style={{ fill: on ? ON : OFF, transition: 'fill 700ms cubic-bezier(.4, 0, .2, 1)' }}
        className="motion-reduce:!transition-none"
      />
    </svg>
  );
}
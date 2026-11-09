/**
 * The RelixCore mark used as the status control. The ring is a still image; the red
 * dot is drawn on top and slides inside it:
 *   dot at the bottom = not signed in / finished, dot at the top = signed in.
 * Coordinates are in the logo's own units (logo-ring.png is 1215 x 884).
 */
const DOT = { cx: 776.5, cy: 437.5, r: 195.5 };
const TRAVEL = 104; // ring inner radius (310) - dot radius (195.5) - a small margin

export function AttendanceToggle({ state, className = 'h-28 w-auto shrink-0' }) {
  const up = state === 'signed_in';
  const label = { not_signed_in: 'Not signed in', signed_in: 'Signed in', completed: 'Signed out for the day' }[state];
  return (
    <svg viewBox="0 0 1215 884" className={className} role="img" aria-label={label}>
      <image href="/logo-ring.png" x="0" y="0" width="1215" height="884" />
      <circle
        cx={DOT.cx}
        cy={DOT.cy}
        r={DOT.r}
        fill="#E52029"
        style={{
          transform: `translateY(${up ? -TRAVEL : TRAVEL}px)`,
          transition: 'transform 600ms cubic-bezier(.2,.8,.2,1)',
        }}
        className="motion-reduce:!transition-none"
      />
    </svg>
  );
}

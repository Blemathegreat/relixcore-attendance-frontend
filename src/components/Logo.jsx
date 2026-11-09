// RelixCore logo files live in /public. Use:
//   variant="full"  logo with the RELIX CORE wordmark
//   variant="mark"  the ring-and-dot symbol only (headers, favicon)
//   light           platinum version for dark (teal) backgrounds
export function Logo({ variant = 'full', light = false, className = '', alt = 'RelixCore' }) {
  const file = `/logo-${variant}${light ? '-light' : ''}.png`;
  return <img src={file} alt={alt} className={className} />;
}

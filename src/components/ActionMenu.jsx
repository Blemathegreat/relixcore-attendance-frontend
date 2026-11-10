import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';


function DotsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
      <circle cx="12" cy="5" r="2" />
      <circle cx="12" cy="12" r="2" />
      <circle cx="12" cy="19" r="2" />
    </svg>
  );
}

export function ActionMenu({ label, items, header = null, triggerClassName = '' }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState(null);
  const wrap = useRef(null);
  const button = useRef(null);
  const menu = useRef(null);
  const id = useId();

  // Place the menu under the button (or above it when there is no room), kept inside the screen.
  useLayoutEffect(() => {
    if (!open || !button.current || !menu.current) return;
    const r = button.current.getBoundingClientRect();
    const h = menu.current.offsetHeight;
    const w = menu.current.offsetWidth;
    const roomBelow = window.innerHeight - r.bottom;
    const top = roomBelow >= h + 8 || r.top < h + 8 ? r.bottom + 4 : r.top - h - 4;
    const left = Math.min(Math.max(8, r.right - w), window.innerWidth - w - 8);
    setPos({ top, left });
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const close = () => { setOpen(false); setPos(null); };
    const onDown = (e) => { if (wrap.current && !wrap.current.contains(e.target)) close(); };
    const onKey = (e) => {
      if (e.key === 'Escape') { close(); button.current?.focus(); }
    };
    document.addEventListener('pointerdown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('pointerdown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [open]);

  return (
    <div ref={wrap} className="relative shrink-0">
      <button
        ref={button}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onClick={() => { setOpen((o) => !o); setPos(null); }}
        className={triggerClassName}
      >
        <DotsIcon />
      </button>
      {open && (
        <div
          ref={menu}
          id={id}
          role="menu"
          style={pos ? { top: pos.top, left: pos.left } : { top: 0, left: 0, visibility: 'hidden' }}
          className="fixed z-50 w-56 rounded-xl border border-black/10 bg-white p-1 text-brand-ink shadow-lg"
        >
          {header}
          {items.map((item) => (
            <button
              key={item.label}
              type="button"
              role="menuitem"
              onClick={() => { setOpen(false); setPos(null); item.onSelect(); }}
              className="flex min-h-[44px] w-full items-center gap-3 rounded-lg px-3 text-left text-sm font-bold hover:bg-brand-platinum"
            >
              {item.danger && <span className="h-2 w-2 shrink-0 rounded-full bg-brand-red" aria-hidden="true" />}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
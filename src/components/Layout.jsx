import { useEffect, useRef } from 'react';
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
import { ActionMenu } from './ActionMenu.jsx';
import { Logo } from './Logo.jsx';

const HR_NAV = [
  { to: '/hr', label: 'Today', end: true },
  { to: '/hr/employees', label: 'Employees' },
  { to: '/hr/records', label: 'Records' },
  { to: '/hr/reports', label: 'Reports' },
  { to: '/hr/settings', label: 'Settings' },
  { to: '/hr/audit', label: 'Audit log' },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const navRef = useRef(null);
  const isHr = user.role === 'hr';

  // Keep the active tab visible when the tab row scrolls sideways on a small screen.
  useEffect(() => {
    navRef.current?.querySelector('[aria-current="page"]')?.scrollIntoView({ inline: 'center', block: 'nearest' });
  }, [location.pathname]);

   const goPassword = () => navigate('/change-password');
  const logoutNow = async () => { await logout(); navigate('/login'); };
  const items = [
    { label: 'Change password', onSelect: goPassword },
    { label: 'Log out', onSelect: logoutNow },
  ];

  return (
    <div className="min-h-screen">
      <header className="on-teal bg-brand-teal text-brand-platinum print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <Logo variant="mark" light className="h-9 w-auto shrink-0" alt="" />
            <div className="min-w-0 leading-tight">
              <p className="font-display text-lg text-brand-platinum">RelixCore</p>
              <p className="text-xs">Attendance</p>
            </div>
          </div>
                  {/* Laptops and tablets (768 px and wider): visible buttons */}
          <div className="hidden items-center gap-1 md:flex">
            <div className="mr-3 text-right leading-tight">
              <p className="text-sm font-bold">{user.fullName}</p>
              <p className="text-xs">{isHr ? 'HR' : 'Employee'}</p>
            </div>
            <button className="btn btn-ghost btn-sm" onClick={goPassword}>Password</button>
            <button className="btn btn-ghost btn-sm" onClick={logoutNow}>Log out</button>
          </div>
          {/* Phones: one three-dots menu */}
          <div className="md:hidden">
            <ActionMenu
              label="Account menu"
              items={items}
              triggerClassName="flex h-11 w-11 items-center justify-center rounded-full text-brand-platinum hover:bg-white/10"
              header={
                <div className="mb-1 border-b border-black/10 px-3 pb-2 pt-1.5">
                  <p className="truncate text-sm font-bold">{user.fullName}</p>
                  <p className="text-xs">{isHr ? 'HR' : 'Employee'} · {user.employeeId}</p>
                </div>
              }
            />
          </div>
        </div>
        {isHr && (
          <nav ref={navRef} aria-label="HR sections" className="mx-auto max-w-6xl overflow-x-auto px-3">
            <ul className="flex gap-1 pb-2">
              {HR_NAV.map((n) => (
                <li key={n.to}>
                  <NavLink
                    to={n.to}
                    end={n.end}
                    className={({ isActive }) =>
                      `block whitespace-nowrap rounded-full px-4 py-2 text-sm font-bold ${isActive ? 'bg-brand-platinum text-brand-teal' : 'text-brand-platinum hover:bg-white/10'}`
                    }
                  >
                    {n.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6 print:max-w-none print:p-0">
        <Outlet />
      </main>
    </div>
  );
}
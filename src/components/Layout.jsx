import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth.jsx';
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
  const isHr = user.role === 'hr';
  return (
    <div className="min-h-screen">
      <header className="on-teal bg-brand-teal text-brand-platinum print:hidden">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <Logo variant="mark" light className="h-9 w-auto" alt="" />
            <div className="leading-tight">
              <p className="font-display text-lg text-brand-platinum">RelixCore</p>
              <p className="text-xs">Attendance</p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <span className="mr-2 hidden text-sm sm:inline">{user.fullName}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => navigate('/change-password')}>Password</button>
            <button className="btn btn-ghost btn-sm" onClick={async () => { await logout(); navigate('/login'); }}>Log out</button>
          </div>
        </div>
        {isHr && (
          <nav aria-label="HR sections" className="mx-auto max-w-6xl overflow-x-auto px-3">
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

import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth.jsx';
import { Layout } from './components/Layout.jsx';
import { Spinner } from './components/ui.jsx';
import Login from './pages/Login.jsx';
import ChangePassword from './pages/ChangePassword.jsx';
import EmployeeDashboard from './pages/EmployeeDashboard.jsx';
import HrDashboard from './pages/HrDashboard.jsx';
import HrEmployees from './pages/HrEmployees.jsx';
import HrRecords from './pages/HrRecords.jsx';
import HrReports from './pages/HrReports.jsx';
import HrSettings from './pages/HrSettings.jsx';
import HrAudit from './pages/HrAudit.jsx';

const home = (u) => (u.role === 'hr' ? '/hr' : '/');

/** UI-level guard only. The server enforces every permission independently. */
function Protected({ role, children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  if (user.mustChangePassword) return <Navigate to="/change-password" replace />;
  if (role && user.role !== role) return <Navigate to={home(user)} replace />;
  return children;
}

function AuthedOnly({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<AuthedOnly><Layout /></AuthedOnly>}>
        <Route path="/change-password" element={<ChangePassword />} />
      </Route>
      <Route element={<Protected role="employee"><Layout /></Protected>}>
        <Route path="/" element={<EmployeeDashboard />} />
      </Route>
      <Route element={<Protected role="hr"><Layout /></Protected>}>
        <Route path="/hr" element={<HrDashboard />} />
        <Route path="/hr/employees" element={<HrEmployees />} />
        <Route path="/hr/records" element={<HrRecords />} />
        <Route path="/hr/reports" element={<HrReports />} />
        <Route path="/hr/settings" element={<HrSettings />} />
        <Route path="/hr/audit" element={<HrAudit />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

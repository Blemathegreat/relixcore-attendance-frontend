import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api, onUnauthorized } from './api.js';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState({ name: 'RelixCore', timezone: 'Africa/Lagos' });
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const data = await api.get('/auth/me');
      setUser(data.user);
      setCompany(data.company);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    onUnauthorized(() => setUser(null));
    refresh();
  }, [refresh]);

  const value = useMemo(
    () => ({
      user, company, loading, refresh,
      async login(employeeId, password) {
        const data = await api.post('/auth/login', { employeeId, password });
        setUser(data.user);
        refresh();
        return data.user;
      },
      async logout() {
        try { await api.post('/auth/logout'); } finally { setUser(null); }
      },
      async changePassword(currentPassword, newPassword) {
        const data = await api.post('/auth/change-password', { currentPassword, newPassword });
        setUser(data.user);
      },
    }),
    [user, company, loading, refresh],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

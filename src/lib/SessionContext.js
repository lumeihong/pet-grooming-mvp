import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { api, API_MODE } from './api';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);

  const signIn = useCallback(async (phone, role) => {
    const safeRole = role === 'groomer' ? 'groomer' : role === 'admin' ? 'admin' : 'client';
    const defaultPhone =
      safeRole === 'groomer' ? '+6588888888' : safeRole === 'admin' ? '+6500000000' : '+6599999999';

    if (safeRole === 'admin') {
      const next = { id: 'u_admin_demo', phone: defaultPhone, role: 'admin', name: 'Admin' };
      setSession(next);
      return next;
    }

    const { user } = await api.signIn(phone || defaultPhone, safeRole);
    const next = {
      id: user.id,
      phone: user.phone,
      role: user.role || safeRole,
      name: user.name || (safeRole === 'groomer' ? 'Demo Groomer' : 'Demo Owner'),
    };
    setSession(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    try { await api.signOut(); } catch (_) {}
    setSession(null);
  }, []);

  const switchRole = useCallback(async (role) => { await signIn('', role); }, [signIn]);

  const value = useMemo(
    () => ({ session, setSession, signIn, signOut, switchRole, isDemo: API_MODE === 'demo' }),
    [session, signIn, signOut, switchRole]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession must be used within SessionProvider');
  return ctx;
}

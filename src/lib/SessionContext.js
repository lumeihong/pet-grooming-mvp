import React, { createContext, useContext, useMemo, useState, useCallback } from 'react';
import { api, API_MODE } from './api';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [session, setSession] = useState(null);

  const signIn = useCallback(async (phone, role, password = 'test1234') => {
    const safeRole = role === 'groomer' ? 'groomer' : role === 'admin' ? 'admin' : 'client';
    const defaultPhone =
      safeRole === 'groomer' ? '+6598000001' : safeRole === 'admin' ? '+6500000000' : '+6598000010';

    if (safeRole === 'admin') {
      const next = { id: 'u_admin_demo', phone: defaultPhone, role: 'admin', name: 'Admin' };
      setSession(next);
      return next;
    }

    // 真实 Supabase Auth（手机号+密码）。demo 模式由 api 层切换。
    const { user } = await api.signIn(phone || defaultPhone, safeRole, password);
    const next = {
      id: user.id,
      phone: user.phone,
      role: user.role || safeRole,
      name: user.name || (safeRole === 'groomer' ? 'Groomer' : 'Owner'),
    };
    setSession(next);
    return next;
  }, []);

  const signOut = useCallback(async () => {
    try { await api.signOut(); } catch (_) {}
    setSession(null);
  }, []);

  const switchRole = useCallback(async (role) => { await signIn('', role, 'test1234'); }, [signIn]);

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

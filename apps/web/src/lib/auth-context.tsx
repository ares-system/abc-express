'use client';

import { createContext, useContext, useCallback, useEffect, useState, type ReactNode } from 'react';
import { api } from './api-client';

// ─── Types ──────────────────────────────────────────────────

export type UserRole = 'ADMIN' | 'OPS_MANAGER' | 'FINANCE_MANAGER' | 'DISPATCHER' | 'BRANCH_STAFF' | 'VIEWER';

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  branchId: string | null;
  branchName?: string;
}

interface AuthState {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
  canAccess: (requiredRoles: UserRole[]) => boolean;
}

// ─── Constants ──────────────────────────────────────────────

const TOKEN_KEY = 'abc_token';
const REFRESH_KEY = 'abc_refresh';

/** Matches POST /api/auth/login `data` payload */
type LoginData = {
  token: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    role: UserRole;
    branch?: { id: string; code: string; name: string } | null;
  };
};

const mapLoginUser = (u: LoginData['user']): AuthUser => ({
  id: u.id,
  email: u.email,
  name: u.name,
  role: u.role,
  branchId: u.branch?.id ?? null,
  branchName: u.branch?.name,
});

// ─── Context ────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ───────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Restore session on mount
  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (!token) {
      setState((s) => ({ ...s, isLoading: false }));
      return;
    }
    api.setToken(token);
    fetchMe(token);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchMe = async (token: string) => {
    try {
      const res = await api.get<{
        id: string;
        email: string;
        name: string;
        role: UserRole;
        branchId: string | null;
        branch: { name: string } | null;
      }>('/auth/me');
      const u = res.data;
      setState({
        user: {
          id: u.id,
          email: u.email,
          name: u.name,
          role: u.role,
          branchId: u.branchId,
          branchName: u.branch?.name,
        },
        token,
        isLoading: false,
        isAuthenticated: true,
      });
    } catch {
      // Token expired or invalid
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_KEY);
      api.setToken(null);
      setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
    }
  };

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.post<LoginData>('/auth/login', { email, password });

    const { token, refreshToken, user } = res.data;
    localStorage.setItem(TOKEN_KEY, token);
    localStorage.setItem(REFRESH_KEY, refreshToken);
    api.setToken(token);

    setState({
      user: mapLoginUser(user),
      token,
      isLoading: false,
      isAuthenticated: true,
    });
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_KEY);
    api.setToken(null);
    setState({ user: null, token: null, isLoading: false, isAuthenticated: false });
  }, []);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      await fetchMe(token);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const hasRole = useCallback(
    (...roles: UserRole[]) => {
      if (!state.user) return false;
      return roles.includes(state.user.role);
    },
    [state.user],
  );

  const canAccess = useCallback(
    (requiredRoles: UserRole[]) => {
      if (!state.user) return false;
      if (state.user.role === 'ADMIN') return true;
      return requiredRoles.includes(state.user.role);
    },
    [state.user],
  );

  return (
    <AuthContext.Provider value={{ ...state, login, logout, refreshUser, hasRole, canAccess }}>
      {children}
    </AuthContext.Provider>
  );
};

// ─── Hook ───────────────────────────────────────────────────

export const useAuth = (): AuthContextValue => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

import React, { createContext, useContext, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { authApi } from '@/api/auth.api';
import { User, UserRole } from '@/types';

interface AuthContextValue {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  hasRole: (...roles: UserRole[]) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, setAuth, logout: storeLogout, refreshToken } = useAuthStore();

  const login = useCallback(async (email: string, password: string) => {
    const data = await authApi.login(email, password);
    setAuth(
      {
        id: data.id,
        email: data.email,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        status: data.status,
        lastLoginAt: data.lastLoginAt,
        createdAt: data.createdAt,
      },
      data.accessToken,
      data.refreshToken
    );
  }, [setAuth]);

  const logout = useCallback(async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } finally {
      storeLogout();
    }
  }, [refreshToken, storeLogout]);

  const hasRole = useCallback(
    (...roles: UserRole[]) => !!user && roles.includes(user.role),
    [user]
  );

  return (
    <AuthContext.Provider value={{ user, isAuthenticated, login, logout, hasRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

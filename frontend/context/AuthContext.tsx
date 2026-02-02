import React, { createContext, useContext, useState, ReactNode, useMemo, useCallback, useEffect } from 'react';
import { User } from '../types';
import { authAPI } from '../api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  const login = useCallback((u: User) => {
    setUser(u);
    setIsAuthLoading(false);
  }, []);

  const logout = useCallback(async () => {
    setUser(null);
    setIsAuthLoading(false);
    // Best-effort server logout (clears cookies server-side if implemented).
    try {
      await fetch('/api/v1/auth/logout', { method: 'POST', credentials: 'include' });
    } catch {
      // ignore
    }
  }, []);

  const refreshMe = useCallback(async () => {
    try {
      const me = await authAPI.getCurrentUser();
      if (me?.id) {
        setUser(me);
      } else {
        setUser(null);
      }
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        await refreshMe();
      } finally {
        if (alive) setIsAuthLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [refreshMe]);

  const value = useMemo(() => ({
    user,
    isAuthenticated: !!user,
    isAuthLoading,
    login,
    logout,
    refreshMe
  }), [user, isAuthLoading, login, logout, refreshMe]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
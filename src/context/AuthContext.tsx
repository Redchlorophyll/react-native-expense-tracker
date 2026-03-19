import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '@/types';

const AUTH_STORAGE_KEY = '@expense-tracker/auth-user';

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (emailOrUsername: string, password: string) => Promise<void>;
  completeRegistration: (username: string, email: string) => Promise<void>;
  logout: () => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Restore session on mount
  useEffect(() => {
    AsyncStorage.getItem(AUTH_STORAGE_KEY)
      .then(raw => {
        if (raw) setUser(JSON.parse(raw) as User);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const persist = useCallback(async (u: User | null) => {
    if (u) {
      await AsyncStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(u));
    } else {
      await AsyncStorage.removeItem(AUTH_STORAGE_KEY);
    }
    setUser(u);
  }, []);

  // Demo: accept any credentials
  const login = useCallback(async (emailOrUsername: string, _password: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      username: emailOrUsername.includes('@') ? emailOrUsername.split('@')[0] : emailOrUsername,
      email: emailOrUsername.includes('@') ? emailOrUsername : `${emailOrUsername}@demo.com`,
    };
    await persist(newUser);
  }, [persist]);

  // Called after verification code is confirmed
  const completeRegistration = useCallback(async (username: string, email: string) => {
    const newUser: User = {
      id: `user-${Date.now()}`,
      username,
      email,
    };
    await persist(newUser);
  }, [persist]);

  const logout = useCallback(async () => {
    await persist(null);
  }, [persist]);

  // Demo: accept any password change
  const updatePassword = useCallback(async (_current: string, _next: string) => {
    // In a real app this would call an API
    await new Promise(r => setTimeout(r, 400));
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, completeRegistration, logout, updatePassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}

export function getInitials(username: string): string {
  return username
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map(w => w[0]?.toUpperCase() ?? '')
    .join('');
}

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { useTheme } from './ThemeContext';
import { apiFetch } from '../lib/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { setTheme, setPrimaryColor, setSystemName, setLogoUrl } = useTheme();

  const checkAuth = async () => {
    try {
      const response = await apiFetch(`/api/auth/me?t=${Date.now()}`);
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        if (data.user.theme) setTheme(data.user.theme as any);
        if (data.user.colorPalette) setPrimaryColor(data.user.colorPalette);
      } else {
        if (user) {
          setUser(null);
        }
      }
    } catch (error) {
      console.error('Erro ao atualizar autenticação:', error);
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Buscar configurações do sistema
    apiFetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data.companyName) setSystemName(data.companyName);
        if (data.logoUrl !== undefined) setLogoUrl(data.logoUrl);
      })
      .catch(err => console.error('Falha ao buscar configurações do sistema:', err));

    checkAuth();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    if (userData.theme) setTheme(userData.theme as any);
    if (userData.colorPalette) setPrimaryColor(userData.colorPalette);
  };

  const logout = async () => {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      setTheme('light');
      setPrimaryColor('#4f46e5');
    } catch (error) {
      console.error('Falha no logout:', error);
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkAuth, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

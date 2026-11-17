import React, { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from 'react';
import api from '@/api/axios';
import type { User, Membership } from '@/types';

interface RegisterPayload {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  teamCode?: string;
  orgName?: string;
  facilityName?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  memberships: Membership[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_KEY = 'roosterly_token';
const USER_KEY = 'roosterly_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get('/api/auth/me');
      if (res.data?.success && res.data.user) {
        setUser(res.data.user);
        setMemberships(res.data.memberships || []);
        if (typeof window !== 'undefined') {
          localStorage.setItem(USER_KEY, JSON.stringify(res.data.user));
        }
      }
    } catch (err: unknown) {
      console.error('Failed to refresh user profile:', err);
      // If unauthorized, clear state
      logout();
    }
  }, []);

  useEffect(() => {
    const initializeAuth = async () => {
      if (typeof window !== 'undefined') {
        const storedToken = localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {
              localStorage.removeItem(USER_KEY);
            }
          }
          await refreshUser();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, [refreshUser]);

  const login = async (email: string, password: string): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const res = await api.post('/api/auth/login', { email, password });
      if (res.data?.success && res.data.token) {
        const receivedToken = res.data.token;
        const receivedUser = res.data.user;
        const receivedMemberships = res.data.memberships || [];

        setToken(receivedToken);
        setUser(receivedUser);
        setMemberships(receivedMemberships);

        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, receivedToken);
          localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
        }
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Login failed' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Login failed';
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<{ success: boolean; message?: string }> => {
    setIsLoading(true);
    try {
      const res = await api.post('/api/auth/register', payload);
      if (res.data?.success && res.data.token) {
        const receivedToken = res.data.token;
        const receivedUser = res.data.user;
        const receivedMemberships = res.data.memberships || [];

        setToken(receivedToken);
        setUser(receivedUser);
        setMemberships(receivedMemberships);

        if (typeof window !== 'undefined') {
          localStorage.setItem(TOKEN_KEY, receivedToken);
          localStorage.setItem(USER_KEY, JSON.stringify(receivedUser));
        }
        return { success: true };
      }
      return { success: false, message: res.data?.message || 'Registration failed' };
    } catch (err: any) {
      const msg = err.response?.data?.message || err.message || 'Registration failed';
      return { success: false, message: msg };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    setMemberships([]);
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      localStorage.removeItem('roosterly_active_team_id');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        memberships,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

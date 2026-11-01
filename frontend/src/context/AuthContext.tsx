import React, { createContext, useContext, useState, useEffect } from 'react';
import apiClient from '../api/client';
import { User, ApiResponse } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  register: (data: {
    name: string;
    email: string;
    password: string;
    avatarUrl?: string;
    bio?: string;
  }) => Promise<void>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('flowboard_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('flowboard_token');
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Restore session and verify token validity on initial mount
  useEffect(() => {
    const verifySession = async () => {
      const savedToken = localStorage.getItem('flowboard_token');
      if (savedToken) {
        try {
          const res = await apiClient.get<ApiResponse<User>>('/auth/me');
          if (res.data.success && res.data.data) {
            setUser(res.data.data);
            localStorage.setItem('flowboard_user', JSON.stringify(res.data.data));
          }
        } catch (err) {
          console.warn('Session verification failed, clearing auth:', err);
          logout();
        }
      }
      setIsLoading(false);
    };

    verifySession();
  }, []);

  const login = async (credentials: { email: string; password: string }) => {
    const res = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/login',
      credentials
    );

    const { user: userData, token: tokenData } = res.data.data;
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('flowboard_token', tokenData);
    localStorage.setItem('flowboard_user', JSON.stringify(userData));
  };

  const register = async (data: {
    name: string;
    email: string;
    password: string;
    avatarUrl?: string;
    bio?: string;
  }) => {
    const res = await apiClient.post<ApiResponse<{ user: User; token: string }>>(
      '/auth/register',
      data
    );

    const { user: userData, token: tokenData } = res.data.data;
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('flowboard_token', tokenData);
    localStorage.setItem('flowboard_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('flowboard_token');
    localStorage.removeItem('flowboard_user');
  };

  const updateUser = (updatedData: Partial<User>) => {
    if (user) {
      const merged = { ...user, ...updatedData };
      setUser(merged);
      localStorage.setItem('flowboard_user', JSON.stringify(merged));
    }
  };

  const refreshUser = async () => {
    try {
      const res = await apiClient.get<ApiResponse<User>>('/auth/me');
      if (res.data.success && res.data.data) {
        setUser(res.data.data);
        localStorage.setItem('flowboard_user', JSON.stringify(res.data.data));
      }
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        isLoading,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
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

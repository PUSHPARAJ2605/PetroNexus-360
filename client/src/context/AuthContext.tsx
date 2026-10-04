import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string, user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('petronexus_token');
    const savedUser = localStorage.getItem('petronexus_user');

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        // Verify with /api/auth/me in background
        api.get('/auth/me')
          .then((res) => {
            if (res.data?.user) {
              setUser(res.data.user);
              localStorage.setItem('petronexus_user', JSON.stringify(res.data.user));
            }
          })
          .catch(() => {
            // If token expired, clear
            localStorage.removeItem('petronexus_token');
            localStorage.removeItem('petronexus_user');
            setUser(null);
            setToken(null);
          })
          .finally(() => setLoading(false));
        return;
      } catch (e) {
        localStorage.removeItem('petronexus_token');
        localStorage.removeItem('petronexus_user');
      }
    }
    setLoading(false);
  }, []);

  const login = (newToken: string, newUser: User) => {
    localStorage.setItem('petronexus_token', newToken);
    localStorage.setItem('petronexus_user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    api.post('/auth/logout').catch(() => {});
    localStorage.removeItem('petronexus_token');
    localStorage.removeItem('petronexus_user');
    setToken(null);
    setUser(null);
  };

  const updateUser = (updatedUser: User) => {
    localStorage.setItem('petronexus_user', JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        loading,
        login,
        logout,
        updateUser,
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

import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/api.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('hackkro_token'));
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Hydrate user profile on initial mount if token exists
  useEffect(() => {
    let isMounted = true;

    async function loadUser() {
      const storedToken = localStorage.getItem('hackkro_token');
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await authService.getMe();
        if (isMounted) {
          setUser(response.data.user);
          setToken(storedToken);
        }
      } catch (err) {
        console.warn('[AuthContext] Session invalid or expired. Clearing token.');
        localStorage.removeItem('hackkro_token');
        if (isMounted) {
          setUser(null);
          setToken(null);
        }
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    loadUser();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email, password) => {
    setError(null);
    try {
      const response = await authService.login({ email, password });
      const { user: loggedInUser, token: authToken } = response.data;
      localStorage.setItem('hackkro_token', authToken);
      setToken(authToken);
      setUser(loggedInUser);
      return loggedInUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const register = async (name, email, password) => {
    setError(null);
    try {
      const response = await authService.register({ name, email, password });
      const { user: newUser, token: authToken } = response.data;
      localStorage.setItem('hackkro_token', authToken);
      setToken(authToken);
      setUser(newUser);
      return newUser;
    } catch (err) {
      setError(err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch (err) {
      console.warn('[AuthContext] Logout request error:', err.message);
    } finally {
      localStorage.removeItem('hackkro_token');
      setUser(null);
      setToken(null);
    }
  };

  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
    isIntern: user?.role === 'intern',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

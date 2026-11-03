import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/client';

export const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem('checkwave_token') || null);
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('checkwave_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  // Sync token to localStorage whenever it changes
  const login = useCallback((newToken, newUser) => {
    setToken(newToken);
    setUser(newUser);
    localStorage.setItem('checkwave_token', newToken);
    localStorage.setItem('checkwave_user', JSON.stringify(newUser));
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Even if network fails, proceed with local logout
    } finally {
      setToken(null);
      setUser(null);
      localStorage.removeItem('checkwave_token');
      localStorage.removeItem('checkwave_user');
    }
  }, []);

  const updateUser = useCallback((updatedUserData) => {
    setUser((prev) => {
      const merged = { ...prev, ...updatedUserData };
      localStorage.setItem('checkwave_user', JSON.stringify(merged));
      return merged;
    });
  }, []);

  // Verify token on mount with getMe
  useEffect(() => {
    let isMounted = true;

    const verifyAuth = async () => {
      const storedToken = localStorage.getItem('checkwave_token');
      if (!storedToken) {
        if (isMounted) setLoading(false);
        return;
      }

      try {
        const response = await authApi.getMe();
        if (isMounted) {
          const fetchedUser = response.data?.user || response.data;
          setUser(fetchedUser);
          localStorage.setItem('checkwave_user', JSON.stringify(fetchedUser));
        }
      } catch (err) {
        // Only clear session if server explicitly returned 401 Unauthorized
        if (err.response?.status === 401) {
          if (isMounted) {
            setToken(null);
            setUser(null);
            localStorage.removeItem('checkwave_token');
            localStorage.removeItem('checkwave_user');
          }
        } else {
          // If network error / backend offline, keep stored session so demo mode persists
          const storedUser = localStorage.getItem('checkwave_user');
          if (storedUser && isMounted) {
            try {
              setUser(JSON.parse(storedUser));
            } catch {}
          }
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    verifyAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const isAuthenticated = Boolean(token && user);

  return (
    <AuthContext.Provider
      value={{
        token,
        user,
        loading,
        isAuthenticated,
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

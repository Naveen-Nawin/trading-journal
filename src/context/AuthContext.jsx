import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('pipdesk_auth_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState('');

  // Validate token and 5-hour session on mount
  useEffect(() => {
    const fetchMe = async () => {
      if (!token) {
        setIsLoading(false);
        return;
      }

      // Check 5-hour session expiry
      const sessionStart = parseInt(localStorage.getItem('pipdesk_session_start') || '0', 10);
      if (sessionStart && Date.now() - sessionStart >= FIVE_HOURS_MS) {
        logout('Your 5-hour session has expired for security. Please sign in again.');
        setIsLoading(false);
        return;
      }

      try {
        const res = await fetch('/api/auth/me', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.ok) {
          const data = await res.json();
          setUser(data.user);
        } else {
          // Token expired or invalid
          logout('Session invalid or expired. Please sign in again.');
        }
      } catch (err) {
        console.warn('Auth check offline or failed:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, [token]);

  // Periodic check: automatically log out after 5 hours
  useEffect(() => {
    if (!token) return;

    const interval = setInterval(() => {
      const sessionStart = parseInt(localStorage.getItem('pipdesk_session_start') || '0', 10);
      if (sessionStart && Date.now() - sessionStart >= FIVE_HOURS_MS) {
        logout('Your 5-hour session has expired for security. Please sign in again.');
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [token]);

  const login = async (email, password) => {
    setAuthError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      localStorage.setItem('pipdesk_auth_token', data.token);
      localStorage.setItem('pipdesk_session_start', Date.now().toString());
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
      return data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const register = async (email, password, name) => {
    setAuthError('');
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      localStorage.setItem('pipdesk_auth_token', data.token);
      localStorage.setItem('pipdesk_session_start', Date.now().toString());
      setToken(data.token);
      setUser(data.user);
      setIsAuthModalOpen(false);
      return data;
    } catch (err) {
      setAuthError(err.message);
      throw err;
    }
  };

  const logout = (reason = '') => {
    localStorage.removeItem('pipdesk_auth_token');
    localStorage.removeItem('pipdesk_session_start');
    setToken(null);
    setUser(null);
    if (reason) {
      setAuthError(reason);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        isAuthModalOpen,
        setIsAuthModalOpen,
        authError,
        setAuthError,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { LogoutModal } from '../components/Auth/LogoutModal';

const AuthContext = createContext(null);

const FIVE_HOURS_MS = 5 * 60 * 60 * 1000; // 5 hours in milliseconds

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('pipdesk_auth_token') || null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState('');
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [logoutReason, setLogoutReason] = useState('');

  // Validate session and 5-hour limit on mount
  useEffect(() => {
    const initAuth = async () => {
      // Check 5-hour session expiry
      const sessionStart = parseInt(localStorage.getItem('pipdesk_session_start') || '0', 10);
      if (sessionStart && Date.now() - sessionStart >= FIVE_HOURS_MS) {
        logout('Your 5-hour session has expired for security. Please sign in again.');
        setIsLoading(false);
        return;
      }

      if (isSupabaseConfigured) {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session && session.user) {
            setUser({
              id: session.user.id,
              email: session.user.email,
              name: session.user.user_metadata?.name || session.user.email.split('@')[0],
            });
            setToken(session.access_token);
          } else {
            // Check fallback token or prompt login
            const savedUser = localStorage.getItem('pipdesk_user_obj');
            if (token && savedUser) {
              try { setUser(JSON.parse(savedUser)); } catch { /* ignore */ }
            }
          }
        } catch (err) {
          console.warn('Supabase session check error:', err);
        } finally {
          setIsLoading(false);
        }
      } else if (token) {
        try {
          const res = await fetch('/api/auth/me', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            setUser(data.user);
          } else {
            logout('Session invalid or expired. Please sign in again.');
          }
        } catch (err) {
          console.warn('Backend offline, using cached session:', err);
          const savedUser = localStorage.getItem('pipdesk_user_obj');
          if (savedUser) setUser(JSON.parse(savedUser));
        } finally {
          setIsLoading(false);
        }
      } else {
        setIsLoading(false);
      }
    };

    initAuth();

    // Listen to Supabase auth state changes
    if (isSupabaseConfigured) {
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const userObj = {
            id: session.user.id,
            email: session.user.email,
            name: session.user.user_metadata?.name || session.user.email.split('@')[0],
          };
          setUser(userObj);
          setToken(session.access_token);
          localStorage.setItem('pipdesk_user_obj', JSON.stringify(userObj));
          localStorage.setItem('pipdesk_auth_token', session.access_token);
        }
      });

      return () => subscription.unsubscribe();
    }
  }, []);

  // Periodic check: automatically log out after 5 hours
  useEffect(() => {
    if (!user) return;

    const interval = setInterval(() => {
      const sessionStart = parseInt(localStorage.getItem('pipdesk_session_start') || '0', 10);
      if (sessionStart && Date.now() - sessionStart >= FIVE_HOURS_MS) {
        logout('Your 5-hour session has expired for security. Please sign in again.');
      }
    }, 30000); // Check every 30 seconds

    return () => clearInterval(interval);
  }, [user]);

  const login = async (email, password) => {
    setAuthError('');
    const cleanEmail = email.trim().toLowerCase();

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        setAuthError(error.message);
        throw error;
      }

      const userObj = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.user_metadata?.name || cleanEmail.split('@')[0],
      };

      localStorage.setItem('pipdesk_auth_token', data.session.access_token);
      localStorage.setItem('pipdesk_user_obj', JSON.stringify(userObj));
      localStorage.setItem('pipdesk_session_start', Date.now().toString());
      setToken(data.session.access_token);
      setUser(userObj);
      setIsAuthModalOpen(false);
      return data;
    }

    // Fallback to Express backend if Supabase not configured
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Login failed');

      localStorage.setItem('pipdesk_auth_token', data.token);
      localStorage.setItem('pipdesk_user_obj', JSON.stringify(data.user));
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
    const cleanEmail = email.trim().toLowerCase();
    const cleanName = (name && name.trim()) || cleanEmail.split('@')[0];

    if (isSupabaseConfigured) {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: { name: cleanName },
        },
      });

      if (error) {
        setAuthError(error.message);
        throw error;
      }

      // If session returned immediately (email confirmation disabled or auto-confirmed)
      if (data?.session) {
        const userObj = {
          id: data.user.id,
          email: data.user.email,
          name: cleanName,
        };
        localStorage.setItem('pipdesk_auth_token', data.session.access_token);
        localStorage.setItem('pipdesk_user_obj', JSON.stringify(userObj));
        localStorage.setItem('pipdesk_session_start', Date.now().toString());
        setToken(data.session.access_token);
        setUser(userObj);
        setIsAuthModalOpen(false);
      } else if (data?.user) {
        // Try logging in directly
        try {
          return await login(cleanEmail, password);
        } catch {
          setAuthError('Account created! Please check your email or log in.');
        }
      }
      return data;
    }

    // Fallback to Express backend
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: cleanEmail, password, name: cleanName }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Registration failed');

      localStorage.setItem('pipdesk_auth_token', data.token);
      localStorage.setItem('pipdesk_user_obj', JSON.stringify(data.user));
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
    setLogoutReason(reason);
    setIsLoggingOut(true);
  };

  const completeLogout = async () => {
    if (isSupabaseConfigured) {
      try {
        await supabase.auth.signOut();
      } catch { /* ignore */ }
    }
    localStorage.removeItem('pipdesk_auth_token');
    localStorage.removeItem('pipdesk_user_obj');
    localStorage.removeItem('pipdesk_session_start');
    setToken(null);
    setUser(null);
    setIsLoggingOut(false);
    if (logoutReason) {
      setAuthError(logoutReason);
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
        isLoggingOut,
      }}
    >
      {children}
      <LogoutModal
        isOpen={isLoggingOut}
        userName={user?.name || user?.email?.split('@')[0] || 'Trader'}
        reason={logoutReason}
        onComplete={completeLogout}
      />
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

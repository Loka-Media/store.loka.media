'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { authAPI, User } from '@/lib/auth';
import toast from 'react-hot-toast';

interface RegisterData {
  name: string;
  username: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
  role?: string;
  creatorUrl?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const isAuthenticated = !!user;

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const response = await authAPI.getMe();
        setUser(response.user);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await authAPI.login({ email, password });
      setUser(response.user);
      toast.success('Login successful');
      return true;
    } catch (error: unknown) {
      const message = (error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response &&
        error.response.data && typeof error.response.data === 'object' && 'error' in error.response.data &&
        typeof error.response.data.error === 'string') ? error.response.data.error : 'Login failed';
      toast.error(message);
      
      // If email verification is required
      if (error && typeof error === 'object' && 'response' in error && 
        error.response && typeof error.response === 'object' && 'data' in error.response &&
        error.response.data && typeof error.response.data === 'object' && 'requiresVerification' in error.response.data) {
        return false; // Will redirect to verification
      }
      return false;
    }
  };

  const register = async (data: RegisterData): Promise<boolean> => {
    try {
      const registrationData = {
        name: data.name,
        username: data.username,
        email: data.email,
        phone: data.phone,
        password: data.password,
        role: data.role === 'customer' ? 'user' : (data.role || (data.creatorUrl ? 'creator' : 'user')),
        ...(data.creatorUrl && { creatorUrl: data.creatorUrl })
      };

      await authAPI.register(registrationData);

      // Trigger pending approval notification email via Resend
      if (data.creatorUrl) {
        try {
          fetch('/api/notifications/send-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              to: data.email,
              name: data.name,
              type: 'pending_approval',
            }),
          }).catch((e) => console.error('Failed to trigger pending approval email:', e));
        } catch (e) {
          console.error('Email trigger error:', e);
        }
      }

      const message = data.creatorUrl
        ? 'Registration successful! Your creator application has been submitted for review. Please check your email for OTP verification.'
        : 'Registration successful! Please check your email for OTP verification.';

      toast.success(message);
      return true;
    } catch (error: any) {
      const data = error?.response?.data;
      let serverMessage = '';

      // 1. Check array details (express-validator / zod)
      if (data && Array.isArray(data.details) && data.details.length > 0) {
        const msgs = data.details.map((d: any) => {
          if (typeof d === 'string') return d;
          const field = d.path || d.param || d.field;
          const msg = d.msg || d.message;
          if (field && msg) {
            const cleanField = field.charAt(0).toUpperCase() + field.slice(1);
            return `${cleanField}: ${msg}`;
          }
          return msg || d?.error || null;
        }).filter(Boolean);

        if (msgs.length > 0) serverMessage = msgs.join(' | ');
      }

      // 2. Check array errors
      if (!serverMessage && data && Array.isArray(data.errors) && data.errors.length > 0) {
        const msgs = data.errors.map((d: any) => {
          if (typeof d === 'string') return d;
          const field = d.path || d.param || d.field;
          const msg = d.msg || d.message;
          if (field && msg) {
            const cleanField = field.charAt(0).toUpperCase() + field.slice(1);
            return `${cleanField}: ${msg}`;
          }
          return msg || d?.error || null;
        }).filter(Boolean);

        if (msgs.length > 0) serverMessage = msgs.join(' | ');
      }

      // 3. Check string details
      if (!serverMessage && typeof data?.details === 'string' && data.details.trim()) {
        serverMessage = data.details;
      }

      // 4. Check specific message field (skip generic "Validation failed")
      if (!serverMessage && typeof data?.message === 'string' && data.message.trim() && data.message !== 'Validation failed') {
        serverMessage = data.message;
      }

      // 5. Check specific error field (skip generic "Validation failed")
      if (!serverMessage && typeof data?.error === 'string' && data.error.trim() && data.error !== 'Validation failed') {
        serverMessage = data.error;
      }

      // 6. Check raw response string
      if (!serverMessage && typeof data === 'string' && data.trim()) {
        serverMessage = data;
      }

      // 7. Fallback
      if (!serverMessage) {
        serverMessage = 'Registration failed. Email or Phone number may already be registered.';
      }

      toast.error(serverMessage, { duration: 6000 });
      return false;
    }
  };

  const refreshUser = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      if (token) {
        const response = await authAPI.getMe();
        setUser(response.user);
      }
    } catch (error) {
      console.error('Refresh user failed:', error);
    }
  };

  const logout = async () => {
    try {
      await authAPI.logout();
      setUser(null);
      toast.success('Logged out successfully');
    } catch (error) {
      console.error('Logout error:', error);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated,
      }}
    >
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
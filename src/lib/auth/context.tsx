// src/lib/auth/context.tsx

'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthState, RegisterUserData } from '@/types/auth';
import { authServices } from './api';

// Interface for message data
interface MessageData {
  recipientId: string;
  content: string;
  type?: 'text' | 'notification';
}

interface AuthContextType extends AuthState {
  login: (phone_number: string, password: string) => Promise<void>;
  logout: () => void;
  register: (userData: RegisterUserData) => Promise<void>;
  refreshUser: () => Promise<void>;
  sendMessage: (messageData: MessageData) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check if user is already logged in on initial load
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');
    
    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
    
    setLoading(false);
  }, []);

  const login = async (phone_number: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await authServices.login({ phone_number, password });

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        throw new Error('Unexpected response format from API');
      }

      // Handle error response
      if ('status' in response && response.status === 'error') {
        throw new Error(response.message || 'Login failed');
      }

      // Handle successful response
      if ('status' in response && response.status === 'success' && response.data) {
        const { user, token } = response.data;

        // Store in state
        setUser(user);
        setToken(token);
        setIsAuthenticated(true);
        
        // Store in localStorage
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(user));
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterUserData) => {
    try {
      setLoading(true);
      setError(null);
      
      await authServices.register(userData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Clear state
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    
    // Redirect to login page
    if (typeof window !== 'undefined') {
      window.location.href = '/login';
    }
  };

  const refreshUser = async () => {
    if (!token) return;

    try {
      setLoading(true);
      const response = await authServices.getCurrentUser(token);

      // Handle Blob response (shouldn't happen for JSON endpoints)
      if (response instanceof Blob) {
        throw new Error('Unexpected response format from API');
      }

      // Handle error response
      if ('status' in response && response.status === 'error') {
        throw new Error(response.message || 'Failed to refresh user data');
      }

      // Handle successful response
      if ('status' in response && response.status === 'success' && response.data) {
        const userData = response.data.user;

        // Update state
        setUser(userData);

        // Update localStorage
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error('Invalid response format');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to refresh user data';
      setError(errorMessage);
      logout(); // Log out if we can't refresh user data
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (messageData: MessageData) => {
    if (!token) {
      throw new Error('Not authenticated');
    }
    
    try {
      setLoading(true);
      setError(null);
      
      // Here you would typically send the message to your API
      // For now, we'll just simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('Message sent:', messageData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const value = {
    user,
    token,
    isAuthenticated,
    loading,
    error,
    login,
    logout,
    register,
    refreshUser,
    sendMessage,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
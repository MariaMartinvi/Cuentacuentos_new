import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser, logout as authLogout } from '../services/authService';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (token, userData) => {
    try {
      // Configurar el token en axios para futuras peticiones
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Use provided user data or fetch it
      const currentUser = userData || await getCurrentUser();
      if (currentUser) {
        // Ensure isPremium is set based on subscription status
        currentUser.isPremium = currentUser.subscriptionStatus === 'active';
        setUser(currentUser);
        // Store in localStorage for persistence
        localStorage.setItem('user', JSON.stringify(currentUser));
      }
    } catch (error) {
      console.error('Error during login:', error);
      throw error;
    }
  };

  const refreshUser = async () => {
    try {
      const currentUser = await getCurrentUser();
      if (currentUser) {
        // Ensure isPremium is set based on subscription status
        currentUser.isPremium = currentUser.subscriptionStatus === 'active';
        setUser(currentUser);
        // Update localStorage
        localStorage.setItem('user', JSON.stringify(currentUser));
      } else {
        setUser(null);
        localStorage.removeItem('user');
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
      localStorage.removeItem('user');
    }
  };

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');
      
      if (token) {
        // Configurar el token en axios para futuras peticiones
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        if (storedUser) {
          // Use stored user data initially
          const parsedUser = JSON.parse(storedUser);
          parsedUser.isPremium = parsedUser.subscriptionStatus === 'active';
          setUser(parsedUser);
        }
        
        // Then fetch fresh data
        const currentUser = await getCurrentUser();
        if (currentUser) {
          currentUser.isPremium = currentUser.subscriptionStatus === 'active';
          setUser(currentUser);
          localStorage.setItem('user', JSON.stringify(currentUser));
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
      setUser(null);
      localStorage.removeItem('user');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    initializeAuth();
  }, []);

  // Escuchar cambios en localStorage para actualizar el estado del usuario
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'user') {
        try {
          const newUserData = JSON.parse(e.newValue);
          if (newUserData) {
            newUserData.isPremium = newUserData.subscriptionStatus === 'active';
            setUser(newUserData);
          } else {
            setUser(null);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
          setUser(null);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const logout = async () => {
    try {
      await authLogout();
      setUser(null);
    } catch (error) {
      console.error('Error during logout:', error);
      // Still clear user state even if logout fails
      setUser(null);
    }
  };

  const value = {
    user,
    loading,
    setUser,
    refreshUser,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
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
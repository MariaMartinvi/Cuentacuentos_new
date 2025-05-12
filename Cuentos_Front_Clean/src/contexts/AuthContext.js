import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (token) => {
    try {
      // Configurar el token en axios para futuras peticiones
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      
      // Obtener la información del usuario
      const currentUser = await getCurrentUser();
      if (currentUser) {
        // Ensure isPremium is set based on subscription status
        currentUser.isPremium = currentUser.subscriptionStatus === 'active';
        setUser(currentUser);
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
      } else {
        setUser(null);
      }
    } catch (error) {
      console.error('Error refreshing user:', error);
      setUser(null);
    }
  };

  const initializeAuth = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        // Configurar el token en axios para futuras peticiones
        axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        
        const currentUser = await getCurrentUser();
        if (currentUser) {
          // Ensure isPremium is set based on subscription status
          currentUser.isPremium = currentUser.subscriptionStatus === 'active';
          setUser(currentUser);
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
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
            setUser(newUserData);
          }
        } catch (error) {
          console.error('Error parsing user data:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const value = {
    user,
    loading,
    setUser,
    refreshUser,
    login,
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
import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/authService';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Verificar token inicialmente para establecer un valor predeterminado más preciso para isAuthenticated
  const hasToken = !!localStorage.getItem('token');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(hasToken); // Solo mostrar carga si hay token

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
        
        // Verificar si hay datos en sessionStorage para cargar instantáneamente
        const cachedUser = sessionStorage.getItem('cachedUser');
        if (cachedUser) {
          try {
            const parsedUser = JSON.parse(cachedUser);
            setUser(parsedUser);
            // Realizar actualización en segundo plano
            getCurrentUser().then(currentUser => {
              if (currentUser) {
                currentUser.isPremium = currentUser.subscriptionStatus === 'active';
                setUser(currentUser);
                // Actualizar caché
                sessionStorage.setItem('cachedUser', JSON.stringify(currentUser));
              }
            }).catch(console.error);
            setLoading(false);
            return;
          } catch (e) {
            console.error('Error parsing cached user data', e);
            sessionStorage.removeItem('cachedUser');
          }
        }
        
        const currentUser = await getCurrentUser();
        if (currentUser) {
          // Ensure isPremium is set based on subscription status
          currentUser.isPremium = currentUser.subscriptionStatus === 'active';
          setUser(currentUser);
          // Cachear para futuras cargas
          sessionStorage.setItem('cachedUser', JSON.stringify(currentUser));
        }
      }
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Si no hay token, no iniciar loading
    if (!localStorage.getItem('token')) {
      setLoading(false);
      return;
    }
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
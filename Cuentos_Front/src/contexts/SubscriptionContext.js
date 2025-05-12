import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

// Crear un contexto simplificado que no haga peticiones constantes
const SubscriptionContext = createContext();

export const SubscriptionProvider = ({ children }) => {
  const { user, setUser } = useAuth();
  const [subscriptionState, setSubscriptionState] = useState(user?.subscriptionStatus || 'none');
  const [isLoading, setIsLoading] = useState(false);

  // Actualizar estado cuando cambia el usuario
  useEffect(() => {
    if (user) {
      setSubscriptionState(user.subscriptionStatus || 'none');
    } else {
      setSubscriptionState('none');
    }
  }, [user]);

  // Función para actualizar el estado de suscripción
  const refreshSubscriptionStatus = async () => {
    try {
      setIsLoading(true);
      const userData = JSON.parse(localStorage.getItem('user'));
      if (userData) {
        setSubscriptionState(userData.subscriptionStatus || 'none');
        setUser(userData); // Actualizar el estado del usuario en el AuthContext
      }
    } catch (error) {
      console.error('Error refreshing subscription status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelUserSubscription = async () => {
    try {
      setIsLoading(true);
      
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:5001'}/api/stripe/cancel-subscription`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ 
          subscriptionId: 'placeholder-id'
        })
      });

      const data = await response.json();
      
      // Actualizar el estado local
      setSubscriptionState('cancelled');
      
      // Actualizar el usuario en localStorage y en el estado
      const currentUser = JSON.parse(localStorage.getItem('user'));
      if (currentUser) {
        currentUser.subscriptionStatus = 'cancelled';
        localStorage.setItem('user', JSON.stringify(currentUser));
        setUser(currentUser); // Actualizar el estado del usuario en el AuthContext
      }
      
      return data;
    } catch (error) {
      console.error('Error al cancelar la suscripción:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SubscriptionContext.Provider value={{
      subscriptionState,
      subscriptionDetails: null,
      isLoading,
      error: null,
      refreshSubscriptionStatus,
      cancelUserSubscription
    }}>
      {children}
    </SubscriptionContext.Provider>
  );
};

export const useSubscription = () => {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within a SubscriptionProvider');
  }
  return context;
};
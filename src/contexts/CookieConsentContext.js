import React, { createContext, useState, useEffect, useContext } from 'react';
import { isUserInEU } from '../services/locationService';

// Crear el contexto
const CookieConsentContext = createContext();

// Hook personalizado para usar el contexto
export const useCookieConsent = () => useContext(CookieConsentContext);

// Proveedor del contexto
export const CookieConsentProvider = ({ children }) => {
  const [consentGiven, setConsentGiven] = useState(false);
  const [showBanner, setShowBanner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isEU, setIsEU] = useState(false);

  // Comprobar si el usuario ha dado consentimiento previamente
  useEffect(() => {
    const checkConsent = async () => {
      // Comprobar si hay consentimiento guardado
      const savedConsent = localStorage.getItem('cookie_consent');
      
      // Comprobar si el usuario está en la UE
      const userInEU = await isUserInEU();
      setIsEU(userInEU);
      
      // Si el usuario está en la UE y no ha dado consentimiento, mostrar el banner
      if (userInEU && !savedConsent) {
        setShowBanner(true);
      } else if (savedConsent === 'true') {
        setConsentGiven(true);
      }
      
      setIsLoading(false);
    };
    
    checkConsent();
  }, []);

  // Función para dar consentimiento
  const giveConsent = () => {
    localStorage.setItem('cookie_consent', 'true');
    setConsentGiven(true);
    setShowBanner(false);
  };

  // Función para rechazar el consentimiento
  const rejectConsent = () => {
    localStorage.setItem('cookie_consent', 'false');
    setConsentGiven(false);
    setShowBanner(false);
  };

  // Función para mostrar el banner de nuevo (por ejemplo, desde la página de política de privacidad)
  const resetConsent = () => {
    localStorage.removeItem('cookie_consent');
    setConsentGiven(false);
    if (isEU) {
      setShowBanner(true);
    }
  };

  return (
    <CookieConsentContext.Provider
      value={{
        consentGiven,
        showBanner,
        isLoading,
        isEU,
        giveConsent,
        rejectConsent,
        resetConsent
      }}
    >
      {children}
    </CookieConsentContext.Provider>
  );
}; 
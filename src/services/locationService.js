// Servicio para detectar la ubicación del usuario y determinar si está en la UE

// Lista de códigos de país de la UE
const EU_COUNTRIES = [
  'AT', 'BE', 'BG', 'HR', 'CY', 'CZ', 'DK', 'EE', 'FI', 'FR',
  'DE', 'GR', 'HU', 'IE', 'IT', 'LV', 'LT', 'LU', 'MT', 'NL',
  'PL', 'PT', 'RO', 'SK', 'SI', 'ES', 'SE'
];

// Función para detectar si el usuario está en la UE
export const isUserInEU = async () => {
  try {
    // Comprobar si ya tenemos la información en localStorage
    const storedLocation = localStorage.getItem('user_location');
    if (storedLocation) {
      return JSON.parse(storedLocation).isEU;
    }

    // Si no tenemos la información, hacer una petición a una API de geolocalización
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    // Determinar si el país está en la UE
    const isEU = EU_COUNTRIES.includes(data.country_code);
    
    // Guardar la información en localStorage para no tener que hacer la petición cada vez
    localStorage.setItem('user_location', JSON.stringify({
      country: data.country_code,
      isEU,
      timestamp: Date.now()
    }));
    
    return isEU;
  } catch (error) {
    console.error('Error detecting user location:', error);
    // En caso de error, asumimos que está en la UE para ser conservadores
    return true;
  }
};

// Función para obtener la información de ubicación del usuario
export const getUserLocation = async () => {
  try {
    // Comprobar si ya tenemos la información en localStorage
    const storedLocation = localStorage.getItem('user_location');
    if (storedLocation) {
      const locationData = JSON.parse(storedLocation);
      // Si la información tiene menos de 24 horas, la devolvemos
      if (Date.now() - locationData.timestamp < 24 * 60 * 60 * 1000) {
        return locationData;
      }
    }

    // Si no tenemos la información o está obsoleta, hacer una petición
    const response = await fetch('https://ipapi.co/json/');
    const data = await response.json();
    
    const locationData = {
      country: data.country_code,
      isEU: EU_COUNTRIES.includes(data.country_code),
      timestamp: Date.now()
    };
    
    // Guardar la información en localStorage
    localStorage.setItem('user_location', JSON.stringify(locationData));
    
    return locationData;
  } catch (error) {
    console.error('Error getting user location:', error);
    // En caso de error, devolvemos un objeto con valores por defecto
    return {
      country: 'Unknown',
      isEU: true,
      timestamp: Date.now()
    };
  }
}; 
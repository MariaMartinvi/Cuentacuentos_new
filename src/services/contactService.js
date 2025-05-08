import axios from 'axios';
import { API_URL, API_ENDPOINTS } from '../config/api';

/**
 * Envía un mensaje de contacto al servidor
 * @param {Object} contactData - Datos del mensaje de contacto
 * @param {string} contactData.name - Nombre del remitente
 * @param {string} contactData.email - Email del remitente
 * @param {string} contactData.message - Mensaje de contacto
 * @returns {Promise} - Promesa con la respuesta del servidor
 */
export const sendContactMessage = async (contactData) => {
  try {
    // Si no existe un endpoint de contacto en el backend, simulamos una respuesta exitosa
    // En un entorno de producción, deberías eliminar esta parte y asegurarte de que el backend tenga el endpoint
    if (process.env.NODE_ENV !== 'production') {
      console.log('Simulando envío de mensaje de contacto en entorno de desarrollo:', contactData);
      
      // Simulamos un retraso para hacer la experiencia más realista
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      return {
        success: true,
        message: 'Mensaje enviado correctamente (simulado)'
      };
    }
    
    // En producción, hacemos la petición real al backend
    const response = await axios.post(`${API_URL}${API_ENDPOINTS.CONTACT.SEND}`, contactData);
    return response.data;
  } catch (error) {
    console.error('Error al enviar mensaje de contacto:', error);
    throw error;
  }
}; 
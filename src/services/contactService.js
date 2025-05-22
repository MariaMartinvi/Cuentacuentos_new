import axios from 'axios';

// Use production server URL
const API_URL = 'https://generadorcuentos.onrender.com';

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
    // En producción, hacemos la petición real al backend
    const response = await axios.post(`${API_URL}/api/contact/send`, contactData);
    return response.data;
  } catch (error) {
    console.error('Error al enviar mensaje de contacto:', error);
    throw error;
  }
}; 
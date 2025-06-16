import { getAuth } from 'firebase/auth';
import config from '../config';

const BACKEND_URL = config.apiUrl;

export const publishStory = async (storyId) => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error('Por favor, inicia sesión para publicar historias');
    }

    const token = await user.getIdToken();
    const email = user.email;

    console.log('📤 Publishing story:', { storyId, email, backendUrl: BACKEND_URL });

    // Create AbortController for timeout handling
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 600000); // 10 minutos para publicación

    try {
      const response = await fetch(`${BACKEND_URL}/api/stories/${storyId}/publish`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'Origin': window.location.origin
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al publicar la historia');
      }

      const data = await response.json();
      console.log('✅ Story published successfully:', data);
      
      return data;
    } catch (error) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new Error('La publicación tomó demasiado tiempo. El servidor puede estar ocupado, intenta de nuevo.');
      }
      throw error;
    }
  } catch (error) {
    console.error('❌ Error publishing story:', error);
    throw error;
  }
}; 
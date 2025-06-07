import { 
  collection, 
  doc, 
  setDoc, 
  getDoc, 
  getDocs, 
  query, 
  where, 
  updateDoc, 
  increment,
  serverTimestamp,
  orderBy,
  limit
} from 'firebase/firestore';
import { db } from '../firebase/config';

/**
 * Servicio para manejar ratings de historias de Firebase
 */

// Calificar una historia de Firebase
export const rateFirebaseStory = async (storyId, rating, userId) => {
  try {
    console.log('🌟 [FirebaseRating] Rating story:', { storyId, rating, userId });
    
    if (!userId) {
      throw new Error('Usuario no autenticado');
    }
    
    if (rating < 1 || rating > 5) {
      throw new Error('Rating debe estar entre 1 y 5');
    }

    // Referencia al documento de rating del usuario para esta historia
    const userRatingRef = doc(db, 'storyRatings', `${storyId}_${userId}`);
    
    // Verificar si el usuario ya calificó esta historia
    const existingRating = await getDoc(userRatingRef);
    const isUpdate = existingRating.exists();
    const previousRating = isUpdate ? existingRating.data().rating : 0;

    // Guardar/actualizar el rating del usuario
    await setDoc(userRatingRef, {
      storyId,
      userId,
      rating,
      createdAt: isUpdate ? existingRating.data().createdAt : serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    // Actualizar estadísticas de la historia
    const storyRef = doc(db, 'storyExamples', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (storyDoc.exists()) {
      const storyData = storyDoc.data();
      const currentTotal = storyData.totalRatings || 0;
      const currentSum = storyData.ratingSum || 0;
      
      let newTotal, newSum;
      
      if (isUpdate) {
        // Actualizar: reemplazar rating anterior
        newTotal = currentTotal;
        newSum = currentSum - previousRating + rating;
      } else {
        // Nuevo rating
        newTotal = currentTotal + 1;
        newSum = currentSum + rating;
      }
      
      const newAverage = newTotal > 0 ? newSum / newTotal : 0;
      
      await updateDoc(storyRef, {
        totalRatings: newTotal,
        ratingSum: newSum,
        averageRating: newAverage,
        lastRatedAt: serverTimestamp()
      });
      
      console.log('🌟 [FirebaseRating] Updated story stats:', {
        storyId,
        newTotal,
        newSum,
        newAverage
      });
      
      return {
        success: true,
        userRating: rating,
        averageRating: newAverage,
        totalRatings: newTotal,
        isUpdate
      };
    } else {
      throw new Error('Historia no encontrada');
    }
    
  } catch (error) {
    console.error('❌ [FirebaseRating] Error rating story:', error);
    throw error;
  }
};

// Obtener rating del usuario para una historia
export const getUserRatingForStory = async (storyId, userId) => {
  try {
    if (!userId) return null;
    
    const userRatingRef = doc(db, 'storyRatings', `${storyId}_${userId}`);
    const ratingDoc = await getDoc(userRatingRef);
    
    if (ratingDoc.exists()) {
      return ratingDoc.data().rating;
    }
    
    return null;
  } catch (error) {
    console.error('❌ [FirebaseRating] Error getting user rating:', error);
    return null;
  }
};

// Obtener estadísticas de rating para una historia
export const getStoryRatingStats = async (storyId) => {
  try {
    const storyRef = doc(db, 'storyExamples', storyId);
    const storyDoc = await getDoc(storyRef);
    
    if (storyDoc.exists()) {
      const data = storyDoc.data();
      return {
        averageRating: data.averageRating || 0,
        totalRatings: data.totalRatings || 0,
        ratingSum: data.ratingSum || 0
      };
    }
    
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingSum: 0
    };
  } catch (error) {
    console.error('❌ [FirebaseRating] Error getting story stats:', error);
    return {
      averageRating: 0,
      totalRatings: 0,
      ratingSum: 0
    };
  }
};

// Obtener historias mejor calificadas
export const getTopRatedStories = async (limit = 10) => {
  try {
    const storiesRef = collection(db, 'storyExamples');
    const q = query(
      storiesRef,
      where('totalRatings', '>', 0),
      orderBy('averageRating', 'desc'),
      orderBy('totalRatings', 'desc'),
      limit(limit)
    );
    
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('❌ [FirebaseRating] Error getting top rated stories:', error);
    return [];
  }
}; 
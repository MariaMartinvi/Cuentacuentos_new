import { collection, getDocs, query, where } from "firebase/firestore";
import { ref, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/config";

/**
 * Fetch all story examples from Firestore
 */
export const fetchStoryExamples = async () => {
  try {
    const storyExamplesCollection = collection(db, "storyExamples");
    const storyExamplesSnapshot = await getDocs(storyExamplesCollection);
    const storyExamplesList = storyExamplesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return storyExamplesList;
  } catch (error) {
    console.error("Error fetching story examples:", error);
    throw error;
  }
};

/**
 * Fetch story examples filtered by age, language, and level
 */
export const fetchFilteredStoryExamples = async (filters) => {
  try {
    let storyExamplesQuery = collection(db, "storyExamples");
    const constraints = [];
    
    if (filters.age && filters.age !== 'all') {
      constraints.push(where("age", "==", filters.age));
    }
    
    if (filters.language && filters.language !== 'all') {
      constraints.push(where("language", "==", filters.language));
    }
    
    if (filters.level && filters.level !== 'all') {
      constraints.push(where("level", "==", filters.level));
    }
    
    if (constraints.length > 0) {
      // Note: In production, you'd need to create composite indexes for multiple filters
      // For simplicity, we're applying only the first filter in Firestore
      // and then filtering the rest in memory
      storyExamplesQuery = query(storyExamplesQuery, constraints[0]);
    }
    
    const storyExamplesSnapshot = await getDocs(storyExamplesQuery);
    let storyExamplesList = storyExamplesSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    // Apply remaining filters in memory
    if (constraints.length > 1) {
      storyExamplesList = storyExamplesList.filter(story => {
        return (filters.age === 'all' || story.age === filters.age) &&
               (filters.language === 'all' || story.language === filters.language) &&
               (filters.level === 'all' || story.level === filters.level);
      });
    }
    
    return storyExamplesList;
  } catch (error) {
    console.error("Error fetching filtered story examples:", error);
    throw error;
  }
};

/**
 * Get download URL for a story text file
 */
export const getStoryTextUrl = async (path) => {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error getting story text URL:", error);
    throw error;
  }
};

/**
 * Get download URL for a story audio file
 */
export const getStoryAudioUrl = async (path) => {
  try {
    const storageRef = ref(storage, path);
    return await getDownloadURL(storageRef);
  } catch (error) {
    console.error("Error getting story audio URL:", error);
    throw error;
  }
}; 
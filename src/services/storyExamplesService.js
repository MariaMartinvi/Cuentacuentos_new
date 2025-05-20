import { collection, getDocs, query, where, limit, doc, updateDoc } from "firebase/firestore";
import { ref, getDownloadURL, getBlob, getBytes, getMetadata, uploadString } from "firebase/storage";
import { db, storage, withRetry, withTimeout, getPublicUrl } from "../firebase/config";
import { fetchThroughProxy } from "./proxyService";
import { getStoryTextWithCache, getStoryAudioWithCache, getStoryImageWithCache } from "./resourceCacheService";

/**
 * Mock stories for fallback content when Firebase files can't be accessed
 */
const MOCK_STORIES = {
  'dragon-no-volar.txt': `El dragón que no podía volar

Había una vez un pequeño dragón llamado Puff que vivía en las montañas azules. A diferencia de otros dragones, Puff tenía un problema: no podía volar. Sus alas eran demasiado pequeñas y por más que lo intentaba, no lograba elevarse del suelo.

Todos los días, Puff observaba a los otros dragones volar alto en el cielo, haciendo piruetas y jugando entre las nubes. Se sentía muy triste porque quería jugar con ellos, pero no podía.

Un día, mientras caminaba por el bosque, Puff encontró a una pequeña niña que estaba perdida. La niña lloraba porque no podía encontrar el camino a su casa.

"No llores", le dijo Puff. "Yo te ayudaré a encontrar tu casa".

La niña se sorprendió al ver un dragón tan amable. Juntos caminaron por el bosque, y Puff usó su excelente sentido del olfato para seguir el rastro hasta la aldea donde vivía la niña.

Cuando llegaron, todos los habitantes del pueblo estaban asombrados. ¡Un dragón había ayudado a la niña! Estaban tan agradecidos que organizaron una gran fiesta para Puff.

Durante la fiesta, Puff se dio cuenta de algo importante: aunque no podía volar como los otros dragones, tenía otras habilidades especiales. Era amable, valiente y tenía un gran sentido del olfato que le permitía ayudar a los demás.

Desde ese día, Puff ya no se sintió triste por no poder volar. Había encontrado su propio camino para ser feliz y ayudar a los demás. Y así, el dragón que no podía volar se convirtió en el dragón más querido de todas las montañas azules.

Fin`,

  'dragon-share.txt': `El dragón que aprendió a compartir

Había una vez un dragón llamado Draco que vivía en una cueva llena de tesoros. Draco era muy rico y tenía montañas de oro, joyas y piedras preciosas. Pero a pesar de tener tanto, Draco era muy egoísta y nunca compartía nada con nadie.

Un día, una pequeña ardilla llamada Nuez llegó a la cueva de Draco. Estaba hambrienta y cansada después de un largo viaje.

"Por favor, señor dragón", dijo Nuez, "¿podrías compartir un poco de tu comida conmigo? He estado viajando todo el día y no he encontrado nada para comer".

Draco se rió y dijo: "¡No! Todo esto es mío y no pienso compartirlo con nadie".

Nuez se fue triste, pero antes de irse, dejó caer una pequeña bellota. Draco la vio y pensó: "¿Qué es esto? Es solo una pequeña bellota, no es nada comparado con mis tesoros".

Pero con el tiempo, la bellota creció y se convirtió en un hermoso roble. El árbol dio sombra a la cueva de Draco y sus hojas hacían que el aire fuera más fresco. Además, atrajo a muchos animales que se hicieron amigos de Draco.

Draco se dio cuenta de que al compartir, había recibido algo mucho más valioso que sus tesoros: amigos y felicidad. Desde ese día, Draco cambió y comenzó a compartir sus tesoros con todos los animales del bosque.

Y así, el dragón que aprendió a compartir se convirtió en el dragón más feliz y querido de todo el reino.

Fin`
};

/**
 * Fetch all story examples from Firestore
 */
export const fetchStoryExamples = async () => {
  try {
    console.log("Iniciando fetchStoryExamples...");
    const storyExamplesRef = collection(db, "storyExamples");
    const storyExamplesSnapshot = await getDocs(storyExamplesRef);
    
    console.log(`Encontrados ${storyExamplesSnapshot.docs.length} documentos en la colección`);
    
    const storyExamplesList = storyExamplesSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Asegurarse de que los campos importantes existen
      const storyData = {
        id: doc.id,
        title: data.title || `Story ${doc.id}`,
        age: data.age || 'all',
        language: data.language || 'spanish',
        level: data.level || 'beginner',
        textPath: data.textPath || null,
        audioPath: data.audioPath || null,
        imagePath: data.imagePath || `images/${doc.id}.jpg`, // Add default imagePath if missing
        protagonista: data.protagonista || null,
        ...data // Preservar otros campos
      };
      
      console.log(`Documento ${doc.id}:`, {
        title: storyData.title,
        textPath: storyData.textPath,
        audioPath: storyData.audioPath,
        imagePath: storyData.imagePath,
        protagonista: storyData.protagonista
      });
      
      return storyData;
    });
    
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
    const storyExamplesRef = collection(db, "storyExamples");
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
    
    let storyExamplesQuery = storyExamplesRef;
    if (constraints.length > 0) {
      // Note: In production, you'd need to create composite indexes for multiple filters
      // For simplicity, we're applying only the first filter in Firestore
      // and then filtering the rest in memory
      storyExamplesQuery = query(storyExamplesRef, constraints[0]);
    }
    
    const storyExamplesSnapshot = await getDocs(storyExamplesQuery);
    let storyExamplesList = storyExamplesSnapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        title: data.title || `Story ${doc.id}`,
        age: data.age || 'all',
        language: data.language || 'spanish',
        level: data.level || 'beginner',
        textPath: data.textPath || null,
        audioPath: data.audioPath || null,
        imagePath: data.imagePath || `images/${doc.id}.jpg`,
        protagonista: data.protagonista || null,
        ...data // Preservar otros campos
      };
    });
    
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
    if (!path) {
      console.error("No path provided for story text");
      throw new Error("No path provided for story text");
    }
    
    // Normalize the path
    const normalizedPath = normalizeStoragePath(path);
    console.log(`Fetching text URL for path: ${path} (normalized: ${normalizedPath})`);
    
    // Try to get from cache first
    const textRef = ref(storage, normalizedPath);
    const url = await getDownloadURL(textRef);
    console.log(`Successfully retrieved URL for ${normalizedPath}`);
    return url;
  } catch (error) {
    console.error(`Error getting story text URL for path ${path}:`, error);
    throw error;
  }
};

/**
 * Fetch the content of a story text file directly through Firebase
 */
export const getStoryTextContent = async (path) => {
  try {
    if (!path) {
      console.error("[TEXT] No path provided for story text content");
      throw new Error("No path provided for story text content");
    }
    
    console.log(`[TEXT] === INICIANDO CARGA DE CONTENIDO DE TEXTO ===`);
    console.log(`[TEXT] Ruta original: ${path}`);
    
    // Normalize the path
    const normalizedPath = normalizeStoragePath(path);
    console.log(`[TEXT] Ruta normalizada: ${normalizedPath}`);
    
    // Extract the filename
    const filename = normalizedPath.split('/').pop();
    console.log(`[TEXT] Nombre de archivo: ${filename}`);
    
    // Try multiple methods to get REAL content from Firebase
    try {
      // Method 1: Try using getBytes directly (most reliable)
      console.log(`[TEXT] MÉTODO 1: Usando getBytes para ${normalizedPath}`);
      const textRef = ref(storage, normalizedPath);
      try {
        const bytes = await getBytes(textRef);
        const content = new TextDecoder().decode(bytes);
        console.log(`[TEXT] ✓ ÉXITO! Contenido obtenido vía getBytes, longitud: ${content.length} bytes`);
        console.log(`[TEXT] Vista previa: ${content.substring(0, 100)}...`);
        console.log(`[TEXT] === FIN DE CARGA (MÉTODO 1 EXITOSO) ===`);
        return content;
      } catch (bytesError) {
        console.warn(`[TEXT] ✗ Método 1 falló: ${bytesError.message}`);
      }

      // Method 2: Try getting the download URL and fetching with alt=media parameter
      console.log(`[TEXT] MÉTODO 2: Usando getDownloadURL + fetch para ${normalizedPath}`);
      try {
        const url = await getDownloadURL(textRef);
        // Ensure the URL has the alt=media parameter
        const contentUrl = url.includes('?') ? `${url}&alt=media` : `${url}?alt=media`;
        console.log(`[TEXT] URL de contenido: ${contentUrl}`);
        
        // Try direct fetch with no-cors mode
        try {
          console.log(`[TEXT] Intentando fetch directo con modo no-cors...`);
          const response = await fetch(contentUrl, { 
            mode: 'no-cors',
            credentials: 'omit',
            headers: {
              'Accept': 'text/plain',
              'Cache-Control': 'no-cache'
            }
          });
          
          if (response && response.ok) {
            const content = await response.text();
            if (content && content.length > 0) {
              console.log(`[TEXT] ✓ ÉXITO! Contenido obtenido vía fetch directo, longitud: ${content.length} bytes`);
              console.log(`[TEXT] Vista previa: ${content.substring(0, 100)}...`);
              console.log(`[TEXT] === FIN DE CARGA (MÉTODO 2 EXITOSO) ===`);
              return content;
            }
          }
        } catch (fetchError) {
          console.warn(`[TEXT] ✗ Fetch directo falló: ${fetchError.message}`);
        }
        
        // Use the proxy as fallback
        console.log(`[TEXT] Intentando fetch a través de proxy...`);
        const content = await fetchThroughProxy(contentUrl);
        
        if (content && content.length > 0) {
          console.log(`[TEXT] ✓ ÉXITO! Contenido obtenido vía proxy, longitud: ${content.length} bytes`);
          console.log(`[TEXT] Vista previa: ${content.substring(0, 100)}...`);
          console.log(`[TEXT] === FIN DE CARGA (MÉTODO 2 EXITOSO) ===`);
          return content;
        } else {
          console.warn(`[TEXT] ✗ Contenido vacío recibido del proxy`);
          throw new Error("Empty content received from proxy");
        }
      } catch (urlError) {
        console.warn(`[TEXT] ✗ Método 2 falló: ${urlError.message}`);
      }
      
      // If all methods fail, use mock content
      console.log(`[TEXT] ✗ Todos los métodos fallaron, usando contenido mock`);
      return MOCK_STORIES[filename] || `# ${filename}\n\nEste es un contenido de ejemplo generado automáticamente porque no se pudo cargar el archivo original.\n\nFin`;
    } catch (error) {
      console.error(`[TEXT] Error general obteniendo contenido de texto para ${path}:`, error);
      return `Error al cargar el contenido. Por favor, inténtelo de nuevo más tarde.`;
    }
  } catch (error) {
    console.error(`[TEXT] Error general obteniendo contenido de texto para ${path}:`, error);
    return `Error al cargar el contenido. Por favor, inténtelo de nuevo más tarde.`;
  }
};

/**
 * Verifica si un archivo existe en Firebase Storage
 */
const fileExistsInStorage = async (path) => {
  try {
    const storageRef = ref(storage, path);
    await getMetadata(storageRef);
    return true;
  } catch (error) {
    if (error.code === 'storage/object-not-found') {
      return false;
    }
    throw error;
  }
};

/**
 * Función de diagnóstico para verificar permisos en Firebase Storage
 */
export const checkStoragePermissions = async () => {
  try {
    console.log("Verificando permisos de Firebase Storage...");
    
    // Primero obtenemos las historias para verificar solo las rutas que realmente existen
    const stories = await fetchStoryExamples();
    
    // Recopilamos las rutas reales de las historias
    const pathsToCheck = [];
    
    stories.forEach(story => {
      if (story.textPath) pathsToCheck.push(story.textPath);
      if (story.audioPath) pathsToCheck.push(story.audioPath);
    });
    
    console.log(`Verificando ${pathsToCheck.length} rutas reales de archivos:`);
    pathsToCheck.forEach(path => console.log(`  - ${path}`));
    
    // Si no hay rutas que verificar, terminamos
    if (pathsToCheck.length === 0) {
      console.log("No hay rutas de archivos para verificar. Todas las historias usarán contenido de ejemplo.");
      return { status: 'warning', message: 'No hay rutas de archivos para verificar' };
    }
    
    const results = {};
    
    // Verificar cada ruta
    for (const path of pathsToCheck) {
      try {
        const normalizedPath = normalizeStoragePath(path);
        console.log(`Comprobando acceso a: ${path} (normalizado: ${normalizedPath})`);
        const storageRef = ref(storage, normalizedPath);
        
        // Intentar obtener la URL (solo para verificar permisos)
        await getDownloadURL(storageRef);
        
        // Si llegamos aquí, tenemos permisos de lectura
        results[path] = { status: 'success', message: 'Acceso permitido' };
        console.log(`✓ Acceso permitido a: ${normalizedPath}`);
      } catch (error) {
        results[path] = { 
          status: 'error', 
          code: error.code || 'unknown',
          message: error.message
        };
        console.error(`✗ Error accediendo a ${path}: ${error.code} - ${error.message}`);
      }
    }
    
    console.log("Resultado de verificación de permisos:", results);
    return results;
  } catch (error) {
    console.error("Error general verificando permisos:", error);
    throw error;
  }
};

/**
 * Normalizes the path of a file for Firebase Storage
 * Ensures it has the correct format even if it comes without a prefix
 */
const normalizeStoragePath = (path) => {
  if (!path) {
    console.warn('[PATH] ⚠ Ruta nula o vacía proporcionada');
    return null;
  }
  
  console.log(`[PATH] === NORMALIZANDO RUTA ===`);
  console.log(`[PATH] Ruta original: "${path}"`);
  
  // Clean the path of spaces and problematic characters
  let cleanPath = path.trim();
  console.log(`[PATH] Ruta sin espacios: "${cleanPath}"`);
  
  // Decode the URL if it's encoded
  try {
    // Check if the path is already decoded
    if (cleanPath.includes('%2F') || cleanPath.includes('%20')) {
      const decodedPath = decodeURIComponent(cleanPath);
      console.log(`[PATH] Ruta decodificada: "${decodedPath}" (desde "${cleanPath}")`);
      cleanPath = decodedPath;
    }
  } catch (e) {
    console.warn('[PATH] ⚠ Error decodificando ruta:', e);
  }
  
  // Remove any full URL if it was saved that way
  if (cleanPath.startsWith('http://') || cleanPath.startsWith('https://')) {
    console.log(`[PATH] La ruta contiene una URL completa, extrayendo nombre de archivo`);
    
    // Check if it's a Firebase Storage URL
    if (cleanPath.includes('firebasestorage.googleapis.com')) {
      console.log(`[PATH] URL de Firebase Storage detectada`);
      
      // Extract the path from the URL
      try {
        const url = new URL(cleanPath);
        const pathMatch = url.pathname.match(/\/o\/([^?]+)/);
        if (pathMatch && pathMatch[1]) {
          const encodedPath = pathMatch[1];
          const decodedPath = decodeURIComponent(encodedPath);
          console.log(`[PATH] Ruta extraída de URL de Firebase: "${decodedPath}"`);
          cleanPath = decodedPath;
        } else {
          // Extract just the filename from the URL as fallback
          const urlParts = cleanPath.split('/');
          const filenameWithQuery = urlParts[urlParts.length - 1];
          const filename = filenameWithQuery.split('?')[0];
          console.log(`[PATH] Nombre de archivo extraído: "${filename}"`);
          cleanPath = filename;
        }
      } catch (urlError) {
        console.warn('[PATH] ⚠ Error procesando URL:', urlError);
        // Extract just the filename from the URL as fallback
        const urlParts = cleanPath.split('/');
        cleanPath = urlParts[urlParts.length - 1].split('?')[0];
        console.log(`[PATH] Nombre de archivo extraído (fallback): "${cleanPath}"`);
      }
    } else {
      // For non-Firebase URLs, just extract the filename
      const urlParts = cleanPath.split('/');
      cleanPath = urlParts[urlParts.length - 1].split('?')[0];
      console.log(`[PATH] Nombre de archivo extraído de URL: "${cleanPath}"`);
    }
  }
  
  // Get the filename
  const filename = cleanPath.split('/').pop();
  console.log(`[PATH] Nombre de archivo: "${filename}"`);
  
  // Determine file type based on extension
  const extension = filename.split('.').pop().toLowerCase();
  const isText = extension === 'txt' || extension === 'json';
  const isAudio = extension === 'mp3' || extension === 'wav' || extension === 'ogg';
  console.log(`[PATH] Extensión: "${extension}", isText: ${isText}, isAudio: ${isAudio}`);
  
  // Check if the path already has the correct prefix
  if (cleanPath.startsWith('stories/') && isText) {
    console.log(`[PATH] ✓ La ruta ya tiene el prefijo correcto: "${cleanPath}"`);
    return cleanPath;
  }
  
  if (cleanPath.startsWith('audio/') && isAudio) {
    console.log(`[PATH] ✓ La ruta ya tiene el prefijo correcto: "${cleanPath}"`);
    return cleanPath;
  }
  
  // Add the appropriate directory prefix based on file type
  let normalizedPath = cleanPath;
  
  if (isText) {
    // Check if the path already contains the filename with no directory
    if (!cleanPath.includes('/') || cleanPath.indexOf('/') === cleanPath.lastIndexOf('/')) {
      normalizedPath = `stories/${filename}`;
      console.log(`[PATH] Ruta normalizada (texto): "${path}" -> "${normalizedPath}"`);
    }
  } else if (isAudio) {
    // Check if the path already contains the filename with no directory
    if (!cleanPath.includes('/') || cleanPath.indexOf('/') === cleanPath.lastIndexOf('/')) {
      normalizedPath = `audio/${filename}`;
      console.log(`[PATH] Ruta normalizada (audio): "${path}" -> "${normalizedPath}"`);
    }
  } else {
    console.log(`[PATH] Tipo de archivo no reconocido, manteniendo ruta limpia: "${cleanPath}"`);
  }
  
  console.log(`[PATH] === FIN DE NORMALIZACIÓN ===`);
  console.log(`[PATH] Resultado final: "${normalizedPath}"`);
  return normalizedPath;
};

/**
 * Función de diagnóstico para inspeccionar archivos en Firebase Storage
 */
export const inspectStorageFile = async (path) => {
  try {
    console.log("=== DIAGNÓSTICO DE ARCHIVO EN FIREBASE STORAGE ===");
    console.log(`Inspeccionando archivo: ${path}`);
    
    // Normalizar la ruta
    const normalizedPath = normalizeStoragePath(path);
    console.log(`Ruta normalizada: ${normalizedPath}`);
    
    // Obtener referencia al archivo
    const fileRef = ref(storage, normalizedPath);
    console.log("Referencia al archivo creada");
    
    // Intentar obtener metadatos
    try {
      console.log("Obteniendo metadatos...");
      const metadata = await getMetadata(fileRef);
      console.log("Metadatos obtenidos:", {
        contentType: metadata.contentType,
        size: metadata.size,
        fullPath: metadata.fullPath,
        name: metadata.name,
        bucket: metadata.bucket,
        generation: metadata.generation,
        timeCreated: metadata.timeCreated,
        updated: metadata.updated
      });
    } catch (metadataError) {
      console.error("Error obteniendo metadatos:", metadataError);
    }
    
    // Intentar obtener URL
    try {
      console.log("Obteniendo URL...");
      const url = await getDownloadURL(fileRef);
      console.log("URL obtenida:", url);
      
      // Intentar obtener contenido con fetch directo
      try {
        console.log("Intentando fetch directo a URL...");
        const response = await fetch(url);
        console.log("Respuesta fetch:", {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          type: response.type,
          url: response.url
        });
        
        if (response.ok) {
          const content = await response.text();
          console.log(`Contenido obtenido (${content.length} bytes)`);
          console.log("Vista previa:", content.substring(0, 100) + "...");
        }
      } catch (fetchError) {
        console.error("Error con fetch directo:", fetchError);
      }
      
      // Intentar obtener contenido con URL + alt=media
      try {
        console.log("Intentando fetch con alt=media...");
        const mediaUrl = url.includes('?') ? `${url}&alt=media` : `${url}?alt=media`;
        const response = await fetch(mediaUrl);
        console.log("Respuesta fetch con alt=media:", {
          ok: response.ok,
          status: response.status,
          statusText: response.statusText,
          headers: Object.fromEntries(response.headers.entries()),
          type: response.type,
          url: response.url
        });
        
        if (response.ok) {
          const content = await response.text();
          console.log(`Contenido obtenido con alt=media (${content.length} bytes)`);
          console.log("Vista previa:", content.substring(0, 100) + "...");
        }
      } catch (fetchMediaError) {
        console.error("Error con fetch alt=media:", fetchMediaError);
      }
    } catch (urlError) {
      console.error("Error obteniendo URL:", urlError);
    }
    
    // Intentar obtener bytes directamente
    try {
      console.log("Obteniendo bytes directamente...");
      const bytes = await getBytes(fileRef);
      const content = new TextDecoder().decode(bytes);
      console.log(`Bytes obtenidos (${bytes.length} bytes)`);
      console.log("Vista previa de contenido:", content.substring(0, 100) + "...");
    } catch (bytesError) {
      console.error("Error obteniendo bytes:", bytesError);
    }
    
    console.log("=== FIN DEL DIAGNÓSTICO ===");
  } catch (error) {
    console.error("Error general durante el diagnóstico:", error);
  }
};

/**
 * Get download URL for a story audio file
 */
export const getStoryAudioUrl = async (path) => {
  try {
    if (!path) {
      console.error("[AUDIO] No path provided for story audio");
      throw new Error("No path provided for story audio");
    }
    
    console.log(`[AUDIO] === INICIANDO CARGA DE AUDIO ===`);
    console.log(`[AUDIO] Ruta original: ${path}`);
    
    // Normalize the path
    const normalizedPath = normalizeStoragePath(path);
    console.log(`[AUDIO] Ruta normalizada: ${normalizedPath}`);
    
    // Extract the filename
    const filename = normalizedPath.split('/').pop();
    console.log(`[AUDIO] Nombre de archivo: ${filename}`);
    
    // Use cache service to get audio URL
    const url = await getStoryAudioWithCache(filename, normalizedPath, async () => {
      try {
        console.log(`[AUDIO] Intentando obtener URL de Firebase para: ${normalizedPath}`);
        const audioRef = ref(storage, normalizedPath);
        
        try {
          const url = await getDownloadURL(audioRef);
          console.log(`[AUDIO] ✓ ÉXITO! URL de audio obtenida: ${url}`);
          
          // Verificar que la URL es válida
          if (!url || typeof url !== 'string') {
            throw new Error("Invalid audio URL received");
          }
          
          // Verificar que la URL es accesible
          try {
            console.log(`[AUDIO] Verificando acceso a URL: ${url}`);
            const response = await fetch(url, {
              method: 'HEAD',
              mode: 'cors',
              credentials: 'omit'
            });
            
            if (!response.ok) {
              throw new Error(`URL not accessible: ${response.status} ${response.statusText}`);
            }
            
            console.log(`[AUDIO] ✓ URL verificada y accesible`);
            return url;
          } catch (fetchError) {
            console.warn(`[AUDIO] ⚠ Error verificando URL: ${fetchError.message}`);
            // Si hay un error de CORS, intentar con una URL mock
            if (fetchError.message.includes('CORS')) {
              console.log('[AUDIO] Error de CORS detectado, devolviendo URL mock');
              return `mock://${normalizedPath}`;
            }
            throw fetchError;
          }
        } catch (downloadError) {
          console.error(`[AUDIO] Error al obtener URL de descarga:`, downloadError);
          
          // Si hay un error de CORS, intentar con una URL mock
          if (downloadError.message && downloadError.message.includes('CORS')) {
            console.log('[AUDIO] Error de CORS detectado, devolviendo URL mock');
            return `mock://${normalizedPath}`;
          }
          
          throw downloadError;
        }
      } catch (error) {
        console.error(`[AUDIO] Error getting audio URL for ${path}:`, error);
        throw error;
      }
    });

    if (!url) {
      console.error(`[AUDIO] No se pudo obtener URL de audio para ${path}`);
      throw new Error("No audio URL received");
    }

    console.log(`[AUDIO] === FIN DE CARGA DE AUDIO ===`);
    return url;
  } catch (error) {
    console.error(`[AUDIO] Error general obteniendo URL de audio para ${path}:`, error);
    throw error;
  }
};

/**
 * Get download URL for a story image file
 */
export const getStoryImageUrl = async (path) => {
  try {
    if (!path) {
      console.error("[IMAGE] No path provided for story image");
      throw new Error("No path provided for story image");
    }
    
    console.log(`[IMAGE] === INICIANDO CARGA DE IMAGEN ===`);
    console.log(`[IMAGE] Ruta original: ${path}`);
    
    // Normalize the path
    const normalizedPath = normalizeStoragePath(path);
    console.log(`[IMAGE] Ruta normalizada: ${normalizedPath}`);
    
    // Extract the filename
    const filename = normalizedPath.split('/').pop();
    console.log(`[IMAGE] Nombre de archivo: ${filename}`);
    
    // Use cache service to get image URL
    return await getStoryImageWithCache(filename, normalizedPath, async () => {
      try {
        const imageRef = ref(storage, normalizedPath);
        const url = await getDownloadURL(imageRef);
        console.log(`[IMAGE] ✓ ÉXITO! URL de imagen obtenida: ${url}`);
        console.log(`[IMAGE] === FIN DE CARGA DE IMAGEN ===`);
        return url;
      } catch (error) {
        console.error(`[IMAGE] Error getting image URL for ${path}:`, error);
        throw error;
      }
    });
  } catch (error) {
    console.error(`[IMAGE] Error general obteniendo URL de imagen para ${path}:`, error);
    throw error;
  }
};

/**
 * Check if Firebase Storage is properly configured and accessible
 */
export const checkFirebaseStorage = async () => {
  try {
    console.log("[STORAGE] === CHECKING FIREBASE STORAGE CONFIGURATION ===");
    
    // 1. Check if storage bucket is configured
    const bucket = storage.app.options.storageBucket;
    if (!bucket) {
      console.error("[STORAGE] ✗ Storage bucket not configured in Firebase options");
      return {
        success: false,
        error: "Storage bucket not configured",
        details: { bucket: null }
      };
    }
    
    console.log(`[STORAGE] ✓ Storage bucket configured: ${bucket}`);
    
    // 2. Try to access a known test file
    try {
      console.log("[STORAGE] Attempting to access test file...");
      const testRef = ref(storage, 'test.txt');
      await getMetadata(testRef);
      console.log("[STORAGE] ✓ Successfully accessed test file");
    } catch (testError) {
      console.warn("[STORAGE] ⚠ Could not access test file:", testError.message);
      // This is not a critical error, as the test file might not exist
    }
    
    // 3. Try to list files in the images directory
    try {
      console.log("[STORAGE] Attempting to list files in images directory...");
      
      // Firebase Storage doesn't have a native list files function in the client SDK
      // We can only check if a specific file exists
      const imageRef = ref(storage, 'images/default-story.jpg');
      await getMetadata(imageRef);
      console.log("[STORAGE] ✓ Successfully accessed default image");
    } catch (listError) {
      console.error("[STORAGE] ✗ Could not access images directory:", listError.message);
      return {
        success: false,
        error: "Could not access images directory",
        details: { message: listError.message, code: listError.code }
      };
    }
    
    // 4. Check CORS configuration
    console.log("[STORAGE] Checking CORS configuration...");
    try {
      const corsTestUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket}/o/test.txt?alt=media`;
      const corsResponse = await fetch(corsTestUrl, { 
        method: 'HEAD',
        mode: 'cors'
      });
      
      if (corsResponse.ok) {
        console.log("[STORAGE] ✓ CORS appears to be configured correctly");
      } else {
        console.warn("[STORAGE] ⚠ CORS test returned non-OK status:", corsResponse.status);
      }
    } catch (corsError) {
      console.warn("[STORAGE] ⚠ CORS test failed:", corsError.message);
      // This is not a critical error, as it might be due to the test file not existing
    }
    
    console.log("[STORAGE] === FIREBASE STORAGE CHECK COMPLETED ===");
    return {
      success: true,
      details: { bucket }
    };
  } catch (error) {
    console.error("[STORAGE] ✗ Error checking Firebase Storage:", error);
    return {
      success: false,
      error: error.message,
      details: { message: error.message, code: error.code, stack: error.stack }
    };
  }
};

/**
 * Create story images in Firebase Storage
 */
export const createStoryImages = async () => {
  try {
    console.log("[IMAGES] === CREATING STORY IMAGES IN FIREBASE STORAGE ===");
    const results = [];
    
    // List of stories that need images
    const storiesToCreate = [
      { id: 'dragon-no-volar', title: 'El dragón que no podía volar', color: '#4361ee' },
      { id: 'dragon-share', title: 'The Dragon Learning to Share', color: '#e63946' },
      { id: 'princesa-valiente', title: 'La princesa valiente', color: '#2a9d8f' },
      { id: 'magic-forest', title: 'The Magic Forest', color: '#588157' },
      { id: 'default-story', title: 'Default Story', color: '#6c757d' }
    ];
    
    // Create images for each story
    for (const story of storiesToCreate) {
      try {
        console.log(`[IMAGES] Creating image for story: ${story.id}`);
        
        // Create a simple SVG image as a data URL with the story title
        const svgContent = `
          <svg xmlns="http://www.w3.org/2000/svg" width="800" height="400" viewBox="0 0 800 400">
            <rect width="800" height="400" fill="${story.color}"/>
            <rect x="10" y="10" width="780" height="380" fill="white" opacity="0.1" rx="20" ry="20"/>
            <text x="50%" y="45%" font-family="Arial" font-size="36" text-anchor="middle" dominant-baseline="middle" fill="white" font-weight="bold">
              ${story.title}
            </text>
            <text x="50%" y="60%" font-family="Arial" font-size="24" text-anchor="middle" dominant-baseline="middle" fill="white">
              Story ID: ${story.id}
            </text>
            <text x="50%" y="75%" font-family="Arial" font-size="18" text-anchor="middle" dominant-baseline="middle" fill="white" opacity="0.7">
              Created: ${new Date().toISOString().split('T')[0]}
            </text>
          </svg>
        `;
        
        const dataUrl = `data:image/svg+xml;base64,${btoa(unescape(encodeURIComponent(svgContent)))}`;
        
        // Upload the SVG to Firebase Storage
        const imagePath = `images/${story.id}.jpg`;
        const imageRef = ref(storage, imagePath);
        
        console.log(`[IMAGES] Uploading image to ${imagePath}...`);
        await uploadString(imageRef, dataUrl, 'data_url');
        console.log(`[IMAGES] ✓ Image for ${story.id} uploaded successfully`);
        
        // Get the download URL
        const downloadUrl = await getDownloadURL(imageRef);
        console.log(`[IMAGES] ✓ Image URL for ${story.id}: ${downloadUrl}`);
        
        results.push({
          id: story.id,
          path: imagePath,
          url: downloadUrl,
          success: true
        });
      } catch (storyError) {
        console.error(`[IMAGES] ✗ Error creating image for ${story.id}:`, storyError);
        results.push({
          id: story.id,
          error: storyError.message,
          success: false
        });
      }
    }
    
    console.log("[IMAGES] === STORY IMAGES CREATION COMPLETED ===");
    return {
      success: results.some(r => r.success),
      results: results
    };
  } catch (error) {
    console.error("[IMAGES] ✗ Error creating story images:", error);
    return {
      success: false,
      error: error.message,
      details: { message: error.message, code: error.code, stack: error.stack }
    };
  }
};

/**
 * Fetch only story metadata without loading full content
 * This is used for initial load to improve performance
 */
export const fetchStoryMetadata = async () => {
  try {
    console.log("Iniciando fetchStoryMetadata...");
    const storyExamplesRef = collection(db, "storyExamples");
    const storyExamplesSnapshot = await getDocs(storyExamplesRef);
    
    console.log(`Encontrados ${storyExamplesSnapshot.docs.length} documentos en la colección`);
    
    // Log all fields for each document with more visible formatting
    console.log("=== DETALLES DE DOCUMENTOS ===");
    storyExamplesSnapshot.docs.forEach(doc => {
      const data = doc.data();
      console.log(`\nDocumento ${doc.id}:`, {
        title: data.title,
        age: data.age,
        language: data.language,
        level: data.level,
        textPath: data.textPath,
        audioPath: data.audioPath,
        imagePath: data.imagePath,
        protagonista: data.protagonista,
        allFields: Object.keys(data)
      });
      
      // Specifically check for protagonista field
      if (data.protagonista) {
        console.log(`✓ Documento ${doc.id} tiene protagonista: "${data.protagonista}"`);
      } else {
        console.log(`✗ Documento ${doc.id} NO tiene campo protagonista`);
      }
    });
    console.log("=== FIN DE DETALLES DE DOCUMENTOS ===\n");
    
    const storyMetadataList = storyExamplesSnapshot.docs.map(doc => {
      const data = doc.data();
      
      // Solo incluimos los metadatos básicos necesarios para la vista inicial
      return {
        id: doc.id,
        title: data.title || `Story ${doc.id}`,
        age: data.age || 'all',
        language: data.language || 'spanish',
        level: data.level || 'beginner',
        textPath: data.textPath || null,
        audioPath: data.audioPath || null,
        imagePath: data.imagePath || `images/${doc.id}.jpg`,
        protagonista: data.protagonista || null, // Only use the value from Firebase, no defaults
      };
    });
    
    // Log the final metadata list with protagonista field highlighted
    console.log("=== LISTA FINAL DE METADATOS ===");
    storyMetadataList.forEach(story => {
      console.log(`\nStory ${story.id}:`, {
        title: story.title,
        protagonista: story.protagonista || "NO TIENE PROTAGONISTA",
        allFields: Object.keys(story)
      });
    });
    console.log("=== FIN DE LISTA DE METADATOS ===\n");
    
    return storyMetadataList;
  } catch (error) {
    console.error("Error fetching story metadata:", error);
    throw error;
  }
};

/**
 * Update a story with a protagonista field for testing
 */
export const addProtagonistaToStory = async (storyId, protagonista) => {
  try {
    console.log(`Añadiendo protagonista "${protagonista}" a la historia con ID: ${storyId}...`);
    
    const storyRef = doc(db, "storyExamples", storyId);
    await updateDoc(storyRef, {
      protagonista: protagonista
    });
    
    console.log(`✓ Protagonista añadido correctamente a la historia ${storyId}`);
    return true;
  } catch (error) {
    console.error(`Error añadiendo protagonista a la historia ${storyId}:`, error);
    return false;
  }
}; 
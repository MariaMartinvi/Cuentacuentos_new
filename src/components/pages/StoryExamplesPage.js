import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './StoryExamplesPage.css';
import SEO from '../SEO';
import { 
  getStoryTextUrl, 
  getStoryAudioUrl, 
  getStoryTextContent,
  checkStoragePermissions,
  inspectStorageFile,
  getStoryImageUrl
} from '../../services/storyExamplesService';
import { getStoriesWithCache, refreshStoriesCache } from '../../services/cacheService';
import { Spinner } from 'react-bootstrap';
import AudioPlayer from '../AudioPlayer';
import RetryButton from '../RetryButton';

// Mock data for when Firebase data can't be loaded
const MOCK_STORIES = [
  {
    id: 'dragon-no-volar',
    title: 'El dragón que no podía volar',
    age: '3to5',
    language: 'spanish',
    level: 'beginner',
    textPath: 'stories/dragon-no-volar.txt',
    audioPath: 'audio/dragon-no-volar.mp3',
    imagePath: 'images/dragon-no-volar.jpg'
  },
  {
    id: 'princesa-valiente',
    title: 'La princesa valiente',
    age: '6to8',
    language: 'spanish',
    level: 'intermediate',
    textPath: 'stories/princesa-valiente.txt',
    audioPath: 'audio/princesa-valiente.mp3',
    imagePath: 'images/princesa-valiente.jpg'
  },
  {
    id: 'magic-forest',
    title: 'The Magic Forest',
    age: '6to8',
    language: 'english',
    level: 'beginner',
    textPath: 'stories/magic-forest.txt',
    audioPath: 'audio/magic-forest.mp3',
    imagePath: 'images/magic-forest.jpg'
  },
  {
    id: 'dragon-share',
    title: 'The Dragon Learning to Share',
    age: '3to5',
    language: 'english',
    level: 'beginner',
    textPath: 'stories/dragon-share.txt',
    audioPath: 'audio/dragon-share.mp3',
    imagePath: 'images/dragon-share.jpg'
  }
];

// Story modal component
const StoryModal = ({ isOpen, onClose, title, content, audioUrl, showAudio, usingMockContent, imageUrl }) => {
  const { t } = useTranslation();
  
  if (!isOpen) return null;

  // Format the story text to display properly
  const formatStoryContent = (text) => {
    if (!text) {
      console.log("No content provided to format");
      return (
        <div className="story-content">
          <h1>{title}</h1>
          <p>No story content available.</p>
        </div>
      );
    }
    
    console.log("Formatting story content for:", title);
    console.log("Content length:", text.length);
    console.log("Content preview:", text.substring(0, 100) + '...');
    
    // Split by new lines and convert to paragraphs
    const paragraphs = text.split('\n').filter(p => p.trim() !== '');
    console.log("Number of paragraphs:", paragraphs.length);
    if (paragraphs.length > 0) {
      console.log("First paragraph:", paragraphs[0]);
    }
    
    // If we have at least one paragraph
    if (paragraphs.length > 0) {
      return (
        <div className="story-content">
          <h1>{title}</h1>
          {imageUrl && (
            <div className="story-modal-image-container">
              <img 
                src={imageUrl} 
                alt={title} 
                className="story-modal-image" 
                onError={(e) => {
                  console.error(`Error loading image in modal`);
                  // Try to load default image
                  e.target.src = 'https://firebasestorage.googleapis.com/v0/b/cuentacuentos-b2e64.appspot.com/o/images%2Fdefault-story.jpg?alt=media';
                  e.target.onerror = null; // Prevent infinite loop if default also fails
                }} 
              />
            </div>
          )}
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
      );
    } else {
      // If we couldn't parse paragraphs, just display the text as is
      return (
        <div className="story-content">
          <h1>{title}</h1>
          {imageUrl && (
            <div className="story-modal-image-container">
              <img 
                src={imageUrl} 
                alt={title} 
                className="story-modal-image" 
                onError={(e) => {
                  console.error(`Error loading image in modal`);
                  // Try to load default image
                  e.target.src = 'https://firebasestorage.googleapis.com/v0/b/cuentacuentos-b2e64.appspot.com/o/images%2Fdefault-story.jpg?alt=media';
                  e.target.onerror = null; // Prevent infinite loop if default also fails
                }} 
              />
            </div>
          )}
          <p>{text}</p>
        </div>
      );
    }
  };

  // Prevent clicks inside the modal from closing it
  const handleModalClick = (e) => {
    e.stopPropagation();
  };

  // Handle close button click with stopPropagation
  const handleCloseClick = (e) => {
    e.stopPropagation();
    onClose();
  };

  console.log(`Renderizando modal para: ${title}, showAudio: ${showAudio}, tiene audio: ${!!audioUrl}, longitud de contenido: ${content ? content.length : 0}`);
  
  // Process audio URL to ensure it's in the correct format
  const processedAudioUrl = showAudio && audioUrl ? 
    (typeof audioUrl === 'string' ? 
      { 
        url: audioUrl.includes('alt=media') ? audioUrl : (audioUrl.includes('?') ? `${audioUrl}&alt=media` : `${audioUrl}?alt=media`), 
        useProxy: false 
      } : 
      { 
        url: audioUrl.url.includes('alt=media') ? audioUrl.url : (audioUrl.url.includes('?') ? `${audioUrl.url}&alt=media` : `${audioUrl.url}?alt=media`), 
        useProxy: false 
      }) : 
    null;
  
  if (showAudio) {
    console.log('Audio URL for modal:', processedAudioUrl);
  }

  return (
    <div className="story-modal-overlay" onClick={onClose}>
      <div className="story-modal" onClick={handleModalClick}>
        <button className="story-modal-close" onClick={handleCloseClick}>&times;</button>
        
        {/* Mostrar indicador de contenido de ejemplo si corresponde */}
        {usingMockContent && (
          <div className="mock-content-banner">
            <span className="mock-badge">{t('storyExamples.mockContent.badge')}</span>
            <p>{t('storyExamples.mockContent.explanation')}</p>
          </div>
        )}
        
        {/* Show story content only when not in audio mode */}
        {!showAudio && formatStoryContent(content)}
        
        {/* Show audio player when in audio mode */}
        {showAudio && (
          <div className="audio-mode-container">
            <h1>{title}</h1>
            {imageUrl && (
              <div className="story-modal-image-container">
                <img 
                  src={imageUrl} 
                  alt={title} 
                  className="story-modal-image" 
                  onError={(e) => {
                    console.error(`Error loading image in modal`);
                    // Try to load default image
                    e.target.src = 'https://firebasestorage.googleapis.com/v0/b/cuentacuentos-b2e64.appspot.com/o/images%2Fdefault-story.jpg?alt=media';
                    e.target.onerror = null; // Prevent infinite loop if default also fails
                  }} 
                />
              </div>
            )}
            {processedAudioUrl && processedAudioUrl.url !== '#' && (
              <AudioPlayer audioUrl={processedAudioUrl} title={title} />
            )}
            {(!processedAudioUrl || processedAudioUrl.url === '#') && (
              <div className="audio-not-available">
                <p>{t('storyExamples.audioNotAvailable')}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

const StoryCard = ({ story, t, useMockData = false }) => {
  console.log(`Renderizando StoryCard para: ${story.id}, useMockData: ${useMockData}`);
  
  const [textUrl, setTextUrl] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [storyContent, setStoryContent] = useState('');
  const [showAudio, setShowAudio] = useState(false);
  const [usingMockContent, setUsingMockContent] = useState(true); // Por defecto asumimos que usaremos mock
  const [isRetrying, setIsRetrying] = useState(false);

  // Use different mock stories for each story ID
  const getMockStoryContent = () => {
    console.log(`Obteniendo contenido mock para: ${story.id}`);
    switch(story.id) {
      case 'dragon-no-volar':
        return `Había una vez un pequeño dragón llamado Puff que vivía en las montañas azules. A diferencia de otros dragones, Puff tenía un problema: no podía volar. Sus alas eran demasiado pequeñas y por más que lo intentaba, no lograba elevarse del suelo.

Todos los días, Puff observaba a los otros dragones volar alto en el cielo, haciendo piruetas y jugando entre las nubes. Se sentía muy triste porque quería jugar con ellos, pero no podía.

Un día, mientras caminaba por el bosque, Puff encontró a una pequeña niña que estaba perdida. La niña lloraba porque no podía encontrar el camino a su casa.

"No llores", le dijo Puff. "Yo te ayudaré a encontrar tu casa".

La niña se sorprendió al ver un dragón tan amable. Juntos caminaron por el bosque, y Puff usó su excelente sentido del olfato para seguir el rastro hasta la aldea donde vivía la niña.

Cuando llegaron, todos los habitantes del pueblo estaban asombrados. ¡Un dragón había ayudado a la niña! Estaban tan agradecidos que organizaron una gran fiesta para Puff.

Durante la fiesta, Puff se dio cuenta de algo importante: aunque no podía volar como los otros dragones, tenía otras habilidades especiales. Era amable, valiente y tenía un gran sentido del olfato que le permitía ayudar a los demás.

Desde ese día, Puff ya no se sintió triste por no poder volar. Había encontrado su propio camino para ser feliz y ayudar a los demás. Y así, el dragón que no podía volar se convirtió en el dragón más querido de todas las montañas azules.

Fin`;
      case 'princesa-valiente':
        return `Había una vez una princesa llamada Elena que vivía en un reino lejano. A diferencia de otras princesas, a Elena no le gustaban los vestidos elegantes ni las fiestas del palacio. Ella prefería explorar el bosque, trepar a los árboles y aprender a usar la espada.

El rey y la reina estaban preocupados por su hija. "Una princesa debe comportarse como tal", le decían. Pero Elena tenía otros planes.

Un día, un terrible dragón llegó al reino y comenzó a aterrorizar a los aldeanos. El rey envió a sus mejores caballeros para derrotar a la bestia, pero todos fallaron.

"Yo puedo derrotar al dragón", dijo Elena a su padre. El rey se rió. "Eres solo una niña", respondió. Pero Elena estaba decidida.

Esa noche, tomó la armadura de un caballero, una espada y partió hacia la cueva del dragón. Cuando llegó, no atacó de inmediato. En cambio, observó al dragón y notó algo extraño: tenía una espina clavada en su pata que le causaba dolor.

Con mucho cuidado, Elena se acercó al dragón. "No te haré daño", le dijo. "Quiero ayudarte". El dragón, aunque asustado, permitió que Elena le quitara la espina.

El dragón estaba tan agradecido que prometió no volver a molestar al reino. Elena regresó al castillo montada sobre el lomo del dragón, sorprendiendo a todos.

El rey y la reina finalmente entendieron que su hija era valiente y sabia a su manera. Desde ese día, Elena fue conocida como la princesa valiente, y cuando creció, se convirtió en la mejor gobernante que el reino había tenido jamás.

Fin`;
      case 'magic-forest':
        return `Once upon a time, there was a small village at the edge of a mysterious forest. The villagers called it the Magic Forest because strange things happened to anyone who entered.

In the village lived a curious boy named Oliver. He always wondered what secrets the forest held, but his parents had forbidden him from going there.

One day, Oliver's little sister, Lily, wandered into the forest while chasing a butterfly. When she didn't return by sunset, Oliver knew he had to find her, despite his fears.

As Oliver entered the forest, the trees seemed to whisper and the path changed behind him. He called out for Lily, but only heard the echo of his own voice.

Suddenly, he met a talking fox with bright blue eyes. "Are you lost, human child?" asked the fox.

"I'm looking for my sister," Oliver replied. "She's small with blonde hair and a red dress."

"I've seen her," said the fox. "Follow me, but remember: in the Magic Forest, things are not always what they seem."

The fox led Oliver deeper into the forest, where they encountered magical creatures: fairies that glowed like fireflies, trees that could walk, and flowers that sang sweet melodies.

Finally, they found Lily playing with a group of forest sprites near a crystal-clear pond. She was having so much fun that she hadn't realized how late it was.

"Oliver!" she exclaimed. "This place is wonderful!"

The fox explained that the forest only revealed its magic to those with pure hearts and good intentions. "That's why your sister could see the beauty of our home," said the fox.

Oliver and Lily promised to keep the forest's secret and returned home. From that day on, they would sometimes visit their friends in the Magic Forest, always returning with smiles on their faces but never revealing what made them so happy.

The End`;
      case 'dragon-share':
        return `Once upon a time, in a cave at the top of a misty mountain, lived a young dragon named Ember. Ember had the most magnificent collection of treasures in all the land. He had golden coins, sparkling jewels, and magical artifacts that he had collected over many years.

Ember loved his treasures more than anything. He would spend hours arranging them, counting them, and admiring their beauty. But despite all his riches, Ember felt lonely. No other creatures ever visited him because they were afraid of dragons, especially dragons with treasure.

One rainy day, Ember heard a small sound at the entrance of his cave. It was a little fox who was soaking wet and shivering from the cold. The fox had gotten lost in the storm and needed shelter.

"Please," said the fox, "may I stay in your cave until the storm passes?"

Ember's first instinct was to protect his treasure. "What if you try to steal something?" he asked suspiciously.

"I don't want your treasure," replied the fox. "I just need a warm, dry place to rest."

Reluctantly, Ember allowed the fox to stay, but he kept a watchful eye on his treasures.

As the storm continued, more animals sought refuge in the cave: a rabbit, a squirrel, and even a small bear. Ember was uncomfortable with so many visitors, but he let them stay.

The animals were grateful and began to share their own treasures with Ember. The rabbit shared fresh berries, the squirrel offered nuts, and the bear knew wonderful stories. For the first time, Ember realized there were treasures that couldn't be collected or hoarded.

When the storm finally ended, Ember surprised himself by feeling sad that his new friends would leave. "You can visit anytime," he told them, "and I'll share my cave with you."

From that day on, Ember's cave became a place where animals would gather to share food, stories, and friendship. And though Ember still loved his golden treasures, he discovered that the greatest treasure of all was having friends to share them with.

The End`;
      default:
        // For any other story ID, use a generic mock story
        return `Esta es una historia de ejemplo para ${story.title}.

El contenido real se cargará desde Firebase cuando esté disponible.

Fin`;
    }
  };

  // Get the appropriate mock story content based on the story ID
  const MOCK_STORY = getMockStoryContent();
  
  // Función para cargar el contenido
  const loadContent = async () => {
    try {
      setLoading(true);
      
      let contentLoaded = false;
      let audioLoaded = false;
      
      console.log(`[${story.id}] === INICIANDO CARGA DE CONTENIDO REAL ===`);
      console.log(`[${story.id}] ID: ${story.id}, Título: ${story.title}`);
      console.log(`[${story.id}] Ruta de texto: ${story.textPath || 'No definida'}`);
      console.log(`[${story.id}] Ruta de audio: ${story.audioPath || 'No definida'}`);
      console.log(`[${story.id}] Ruta de imagen: ${story.imagePath || 'No definida'}`);
      
      // 1. CARGAR TEXTO
      if (story.textPath) {
        try {
          console.log(`[${story.id}] INTENTANDO CARGAR TEXTO desde: ${story.textPath}`);
          
          // Método 1: getStoryTextContent (directo)
          try {
            console.log(`[${story.id}] Método 1: Usando getStoryTextContent directo`);
            const content = await getStoryTextContent(story.textPath);
            
            // Verificar si es contenido mock
            const filename = story.textPath.split('/').pop();
            const mockContent = MOCK_STORIES[filename];
            const isMockContent = mockContent && content === mockContent;
            
            if (content && content.trim().length > 0) {
              if (isMockContent) {
                console.warn(`[${story.id}] ⚠ El contenido obtenido es MOCK`);
                setUsingMockContent(true);
              } else {
                console.log(`[${story.id}] ✓ Texto REAL cargado (${content.length} bytes)`);
                console.log(`[${story.id}] Vista previa: ${content.substring(0, 100)}...`);
                setUsingMockContent(false);
              }
              setStoryContent(content);
              contentLoaded = true;
              console.log(`[${story.id}] ✓ Contenido establecido`);
            } else {
              console.warn(`[${story.id}] ✗ Contenido vacío o inválido`);
            }
          } catch (method1Error) {
            console.error(`[${story.id}] ✗ Error con método 1:`, method1Error);
            
            // Método 2: getStoryTextUrl + fetch
            try {
              console.log(`[${story.id}] Método 2: Usando getStoryTextUrl + fetch`);
              const urlResponse = await getStoryTextUrl(story.textPath);
              
              if (urlResponse) {
                let url;
                let isMockUrl = false;
                
                if (typeof urlResponse === 'object' && urlResponse.url) {
                  url = urlResponse.url;
                  console.log(`[${story.id}] URL obtenida (objeto): ${url}`);
                } else if (typeof urlResponse === 'string') {
                  url = urlResponse;
                  isMockUrl = url.startsWith('mock://');
                  console.log(`[${story.id}] URL obtenida (string): ${url}, esMock: ${isMockUrl}`);
                }
                
                if (url && !isMockUrl) {
                  // Asegurarse de que la URL tiene el parámetro alt=media
                  const contentUrl = url.includes('?') ? 
                    (url.includes('alt=media') ? url : `${url}&alt=media`) : 
                    `${url}?alt=media`;
                  
                  console.log(`[${story.id}] Intentando fetch directo a URL REAL: ${contentUrl}`);
                  
                  try {
                    const response = await fetch(contentUrl);
                    if (response.ok) {
                      const content = await response.text();
                      if (content && content.trim().length > 0) {
                        console.log(`[${story.id}] ✓ Texto REAL cargado por fetch (${content.length} bytes)`);
                        console.log(`[${story.id}] Vista previa: ${content.substring(0, 100)}...`);
                        setStoryContent(content);
                        setUsingMockContent(false);
                        contentLoaded = true;
                        console.log(`[${story.id}] ✓ Contenido REAL establecido por fetch`);
                      } else {
                        console.warn(`[${story.id}] ✗ Contenido vacío o inválido por fetch`);
                      }
                    } else {
                      console.warn(`[${story.id}] ✗ Respuesta no válida: ${response.status}`);
                    }
                  } catch (fetchError) {
                    console.error(`[${story.id}] ✗ Error con fetch:`, fetchError);
                  }
                } else if (isMockUrl) {
                  console.warn(`[${story.id}] ⚠ Se obtuvo URL MOCK: ${url}`);
                } else {
                  console.warn(`[${story.id}] ✗ URL no válida`);
                }
              } else {
                console.warn(`[${story.id}] ✗ No se pudo obtener URL`);
              }
            } catch (method2Error) {
              console.error(`[${story.id}] ✗ Error con método 2:`, method2Error);
            }
          }
        } catch (textError) {
          console.error(`[${story.id}] Error general al cargar texto:`, textError);
        }
      } else {
        console.warn(`[${story.id}] No hay ruta de texto definida`);
      }
      
      // 2. CARGAR AUDIO
      if (story.audioPath) {
        try {
          console.log(`[${story.id}] INTENTANDO CARGAR AUDIO desde: ${story.audioPath}`);
          const urlResponse = await getStoryAudioUrl(story.audioPath);
          
          if (urlResponse) {
            let isMockAudio = false;
            
            // Verificar formato de respuesta
            if (typeof urlResponse === 'object' && urlResponse.url) {
              const url = urlResponse.url;
              console.log(`[${story.id}] ✓ URL de audio obtenida (objeto): ${url}`);
              setAudioUrl(url);
              audioLoaded = true;
            } else if (typeof urlResponse === 'string') {
              isMockAudio = urlResponse.startsWith('mock://');
              console.log(`[${story.id}] ✓ URL de audio obtenida (string): ${urlResponse}, esMock: ${isMockAudio}`);
              setAudioUrl(urlResponse);
              audioLoaded = !isMockAudio;
            } else {
              console.warn(`[${story.id}] Formato de respuesta de audio no reconocido:`, urlResponse);
              setAudioUrl('#');
            }
            
            if (isMockAudio) {
              console.warn(`[${story.id}] ⚠ Se está usando URL de audio MOCK`);
            } else if (audioLoaded) {
              console.log(`[${story.id}] ✓ URL de audio REAL establecida`);
            }
          } else {
            console.warn(`[${story.id}] ✗ No se pudo obtener URL de audio`);
          }
        } catch (audioError) {
          console.error(`[${story.id}] Error al cargar audio:`, audioError);
        }
      } else {
        console.warn(`[${story.id}] No hay ruta de audio definida`);
      }
      
      // 3. CARGAR IMAGEN
      if (story.imagePath) {
        console.log(`[${story.id}] INTENTANDO CARGAR IMAGEN desde: ${story.imagePath}`);
        try {
          const url = await getStoryImageUrl(story.imagePath);
          console.log(`[${story.id}] ✓ URL de imagen obtenida: ${url}`);
          setImageUrl(url);
        } catch (imageError) {
          console.error(`[${story.id}] Error al cargar la imagen: ${imageError.message}`);
          // Don't set error state for image loading failures
        }
      } else {
        console.warn(`[${story.id}] No hay ruta de imagen definida`);
      }
      
      // ESTABLECER ESTADO FINAL
      if (!contentLoaded) {
        console.warn(`[${story.id}] ⚠ NO SE PUDO CARGAR CONTENIDO REAL, usando contenido MOCK`);
        setStoryContent(MOCK_STORY);
        setUsingMockContent(true);
      }
      
      if (!audioLoaded) {
        console.warn(`[${story.id}] ⚠ NO SE PUDO CARGAR AUDIO REAL, usando URL fallback`);
        setAudioUrl('#');
      }
      
      console.log(`[${story.id}] === FIN DE CARGA DE CONTENIDO ===`);
      console.log(`[${story.id}] Resultado: usandoMock=${!contentLoaded}, audioReal=${audioLoaded}`);
      
      setLoading(false);
      setError(null);
    } catch (error) {
      console.error(`[${story.id}] ERROR CRÍTICO al cargar contenido:`, error);
      setError(error);
      setLoading(false);
      
      // En caso de error, usar contenido mock como fallback
      setStoryContent(MOCK_STORY);
      setUsingMockContent(true);
      setAudioUrl('#');
    }
  };
  
  // Función para reintentar la carga
  const handleRetry = () => {
    setIsRetrying(true);
    loadContent().finally(() => {
      setIsRetrying(false);
    });
  };

  // Cargar al montar
  useEffect(() => {
    loadContent();
  }, [story, useMockData]);

  const openTextModal = (e) => {
    e.preventDefault();
    console.log(`Abriendo modal de texto para: ${story.id}`);
    console.log(`Contenido actual: ${storyContent ? storyContent.substring(0, 50) + '...' : 'Vacío'}`);
    setShowAudio(false);
    setIsModalOpen(true);
  };

  const openAudioModal = (e) => {
    e.preventDefault();
    console.log(`Abriendo modal de audio para: ${story.id}`);
    
    // Asegurarse de que tenemos un objeto de URL de audio adecuado con el formato correcto
    if (!audioUrl) {
      console.warn(`No hay URL de audio disponible para: ${story.id}`);
      if (useMockData) {
        // For mock data, create a URL object with useProxy flag set to false for direct playback
        const mockAudioUrl = {
          url: `https://firebasestorage.googleapis.com/v0/b/cuentacuentos-b2e64.appspot.com/o/audio%2F${story.id}.mp3?alt=media`,
          useProxy: false
        };
        console.log(`Created mock audio URL: ${JSON.stringify(mockAudioUrl)}`);
        setAudioUrl(mockAudioUrl);
      }
    } else if (typeof audioUrl === 'string') {
      // Convert string URL to object with useProxy flag set to false for direct playback
      // Ensure the URL has the alt=media parameter
      let url = audioUrl;
      if (!url.includes('alt=media')) {
        url = url.includes('?') ? `${url}&alt=media` : `${url}?alt=media`;
      }
      
      const audioUrlObj = {
        url: url,
        useProxy: false
      };
      console.log(`Converting audio URL to object: ${JSON.stringify(audioUrlObj)}`);
      setAudioUrl(audioUrlObj);
    } else if (typeof audioUrl === 'object') {
      // Ensure useProxy is set to false for direct playback and URL has alt=media
      let url = audioUrl.url;
      if (!url.includes('alt=media')) {
        url = url.includes('?') ? `${url}&alt=media` : `${url}?alt=media`;
      }
      
      const updatedAudioUrl = {
        url: url,
        useProxy: false
      };
      console.log(`Updated audio URL object: ${JSON.stringify(updatedAudioUrl)}`);
      setAudioUrl(updatedAudioUrl);
    }
    
    console.log(`Contenido actual: ${storyContent ? storyContent.substring(0, 50) + '...' : 'Vacío'}`);
    setShowAudio(true);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    console.log("Closing modal");
    setIsModalOpen(false);
  };

  // Función para ejecutar el diagnóstico
  const runDiagnostic = async () => {
    if (story.textPath) {
      console.log(`Ejecutando diagnóstico para: ${story.id}`);
      try {
        await inspectStorageFile(story.textPath);
      } catch (error) {
        console.error("Error durante el diagnóstico:", error);
      }
    } else {
      console.warn("No hay ruta de texto para diagnosticar");
    }
  };

  if (loading) {
    return (
      <div className="story-card loading">
        <div className="spinner-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      </div>
    );
  }

  if (error && !useMockData) {
    return (
      <div className="story-card error">
        <h3>{story.title}</h3>
        <p className="text-danger">Error loading story resources</p>
        <RetryButton onClick={handleRetry} isLoading={isRetrying} text={t('common.retryLoading')} />
      </div>
    );
  }

  return (
    <>
      <div className="story-card">
        <h3>{story.title}</h3>
        <div className="story-image-container">
          {imageUrl ? (
            <img 
              src={imageUrl} 
              alt={story.title} 
              className="story-image" 
              onError={(e) => {
                console.error(`Error loading image for ${story.id}`);
                // Try to load default image
                e.target.src = 'https://firebasestorage.googleapis.com/v0/b/cuentacuentos-b2e64.appspot.com/o/images%2Fdefault-story.jpg?alt=media';
                e.target.onerror = null; // Prevent infinite loop if default also fails
              }} 
            />
          ) : (
            <div className="story-image-placeholder">
              <span>{story.title.charAt(0)}</span>
            </div>
          )}
        </div>
        <div className="story-details">
          <p><strong>{t('storyExamples.storyCard.recommendedAge')}</strong> {t(`storyExamples.ageGroups.${story.age}`)}</p>
          <p><strong>{t('storyExamples.storyCard.language')}</strong> {t(`storyExamples.languages.${story.language}`)}</p>
          <p><strong>{t('storyExamples.storyCard.level')}</strong> {t(`storyExamples.levels.${story.level}`)}</p>
          {usingMockContent && (
            <p className="mock-content-indicator">
              <span className="mock-badge">Ejemplo</span>
              <small>{t('storyExamples.storyCard.usingMockContent')}</small>
              <button 
                onClick={runDiagnostic} 
                className="btn btn-sm btn-outline-secondary ms-2"
                title="Ejecutar diagnóstico de archivo"
              >
                🔍
              </button>
            </p>
          )}
        </div>
        <div className="story-actions">
          <a href="#" onClick={openTextModal} className="story-link">
            {t('storyExamples.storyCard.readStory')}
          </a>
          {(audioUrl !== '#' || useMockData) && (
            <a href="#" onClick={openAudioModal} className="story-link audio-link">
              {t('storyExamples.storyCard.listenAudio')}
            </a>
          )}
        </div>
      </div>
      
      <StoryModal 
        isOpen={isModalOpen}
        onClose={closeModal}
        title={story.title}
        content={storyContent}
        audioUrl={audioUrl}
        showAudio={showAudio}
        usingMockContent={usingMockContent}
        imageUrl={imageUrl}
      />
    </>
  );
};

const StoryExamplesPage = () => {
  const { t, i18n } = useTranslation();
  const [stories, setStories] = useState([]);
  const [filteredStories, setFilteredStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [useMockData, setUseMockData] = useState(false);
  const [filters, setFilters] = useState({
    age: 'all',
    language: 'all',
    level: 'all'
  });

  // Run diagnostics on startup
  useEffect(() => {
    const runDiagnostics = async () => {
      try {
        console.log("Ejecutando diagnóstico de permisos de Firebase Storage...");
        await checkStoragePermissions();
      } catch (error) {
        console.error("Error ejecutando diagnóstico:", error);
      }
    };
    
    runDiagnostics();
  }, []);

  // Fetch stories using cache
  useEffect(() => {
    const loadStories = async () => {
      try {
        setLoading(true);
        console.log("=== INICIANDO CARGA DE HISTORIAS ===");
        
        const storyData = await getStoriesWithCache();
        
        if (storyData && storyData.length > 0) {
          console.log(`✓ Éxito! Cargadas ${storyData.length} historias:`);
          storyData.forEach(story => {
            console.log(`  - ${story.id}: ${story.title}`);
          });
          
          setStories(storyData);
          setFilteredStories(storyData);
          setUseMockData(false);
          console.log("✓ Estado actualizado con datos");
        } else {
          console.warn("⚠ No se encontraron historias");
          setError(new Error("No se encontraron historias"));
        }
      } catch (error) {
        console.error("✗ Error al cargar historias:", error);
        setError(error);
      } finally {
        setLoading(false);
        console.log("=== CARGA DE HISTORIAS COMPLETADA ===");
      }
    };
    
    loadStories();
  }, []);

  // Apply filters locally
  useEffect(() => {
    if (stories.length > 0) {
      const filtered = stories.filter(story => {
        return (filters.age === 'all' || story.age === filters.age) &&
               (filters.language === 'all' || story.language === filters.language) &&
               (filters.level === 'all' || story.level === filters.level);
      });
      
      setFilteredStories(filtered);
    }
  }, [filters, stories]);

  const handleFilterChange = (filterType, value) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      [filterType]: value
    }));
  };

  return (
    <div className="story-examples-page">
      <SEO 
        title={i18n.language === 'es' ? 
          'Ejemplos de Cuentos - Mi Cuentacuentos' : 
          'Story Examples - My Storyteller'}
        description={i18n.language === 'es' ? 
          'Explora nuestra colección de cuentos de ejemplo generados por Mi Cuentacuentos para todas las edades y niveles de idioma.' : 
          'Explore our collection of example stories generated by Mi Cuentacuentos for all ages and language levels.'}
        keywords={['ejemplos de cuentos', 'cuentos para niños', 'cuentos en español', 'cuentos en inglés']}
        lang={i18n.language}
      />
      
      <div className="page-header">
        <h1>{t('storyExamples.title')}</h1>
        <p>{t('storyExamples.description')}</p>
      </div>

      <div className="filters-container">
        <h2>{t('storyExamples.filters.title')}</h2>
        <div className="filters">
          <div className="filter-group">
            <label htmlFor="age-filter">{t('storyExamples.filters.age')}</label>
            <select 
              id="age-filter" 
              value={filters.age}
              onChange={(e) => handleFilterChange('age', e.target.value)}
            >
              <option value="all">{t('storyExamples.ageGroups.all')}</option>
              <option value="3to5">{t('storyExamples.ageGroups.3to5')}</option>
              <option value="6to8">{t('storyExamples.ageGroups.6to8')}</option>
              <option value="9to12">{t('storyExamples.ageGroups.9to12')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="language-filter">{t('storyExamples.filters.language')}</label>
            <select 
              id="language-filter" 
              value={filters.language}
              onChange={(e) => handleFilterChange('language', e.target.value)}
            >
              <option value="all">{t('storyExamples.languages.all')}</option>
              <option value="spanish">{t('storyExamples.languages.spanish')}</option>
              <option value="english">{t('storyExamples.languages.english')}</option>
            </select>
          </div>

          <div className="filter-group">
            <label htmlFor="level-filter">{t('storyExamples.filters.level')}</label>
            <select 
              id="level-filter" 
              value={filters.level}
              onChange={(e) => handleFilterChange('level', e.target.value)}
            >
              <option value="all">{t('storyExamples.levels.all')}</option>
              <option value="beginner">{t('storyExamples.levels.beginner')}</option>
              <option value="intermediate">{t('storyExamples.levels.intermediate')}</option>
              <option value="advanced">{t('storyExamples.levels.advanced')}</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
        </div>
      ) : error ? (
        <div className="error-container">
          <div className="alert alert-danger">
            <h4>Error al cargar las historias desde Firebase</h4>
            <p>No se pudieron cargar las historias desde Firebase. Por favor, verifica que:</p>
            <ul>
              <li>La colección "storyExamples" existe en Firestore</li>
              <li>Las reglas de seguridad de Firebase permiten el acceso a la colección</li>
              <li>Los documentos tienen los campos necesarios (title, textPath, audioPath, imagePath)</li>
              <li>Los archivos referenciados existen en Firebase Storage</li>
            </ul>
            <p>Error: {error.message}</p>
            <button 
              className="btn btn-primary mt-3" 
              onClick={() => window.location.reload()}
            >
              Reintentar
            </button>
          </div>
        </div>
      ) : (
        <div className="stories-grid">
          {filteredStories.length > 0 ? (
            filteredStories.map(story => (
              <StoryCard key={story.id} story={story} t={t} useMockData={useMockData} />
            ))
          ) : (
            <p className="no-results">{t('storyExamples.noResults')}</p>
          )}
        </div>
      )}
    </div>
  );
};

export default StoryExamplesPage; 
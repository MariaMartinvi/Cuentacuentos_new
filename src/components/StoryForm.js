import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { generateStory, generateStoryWithStreaming } from '../services/storyService.js';
import { getCurrentUser, updateUserStoriesCount } from '../services/authService';
import { useNavigate, Link } from 'react-router-dom';
import { checkServerHealth, diagnoseBackendIssue } from '../services/storyService';
import AudioPlayer from './AudioPlayer';
import './StoryForm.css';
import axios from 'axios';
import { auth } from '../firebase/config';

// Clave para localStorage
const FORM_STORAGE_KEY = 'storyFormData';

function StoryForm({ onStoryGenerated }) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [storiesRemaining, setStoriesRemaining] = useState(null);
  const [showWarning, setShowWarning] = useState(false);
  const [warningMessage, setWarningMessage] = useState('');
  const [warningType, setWarningType] = useState('');
  
  const [topic, setTopic] = useState('');
  const [storyLength, setStoryLength] = useState('medium');
  const [storyType, setStoryType] = useState('original');
  const [creativityLevel, setCreativityLevel] = useState('innovative');
  const [ageGroup, setAgeGroup] = useState('6to8');
  const [childNames, setChildNames] = useState('');
  const [englishLevel, setEnglishLevel] = useState('intermediate');
  const [storyLanguage, setStoryLanguage] = useState('es'); // Idioma en el que se generará el cuento
  const [learningMode, setLearningMode] = useState(false); // Modo aprendizaje
  const [vocabularyWords, setVocabularyWords] = useState(''); // Palabras de vocabulario (1-10)
  const [audioUrl, setAudioUrl] = useState(null);
  const [isMounted, setIsMounted] = useState(true);

  // Streaming states
  const [streamingText, setStreamingText] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingProgress, setStreamingProgress] = useState({ percentage: 0, phase: '' });
  const [enableTextStreaming, setEnableTextStreaming] = useState(true);
  
  // Ref para auto-scroll del streaming
  const streamingTextRef = useRef(null);

  console.log('🔥 [FRONTEND-FORM] enableTextStreaming:', enableTextStreaming);

  // Special handler for rate limit errors with countdown
  const formatTimeRemaining = (milliseconds) => {
    if (milliseconds <= 0) return '0:00';
    
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };
  
  const [rateLimitCountdown, setRateLimitCountdown] = useState(null);
  const countdownIntervalRef = useRef(null);

  // Function to fetch stories remaining
  const fetchStoriesRemaining = async (currentUser) => {
    try {
      // Calculate locally from user data instead of making server request
      console.log('📊 Calculating stories remaining locally:', {
        email: currentUser?.email,
        storiesGenerated: currentUser?.storiesGenerated,
        monthlyStoriesGenerated: currentUser?.monthlyStoriesGenerated,
        subscriptionStatus: currentUser?.subscriptionStatus
      });
      
      let remaining;
      if (currentUser?.subscriptionStatus === 'active') {
        remaining = Math.max(0, 30 - (currentUser.monthlyStoriesGenerated || 0));
      } else {
        remaining = Math.max(0, 3 - (currentUser?.storiesGenerated || 0));
      }
      
      setStoriesRemaining(remaining);
      console.log('✅ Stories remaining calculated:', remaining);
      return remaining;
      
    } catch (error) {
      console.error('Error calculating stories remaining:', error);
      // Calculate locally as fallback
      if (currentUser?.subscriptionStatus === 'active') {
        const remaining = 30 - (currentUser.monthlyStoriesGenerated || 0);
        setStoriesRemaining(remaining);
        return remaining;
      } else {
        const remaining = 3 - (currentUser?.storiesGenerated || 0);
        setStoriesRemaining(remaining);
        return remaining;
      }
    }
  };

  // Function to check if user can create stories
  const canCreateStory = () => {
    if (!user) return false;
    if (storiesRemaining === null) return true; // Allow if we haven't loaded the count yet
    return storiesRemaining > 0;
  };

  // Function to handle form field interaction
  const handleFieldInteraction = (e) => {
    if (!user) {
      e.preventDefault();
      setWarningMessage(t('storyForm.loginRequiredWarning'));
      setShowWarning(true);
      return false;
    }
    
    if (storiesRemaining !== null && storiesRemaining <= 0) {
      e.preventDefault();
      if (user.subscriptionStatus === 'active') {
        setWarningMessage(t('storyForm.premiumLimitWarning'));
      } else {
        setWarningMessage(t('storyForm.freeLimitWarning'));
      }
      setShowWarning(true);
      return false;
    }
    
    return true;
  };

  // Enhanced change handlers that check user status

  const handleSelectChangeWithCheck = (setter) => (e) => {
    if (handleFieldInteraction(e)) {
      setter(e.target.value);
    }
  };

  const handleInputChangeWithCheck = (setter) => (e) => {
    if (handleFieldInteraction(e)) {
      setter(e.target.value);
    }
  };
  
  // Clear interval on component unmount
  useEffect(() => {
    console.log('StoryForm mounted');
    return () => {
      console.log('StoryForm unmounted');
      setIsMounted(false);
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, []);
  
  // Handle beforeunload event to warn user when generating story
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      if (isLoading) {
        const message = t('storyForm.generateInProgress', { defaultValue: 'Se está generando un cuento. Si sales ahora, se perderá el progreso. ¿Estás seguro?' });
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    if (isLoading) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isLoading, t]);

  // Show warning banner when generating story
  useEffect(() => {
    // COMENTADO: Quitamos el popup molesto durante las pruebas de streaming
    /*
    if (isLoading) {
      setWarningMessage(t('storyForm.storyGenerationWarning'));
      setWarningType('generation');
      setShowWarning(true);
    } else {
      if (warningType === 'generation') {
        setShowWarning(false);
        setWarningMessage('');
        setWarningType('');
      }
    }
    */
  }, [isLoading, t]);
  
  const setupRateLimitCountdown = (retryAfterISO) => {
    let retryAfter;
    try {
      retryAfter = new Date(retryAfterISO);
    } catch {
      // If ISO parsing fails, use a default of 5 minutes from now
      retryAfter = new Date(Date.now() + 5 * 60 * 1000);
    }
    
    // Clear any existing interval
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    // Initial value
    const updateCountdown = () => {
      const remaining = retryAfter - new Date();
      if (remaining <= 0) {
        clearInterval(countdownIntervalRef.current);
        setRateLimitCountdown(null);
      } else {
        setRateLimitCountdown(formatTimeRemaining(remaining));
      }
    };
    
    // Update immediately and then every second
    updateCountdown();
    countdownIntervalRef.current = setInterval(updateCountdown, 1000);
  };

  // Load user data
  useEffect(() => {
    const loadUser = async () => {
      if (!isMounted) return;
      
      try {
        console.log('🔍 StoryForm: Loading user data...');
        
        // Check Firebase Auth state first
        const firebaseUser = auth.currentUser;
        console.log('🔍 StoryForm: Firebase user:', firebaseUser ? firebaseUser.email : 'No user');
        
        if (!firebaseUser) {
          console.log('❌ StoryForm: No Firebase user - user not logged in');
          if (isMounted) {
            setError(t('storyForm.loginRequired'));
          }
          return;
        }
        
        const currentUser = await getCurrentUser();
        if (isMounted) {
          console.log('✅ StoryForm: User data loaded:', currentUser ? {
            email: currentUser.email,
            subscriptionStatus: currentUser.subscriptionStatus,
            storiesGenerated: currentUser.storiesGenerated,
            monthlyStoriesGenerated: currentUser.monthlyStoriesGenerated
          } : 'null');
          setUser(currentUser);
          
          // Fetch stories remaining if user is logged in
          if (currentUser) {
            await fetchStoriesRemaining(currentUser);
          }
        }
      } catch (error) {
        console.error('❌ StoryForm: Error loading user:', error);
        if (isMounted) {
          setError(t('storyForm.loginRequired'));
        }
      }
    };
    loadUser();
  }, [t, isMounted]);

  // State for server status
  const [serverStatus, setServerStatus] = useState(null);

  // Function to check server health when errors occur
  const checkServerStatus = async () => {
    try {
      console.log('🔍 Checking server health...');
      setServerStatus({status: 'checking'});
      
      // First try the general health endpoint
      const healthResult = await checkServerHealth();
      console.log('📊 Server health check result:', healthResult);
      
      // If server health check fails, try the diagnostic API
      if (!healthResult.healthy) {
        console.log('🛠️ Running backend diagnostics...');
        const diagnostics = await diagnoseBackendIssue();
        console.log('📊 Backend diagnostic result:', diagnostics);
        
        setServerStatus({
          status: diagnostics.status || 'error',
          issue: diagnostics.issue,
          details: diagnostics.details
        });
        
        return diagnostics;
      }
      
      setServerStatus(healthResult);
      return healthResult;
    } catch (error) {
      console.error('❌ Failed to check server status:', error);
      setServerStatus({
        status: 'error',
        error: error.message
      });
      return null;
    }
  };
  
  // Add server error component
  const renderServerStatus = () => {
    if (!serverStatus || serverStatus.status === 'ok') return null;
    
    if (serverStatus.status === 'checking') {
      return (
        <div className="server-status checking">
          <div className="status-icon">🔄</div>
          <div className="status-message">
            <p>{i18n.language === 'es' 
              ? 'Verificando el estado del servidor...' 
              : 'Checking server status...'}</p>
          </div>
        </div>
      );
    }
    
    // Critical error (red)
    if (serverStatus.status === 'critical' || serverStatus.status === 'error') {
      return (
        <div className="server-status error">
          <div className="status-icon">❌</div>
          <div className="status-message">
            <h4>{i18n.language === 'es' ? 'Error del Servidor' : 'Server Error'}</h4>
            <p>{serverStatus.details || (i18n.language === 'es' 
              ? 'El servidor está experimentando problemas.' 
              : 'The server is experiencing issues.')}</p>
            {serverStatus.issue === 'openai_quota_exceeded' && (
              <p className="admin-note">{i18n.language === 'es'
                ? 'Nota: El servicio de IA ha alcanzado su límite de uso. Los administradores han sido notificados.'
                : 'Note: The AI service has reached its usage limit. Administrators have been notified.'}</p>
            )}
          </div>
        </div>
      );
    }
    
    // Warning (yellow)
    if (serverStatus.status === 'degraded') {
      return (
        <div className="server-status warning">
          <div className="status-icon">⚠️</div>
          <div className="status-message">
            <h4>{i18n.language === 'es' ? 'Rendimiento Limitado' : 'Limited Performance'}</h4>
            <p>{serverStatus.details || (i18n.language === 'es' 
              ? 'El servidor está experimentando ralentizaciones.' 
              : 'The server is experiencing slowdowns.')}</p>
          </div>
        </div>
      );
    }
    
    return null;
  };
  
  // Style for server status
  useEffect(() => {
    if (serverStatus) {
      const style = document.createElement('style');
      style.textContent = `
        .server-status {
          display: flex;
          border-radius: 8px;
          padding: 16px;
          margin: 20px 0;
          align-items: center;
        }
        .server-status.checking {
          background-color: #e3f2fd;
          border: 1px solid #bbdefb;
        }
        .server-status.error {
          background-color: #ffebee;
          border: 1px solid #ffcdd2;
        }
        .server-status.warning {
          background-color: #fff8e1;
          border: 1px solid #ffe082;
        }
        .status-icon {
          font-size: 24px;
          margin-right: 16px;
        }
        .status-message {
          flex: 1;
        }
        .status-message h4 {
          margin-top: 0;
          margin-bottom: 8px;
        }
        .server-status.error h4 {
          color: #c62828;
        }
        .server-status.warning h4 {
          color: #ef6c00;
        }
        .admin-note {
          font-style: italic;
          margin-top: 8px;
          font-size: 0.9em;
          color: #616161;
        }
        .retry-btn {
          margin-top: 12px;
          background-color: #f5f5f5;
          border: 1px solid #e0e0e0;
          border-radius: 4px;
          padding: 6px 12px;
          cursor: pointer;
          font-size: 14px;
          transition: background-color 0.2s;
        }
        .retry-btn:hover {
          background-color: #e0e0e0;
        }
      `;
      document.head.appendChild(style);
      
      // Cleanup
      return () => {
        document.head.removeChild(style);
      };
    }
  }, [serverStatus]);

  // Cargar datos guardados al montar
  useEffect(() => {
    const saved = localStorage.getItem(FORM_STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        if (data.topic) setTopic(data.topic);
        if (data.storyLength) setStoryLength(data.storyLength);
        if (data.storyType) setStoryType(data.storyType);
        if (data.childNames) setChildNames(data.childNames);
        if (data.englishLevel) setEnglishLevel(data.englishLevel);
        if (data.storyLanguage) setStoryLanguage(data.storyLanguage);
        if (data.learningMode !== undefined) setLearningMode(data.learningMode);
        if (data.vocabularyWords) setVocabularyWords(data.vocabularyWords);
      } catch {}
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    // Verifica si el campo topic está vacío
    const topicInput = document.getElementById('topic');
    if (topicInput && !topicInput.value.trim()) {
      console.log('Topic is empty');
      // Hacer scroll hacia arriba de la página
      window.scrollTo({ top: 0, behavior: 'smooth' });
      // Enfoca el campo topic y muestra el mensaje de validación personalizado
      topicInput.focus();
      topicInput.setCustomValidity(t('storyForm.alertTopicRequired'));
      topicInput.reportValidity();
      return;
    }
    
    if (!user) {
      // Guardar datos en localStorage
      localStorage.setItem(FORM_STORAGE_KEY, JSON.stringify({
        topic,
        storyLength,
        storyType,
        childNames,
        englishLevel,
        storyLanguage,
        learningMode,
        vocabularyWords
      }));
      console.log('No user found');
      setError(t('storyForm.loginRequired'));
      return;
    }

    if (!user.email) {
      console.log('No user email found');
      setError(t('storyForm.emailRequired'));
      return;
    }

    setIsLoading(true);
    setError(null);

    // Clear previous streaming state
    setStreamingText('');
    setStreamingProgress({ percentage: 0, phase: '' });

    try {
      // Usar el idioma seleccionado para el cuento
      console.log('Story language:', storyLanguage);
      console.log('Learning mode:', learningMode);
      console.log('Vocabulary words:', vocabularyWords);
      
      // Procesar palabras de vocabulario
      let vocabularyArray = [];
      if (learningMode && vocabularyWords.trim()) {
        vocabularyArray = vocabularyWords
          .split(',')
          .map(word => word.trim())
          .filter(word => word.length > 0)
          .slice(0, 10); // Máximo 10 palabras
      }
      
      const storyParams = {
        topic,
        storyLength,
        storyType,
        creativityLevel,
        ageGroup,
        childNames,
        englishLevel,
        spanishLevel: storyLanguage === 'es' ? englishLevel : 'intermediate', // Only set spanishLevel for Spanish
        language: storyLanguage, // Idioma en el que se generará el cuento
        learningMode: learningMode, // Modo aprendizaje
        vocabularyWords: vocabularyArray, // Array de palabras de vocabulario
        email: user?.email
      };

      console.log('Sending story generation request with params:', storyParams);
      console.log('🔥 [FRONTEND-FORM] enableTextStreaming value:', enableTextStreaming);
      console.log('🔥 [FRONTEND-FORM] typeof enableTextStreaming:', typeof enableTextStreaming);

      let result;

      if (enableTextStreaming) {
        // Use streaming generation
        console.log('🔥 [FRONTEND-FORM] Activando modo streaming...');
        setIsStreaming(true);
        console.log('🔥 [FRONTEND-FORM] Estado streaming activado:', { isStreaming: true });
        console.log('🚀 Iniciando generación con streaming...');
        
        const onTextChunk = (chunk, accumulatedText) => {
          console.log('🔥 [FRONTEND-FORM] onTextChunk called!', { 
            chunk, 
            chunkLength: chunk?.length, 
            accumulatedLength: accumulatedText?.length 
          });
          
          // Filtrar el JSON y extraer solo el contenido de la historia
          let cleanContent = accumulatedText;
          
          // Si el texto contiene JSON, extraer solo el contenido
          try {
            // Buscar patrones de JSON
            if (accumulatedText.includes('"content":') || accumulatedText.includes('"title":')) {
              // Intentar extraer el contenido del JSON
              const jsonMatch = accumulatedText.match(/\{[^}]*"content"\s*:\s*"([^"]*)"[^}]*\}/);
              if (jsonMatch && jsonMatch[1]) {
                cleanContent = jsonMatch[1];
                console.log('📝 [FRONTEND-FORM] JSON detectado, extraído contenido:', cleanContent.length, 'caracteres');
              } else {
                // Si no podemos extraer el contenido, buscar texto después del JSON
                const afterJson = accumulatedText.replace(/^\s*\{[^}]*\}\s*/, '');
                if (afterJson.length > 0) {
                  cleanContent = afterJson;
                }
              }
            }
          } catch (error) {
            console.log('🔥 [FRONTEND-FORM] Error parsing JSON, usando texto completo');
          }
          
          // Convertir texto a párrafos HTML con mejor formato
          const paragraphs = cleanContent
            .split('\n\n')
            .filter(paragraph => paragraph.trim())
            .map(paragraph => {
              // Limpiar el texto del párrafo
              const cleanText = paragraph.trim()
                .replace(/^\s*[\"\']/, '') // Quitar comillas al inicio
                .replace(/[\"\']?\s*$/, '') // Quitar comillas al final
                .replace(/\n/g, ' ') // Convertir saltos de línea en espacios
                .replace(/\s+/g, ' '); // Normalizar espacios múltiples
              
              return cleanText ? `<p>${cleanText}</p>` : '';
            })
            .filter(p => p) // Filtrar párrafos vacíos
            .join('');
          
          console.log('🔥 [FRONTEND-FORM] Setting streaming text, HTML length:', paragraphs.length);
          setStreamingText(paragraphs);
          
          // Auto-scroll suave con un pequeño delay para mejor experiencia
          setTimeout(() => {
            scrollToBottom();
          }, 50);
        };

        const onProgress = (progressData) => {
          console.log('📊 [FRONTEND-FORM] onProgress called!', progressData);
          setStreamingProgress({
            percentage: progressData.percentage || 0,
            phase: progressData.phase || ''
          });
        };

        const onPhaseComplete = (phaseData) => {
          console.log('✅ Phase completed:', phaseData.phase);
        };

        try {
          console.log('🚀 [FRONTEND-FORM] Iniciando generateStoryWithStreaming...');
          result = await generateStoryWithStreaming(
            storyParams,
            onTextChunk,
            onProgress,
            onPhaseComplete
          );
          console.log('✅ [FRONTEND-FORM] Streaming completado exitosamente:', result);
        } catch (streamError) {
          console.error('❌ [FRONTEND-FORM] Error en streaming:', streamError);
          
          // Solo hacer fallback si el error es de conexión SSE
          if (streamError.message === 'SSE_CONNECTION_FAILED') {
            console.log('🔄 [FRONTEND-FORM] Fallback a generación tradicional debido a fallo de SSE');
            result = await generateStory(storyParams);
          } else {
            // Para otros errores, re-lanzar la excepción
            throw streamError;
          }
        }

        setIsStreaming(false);
        setStreamingText(''); // Clear streaming text since we'll use the final story
      } else {
        // Use traditional generation
        console.log('🔥 [FRONTEND-FORM] Usando generación tradicional (NO streaming)');
        result = await generateStory(storyParams);
      }
      
      console.log('🔍 [FRONTEND-FORM] Evaluando resultado:', {
        hasResult: !!result,
        hasStory: !!result?.story,
        hasContent: !!result?.content,
        hasResultStory: !!result?.result?.story,
        hasTitle: !!result?.title,
        resultKeys: result ? Object.keys(result) : []
      });
      
      // Evaluar si tenemos una historia válida en cualquier formato
      const hasValidStory = result && (
        result.story ||           // Formato tradicional: { story: {...} }
        result.content ||         // Formato directo: { content: "...", title: "..." }
        result.result?.story ||   // Formato streaming: { result: { story: {...} } }
        result.title              // Formato directo: { title: "...", content: "..." }
      );
      
      if (hasValidStory) {
        // Extraer la historia del formato correcto
        let story;
        if (result.story) {
          story = result.story;
          console.log('📖 [FRONTEND-FORM] Historia extraída de result.story');
        } else if (result.result?.story) {
          story = result.result.story;
          console.log('📖 [FRONTEND-FORM] Historia extraída de result.result.story');
        } else if (result.title || result.content) {
          story = result;
          console.log('📖 [FRONTEND-FORM] Historia extraída directamente del result');
        } else {
          story = result;
          console.log('📖 [FRONTEND-FORM] Usando result completo como historia');
        }
        
        console.log('✅ [FRONTEND-FORM] Historia extraída exitosamente:', {
          title: story.title,
          hasContent: !!story.content,
          hasContentWithTitle: !!story.contentWithTitle
        });
        
        console.log('Story generated successfully');
        
        // Update user data locally with the new story counts from the server response
        if (result.storiesRemaining !== undefined) {
          // Calculate the new counts based on the response
          const userData = user;
          let newStoriesGenerated = userData.storiesGenerated + 1;
          let newMonthlyStoriesGenerated = userData.monthlyStoriesGenerated + 1;
          
          // Update local user data to stay in sync
          const updatedUser = await updateUserStoriesCount(newStoriesGenerated, newMonthlyStoriesGenerated);
          if (updatedUser) {
            setUser(updatedUser);
            // Update stories remaining based on the new counts
            await fetchStoriesRemaining(updatedUser);
          }
        }

        // Llamar al callback con la historia generada
        onStoryGenerated(story);
        
        // Limpiar el formulario
        setTopic('');
        setStoryLength('medium');
        setStoryType('original');
        setCreativityLevel('innovative');
        setAgeGroup('6to8');
        setChildNames('');
        setEnglishLevel('intermediate');
        // Borrar datos guardados
        localStorage.removeItem(FORM_STORAGE_KEY);
      } else {
        console.log('No story received from server');
        throw new Error('No story received from the server');
      }
    } catch (error) {
      console.error('Error generating story:', error);
      
      // Clear streaming state on error
      setIsStreaming(false);
      setStreamingText('');
      
      // Handle authentication errors specifically
      if (error.code === 'AUTH_FAILED') {
        console.log('Authentication failed - redirecting to login');
        setError(t('storyForm.authenticationExpired') + ' [[login]]');
        // Clear user data
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } else if (error.response?.data?.error === 'Email not verified') {
        console.log('Email verification required');
        setError(t('storyForm.emailVerificationRequired') + ' [[verify-email]]');
      } else if (error.response?.data?.error === 'Story limit reached') {
        console.log('Error message from backend:', error.response.data.message);
        const errorData = error.response.data.message;
        if (typeof errorData === 'object' && errorData.key) {
          // Handle translated error message
          setError(t(errorData.key, errorData.params) + ' [[subscribe]]');
        } else {
          setError(t('storyForm.storyLimitReached') + ' [[subscribe]]');
        }
      } else if (error.response?.status === 401) {
        console.log('401 Unauthorized - authentication failed');
        setError(t('storyForm.authenticationFailed') + ' [[login]]');
        // Clear user data and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        setUser(null);
      } else if (error.response?.data?.message) {
        console.log('Error message from backend:', error.response.data.message);
        setError(error.response.data.message);
      } else {
        setError(t('storyForm.generalError'));
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      setStreamingText('');
    }
  };

  // Función para manejar el clic en el enlace de inicio de sesión
  const handleLoginClick = (e) => {
    // Scroll hacia arriba antes de navegar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para manejar el clic en el enlace de suscripción
  const handleSubscribeClick = (e) => {
    // Scroll hacia arriba antes de navegar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Función para limpiar el mensaje de validación cuando el usuario empieza a escribir
  const handleTopicChange = (e) => {
    const input = e.target;
    input.setCustomValidity('');
    setTopic(e.target.value);
  };

  // Función para validar el campo topic cuando pierde el foco
  const handleTopicBlur = (e) => {
    const input = e.target;
    if (!input.value.trim()) {
      input.setCustomValidity(t('storyForm.alertTopicRequired'));
    } else {
      input.setCustomValidity('');
    }
  };

  // Función para manejar el clic en el enlace de contacto
  const handleContactClick = (e) => {
    // Scroll hacia arriba antes de navegar
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Function to get the next renewal day based on subscription date
  const getNextRenewalDay = () => {
    if (!user) {
      return 1;
    }

    try {
      let subscriptionDay = 1; // Default fallback
      
      // Try to get subscription day from different possible fields
      if (user.subscriptionDate) {
        const subscriptionDate = new Date(user.subscriptionDate);
        subscriptionDay = subscriptionDate.getDate();
      } else if (user.subscription?.currentPeriodStart) {
        const subscriptionDate = new Date(user.subscription.currentPeriodStart);
        subscriptionDay = subscriptionDate.getDate();
      } else if (user.subscription?.created) {
        const subscriptionDate = new Date(user.subscription.created);
        subscriptionDay = subscriptionDate.getDate();
      }
      
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      // Calculate next renewal date
      let nextRenewal = new Date(currentYear, currentMonth, subscriptionDay);
      
      // If the renewal day for this month has already passed, move to next month
      if (nextRenewal <= now) {
        nextRenewal = new Date(currentYear, currentMonth + 1, subscriptionDay);
      }
      
      // Handle edge case where subscription day doesn't exist in the target month
      // (e.g., subscribed on Jan 31, but February only has 28/29 days)
      const targetMonth = nextRenewal.getMonth();
      const lastDayOfTargetMonth = new Date(currentYear, targetMonth + 1, 0).getDate();
      
      if (subscriptionDay > lastDayOfTargetMonth) {
        // Use the last day of the month instead
        nextRenewal = new Date(currentYear, targetMonth, lastDayOfTargetMonth);
      }
      
      return nextRenewal.getDate();
    } catch (error) {
      console.error('Error calculating renewal day:', error);
      return 1; // Fallback to first day of next month
    }
  };

  // Warning modal component
  const WarningModal = () => {
    if (!showWarning) return null;

    const nextDay = getNextRenewalDay();
    
    // Get the appropriate message based on warning type
    let modalMessage = '';
    if (warningType === 'login') {
      modalMessage = t('storyForm.loginRequiredWarning');
    } else if (warningType === 'freeLimit') {
      modalMessage = t('storyForm.freeLimitWarning');
    } else if (warningType === 'premiumLimit') {
      modalMessage = t('storyForm.premiumLimitWarning', { day: nextDay });
    } else if (warningType === 'generation') {
      modalMessage = t('storyForm.storyGenerationWarning');
    } else if (warningMessage) {
      modalMessage = warningMessage;
    }
    
    // Don't show modal if there's no message
    if (!modalMessage || modalMessage.trim() === '') {
      return null;
    }

    return (
      <div className="warning-overlay" onClick={() => setShowWarning(false)}>
        <div className="warning-modal" onClick={(e) => e.stopPropagation()}>
          <div className="warning-content">
            <p>{modalMessage}</p>
          </div>
          <div className="warning-actions">
            {warningType === 'login' && (
              <>
                <button 
                  className="warning-btn warning-btn-primary"
                  onClick={() => {
                    setShowWarning(false);
                    navigate('/login');
                  }}
                >
                  {t('storyForm.loginButton')}
                </button>
                <button 
                  className="warning-btn warning-btn-secondary"
                  onClick={() => setShowWarning(false)}
                >
                  {t('storyForm.cancelButton')}
                </button>
              </>
            )}
            {warningType === 'freeLimit' && (
              <>
                <button 
                  className="warning-btn warning-btn-primary"
                  onClick={() => {
                    setShowWarning(false);
                    navigate('/subscription');
                  }}
                >
                  {t('storyForm.subscribeButton')}
                </button>
                <button 
                  className="warning-btn warning-btn-secondary"
                  onClick={() => setShowWarning(false)}
                >
                  {t('storyForm.cancelButton')}
                </button>
              </>
            )}
            {warningType === 'premiumLimit' && (
              <button 
                className="warning-btn warning-btn-primary"
                onClick={() => setShowWarning(false)}
              >
                {t('storyForm.waitButton')}
              </button>
            )}
            {warningType === 'generation' && (
              <button 
                className="warning-btn warning-btn-secondary"
                onClick={() => setShowWarning(false)}
              >
                {t('storyForm.okButton', 'OK')}
              </button>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Function to show warning modal
  const showWarningModal = (type) => {
    setWarningType(type);
    setShowWarning(true);
  };

  // Check if user can generate stories
  const canGenerateStory = () => {
    if (!user) {
      showWarningModal('login');
      return false;
    }

    if (storiesRemaining <= 0) {
      if (user.subscriptionStatus === 'active') {
        showWarningModal('premiumLimit');
      } else {
        showWarningModal('freeLimit');
      }
      return false;
    }

    return true;
  };

  // Event handlers for form fields with warning check
  const handleChildNamesChangeWithCheck = (e) => {
    if (!canGenerateStory()) return;
    setChildNames(e.target.value);
  };

  const handleEnglishLevelChangeWithCheck = (e) => {
    if (!canGenerateStory()) return;
    setEnglishLevel(e.target.value);
  };

  const handleStoryLanguageChangeWithCheck = (e) => {
    if (!canGenerateStory()) return;
    setStoryLanguage(e.target.value);
  };

  const handleLearningModeChange = (e) => {
    if (!canGenerateStory()) return;
    setLearningMode(e.target.checked);
    // Si desactiva el modo aprendizaje, limpiar las palabras
    if (!e.target.checked) {
      setVocabularyWords('');
    }
  };

  const handleVocabularyWordsChange = (e) => {
    if (!canGenerateStory()) return;
    const value = e.target.value;
    // Contar palabras (separadas por comas)
    const wordCount = value.split(',').filter(word => word.trim().length > 0).length;
    // Limitar a 10 palabras
    if (wordCount <= 10) {
      setVocabularyWords(value);
    }
  };

  const handleLengthChangeWithCheck = (e) => {
    if (!canGenerateStory()) return;
    setStoryLength(e.target.value);
  };

  const handleTypeChangeWithCheck = (e) => {
    if (!canGenerateStory()) return;
    setStoryType(e.target.value);
  };

  const handleAgeGroupChangeWithCheck = (e) => {
    if (!canGenerateStory()) return;
    setAgeGroup(e.target.value);
  };

  const handleCreativityLevelChangeWithCheck = (e) => {
    if (!canGenerateStory()) return;
    setCreativityLevel(e.target.value);
  };

  // Handler para topic con validación temprana
  const handleTopicChangeWithCheck = (e) => {
    if (!canGenerateStory()) return;
    
    // Limpiar mensaje de validación HTML5
    const input = e.target;
    input.setCustomValidity('');
    setTopic(e.target.value);
  };

  // Función para hacer auto-scroll al final del contenido streaming
  const scrollToBottom = () => {
    if (streamingTextRef.current) {
      const element = streamingTextRef.current;
      // Usar requestAnimationFrame para asegurar que el DOM se ha actualizado
      requestAnimationFrame(() => {
        element.scrollTop = element.scrollHeight;
      });
    }
  };

  // Efecto para hacer auto-scroll cuando cambie el streaming text
  useEffect(() => {
    if (streamingText && isStreaming) {
      scrollToBottom();
    }
  }, [streamingText, isStreaming]);

  return (
    <div className="story-form-container">
      {/* Título eliminado para diseño más limpio */}

      {/* Warning banner when generating story - COMENTADO PARA PRUEBAS */}
      {false && isLoading && (
        <div className="warning-banner story-generation-warning">
          <span className="warning-icon">⚠️</span>
          <span className="warning-text">{t('storyForm.storyGenerationWarning')}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="topic">
            <span className="form-icon">💡</span> {t('storyForm.topicLabel')}
          </label>
          <input
            type="text"
            id="topic"
            value={topic}
            onChange={handleTopicChangeWithCheck}
            onBlur={handleTopicBlur}
            placeholder={t('storyForm.topicPlaceholder')}
            required
          />
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="childNames">
              <span className="form-icon">🧑‍🤝‍🧑</span> {t('storyForm.childNamesLabel')}
            </label>
            <input
              type="text"
              id="childNames"
              value={childNames}
              onChange={handleChildNamesChangeWithCheck}
              placeholder={t('storyForm.childNamesPlaceholder')}
            />
          </div>

          <div className="form-group">
            <label htmlFor="storyLanguage">
              <span className="form-icon">🗣️</span> {t('storyForm.storyLanguageLabel')}
            </label>
            <div className="select-wrapper">
              <select
                id="storyLanguage"
                value={storyLanguage}
                onChange={handleStoryLanguageChangeWithCheck}
              >
                <option value="es">{t('storyForm.storyLanguageSpanish')}</option>
                <option value="en">{t('storyForm.storyLanguageEnglish')}</option>
                <option value="ca">{t('storyForm.storyLanguageCatalan')}</option>
                <option value="fr">{t('storyForm.storyLanguageFrench')}</option>
                <option value="de">{t('storyForm.storyLanguageGerman')}</option>
                <option value="it">{t('storyForm.storyLanguageItalian')}</option>
                <option value="pt">{t('storyForm.storyLanguagePortuguese')}</option>
              </select>
            </div>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="englishLevel">
              <span className="form-icon">🌍</span> {t('storyForm.englishLevelLabel')}
            </label>
            <div className="select-wrapper">
              <select
                id="englishLevel"
                value={englishLevel}
                onChange={handleEnglishLevelChangeWithCheck}
              >
                <option value="basic">{t('storyForm.englishLevelBeginner')}</option>
                <option value="intermediate">{t('storyForm.englishLevelIntermediate')}</option>
                <option value="advanced">{t('storyForm.englishLevelAdvanced')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Modo Aprendizaje - Diseño compacto */}
        <div className="form-row">
          <div className="form-group compact-toggle-group">
            <label className="compact-toggle-label">
              <input
                type="checkbox"
                id="learningMode"
                checked={learningMode}
                onChange={handleLearningModeChange}
                className="compact-toggle-input"
              />
              <span className="compact-toggle-slider"></span>
              <span className="compact-toggle-text">
                <span className="form-icon">🎓</span> {t('storyForm.learningModeLabel')}
              </span>
            </label>
            {learningMode && (
              <p className="compact-hint">
                {t('storyForm.learningModeDescription')}
              </p>
            )}
          </div>
        </div>

        {/* Campo de vocabulario - solo visible si learningMode está activado */}
        {learningMode && (
          <div className="form-group vocabulary-group">
            <label htmlFor="vocabularyWords">
              <span className="form-icon">📝</span> {t('storyForm.vocabularyWordsLabel')}
              <span className="word-count">
                ({vocabularyWords.split(',').filter(w => w.trim()).length}/10)
              </span>
            </label>
            <input
              type="text"
              id="vocabularyWords"
              value={vocabularyWords}
              onChange={handleVocabularyWordsChange}
              placeholder={t('storyForm.vocabularyWordsPlaceholder')}
              className="vocabulary-input"
            />
            <p className="vocabulary-help">
              {t('storyForm.vocabularyWordsHelp')}
            </p>
          </div>
        )}

        <div className="form-row">
          <div className="form-group">
            <label htmlFor="storyLength">
              <span className="form-icon">⏳</span> {t('storyForm.lengthLabel')}
            </label>
            <div className="select-wrapper">
              <select
                id="storyLength"
                value={storyLength}
                onChange={handleLengthChangeWithCheck}
              >
                <option value="short">{t('storyForm.lengthShort')}</option>
                <option value="medium">{t('storyForm.lengthMedium')}</option>
                <option value="long">{t('storyForm.lengthLong')}</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="storyType">
              <span className="form-icon">🌈</span> {t('storyForm.typeLabel')}
            </label>
            <div className="select-wrapper">
              <select
                id="storyType"
                value={storyType}
                onChange={handleTypeChangeWithCheck}
              >
                <option value="original">{t('storyForm.typeOriginal')}</option>
                <option value="classic">{t('storyForm.typeClassic')}</option>
                <option value="humor">{t('storyForm.typeHumor')}</option>
                <option value="sci-fi">{t('storyForm.typeSciFi')}</option>
                <option value="horror">{t('storyForm.typeHorror')}</option>
                <option value="adventure">{t('storyForm.typeAdventure')}</option>
                <option value="fantasy">{t('storyForm.typeFantasy')}</option>
              </select>
            </div>
          </div>
        </div>

        {error && (
          <div className="error-message">
            {error === t('storyForm.loginRequired') ? (
              <p>
                {error}{' '}
                <Link to="/login" className="error-login-link" onClick={handleLoginClick}>
                  {t('storyForm.clickToLogin')}
                </Link>
              </p>
            ) : error.includes('[[verify-email]]') ? (
              <p>
                {error.split('[[verify-email]]').map((part, index, array) => {
                  if (index === array.length - 1) return part;
                  return (
                    <React.Fragment key={index}>
                      {part}
                      <Link to="/verify-email" className="error-login-link">
                        {t('storyForm.verifyEmail')}
                      </Link>
                    </React.Fragment>
                  );
                })}
              </p>
            ) : error.includes('[[subscribe]]') ? (
              <p>
                {error.split('[[subscribe]]').map((part, index, array) => {
                  if (index === array.length - 1) return part;
                  return (
                    <React.Fragment key={index}>
                      {part}
                      <Link to="/subscribe" className="error-login-link" onClick={handleSubscribeClick}>
                        {error.includes('actualizar tu plan') ? t('storyForm.updatePlan') : t('storyForm.subscribe')}
                      </Link>
                    </React.Fragment>
                  );
                })}
              </p>
            ) : error.includes('[[contact]]') ? (
              <p>
                {error.split('[[contact]]').map((part, index, array) => {
                  if (index === array.length - 1) return part;
                  return (
                    <React.Fragment key={index}>
                      {part}
                      <Link to="/contact" className="error-login-link" onClick={handleContactClick}>
                        {t('storyForm.contactUs')}
                      </Link>
                    </React.Fragment>
                  );
                })}
              </p>
            ) : (
              <p>{error}</p>
            )}
          </div>
        )}

        {/* Server status indicator */}
        {renderServerStatus()}

        {/* Streaming text area */}
        {isStreaming && streamingText && (
          <div className="streaming-area">
            <div className="streaming-header">
              <h3>{t('storyForm.generatingStory')}</h3>
            </div>
            <div className="streaming-text" ref={streamingTextRef}>
              <div className="story-content" dangerouslySetInnerHTML={{ __html: streamingText }} />
              <span className="typing-cursor"></span>
            </div>
          </div>
        )}

        <div className="button-group">
          <button
            type="submit"
            className="generate-btn"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="spinner"></span>
                {t('storyForm.generating')}
              </>
            ) : (
              <>
                <span className="btn-icon">⭐</span>
                {t('storyForm.generateButton')}
              </>
            )}
          </button>
        </div>
      </form>

      {audioUrl && (
        <div className="audio-player-section">
          <AudioPlayer audioUrl={audioUrl} title={topic} />
        </div>
      )}

      {/* Warning Modal */}
      <WarningModal />
    </div>
  );
}

export default StoryForm;
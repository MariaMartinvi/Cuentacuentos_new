import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import AudioPlayer from './AudioPlayer.js';
import { generateAudio } from '../services/audioService.js';

function StoryDisplay({ story }) {
  const { t, i18n } = useTranslation();
  const [audioUrl, setAudioUrl] = useState(null);
  const [voiceType, setVoiceType] = useState(i18n.language === 'en' ? 'female-english' : 'female');
  const [speechRate, setSpeechRate] = useState(0.8); // Default to normal speed
  const [musicTrack, setMusicTrack] = useState('random'); // Default to random music
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);
  const [audioCount, setAudioCount] = useState(0);
  const [alertMessage, setAlertMessage] = useState(null);
  const [isSharing, setIsSharing] = useState(false); // New state to prevent multiple share operations
  
  // Reset audio count when story changes
  useEffect(() => {
    setAudioCount(0);
    setAudioUrl(null);
  }, [story]);

  // Update voice type when language changes
  useEffect(() => {
    switch (i18n.language) {
      case 'en':
        setVoiceType('female-english');
        break;
      case 'ca':
        setVoiceType('female-catalan');
        break;
      case 'gl':
        setVoiceType('female-galician');
        break;
      case 'eu':
        setVoiceType('female-basque');
        break;
      case 'de':
        setVoiceType('female-german');
        break;
      case 'it':
        setVoiceType('female-italian');
        break;
      case 'fr':
        setVoiceType('female-french');
        break;
      case 'pt':
        setVoiceType('female-portuguese');
        break;
      default:
        setVoiceType('female');
    }
  }, [i18n.language]);

  if (!story) return null;

  const handleCopyToClipboard = () => {
    navigator.clipboard.writeText(story.content);
    setAlertMessage(t('storyDisplay.copySuccess'));
    setTimeout(() => setAlertMessage(null), 3000);
  };

  const handleDownloadText = () => {
    const element = document.createElement('a');
    const file = new Blob([story.content], {type: 'text/plain'});
    element.href = URL.createObjectURL(file);
    element.download = `historia-${Date.now()}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleMusicTrackChange = (e) => {
    const value = e.target.value;
    console.log(`🎵 Música seleccionada: ${value}`);
    setMusicTrack(value);
  };

  const handleGenerateAudio = async () => {
    if (audioCount >= 4) {
      setAlertMessage(t('storyDisplay.audioLimitReached'));
      setTimeout(() => setAlertMessage(null), 5000);
      return;
    }

    setIsGeneratingAudio(true);

    try {
      console.log("Solicitando audio para texto:", story.content.substring(0, 50) + "...");
      console.log("Opciones de audio:", {
        voiceType,
        speechRate,
        musicTrack
      });

      // Separar título del contenido (igual que hace el backend en storyController)
      const contentLines = story.content.split('\n');
      const titleFromContent = contentLines[0] || story.title;
      const contentWithoutTitle = contentLines.slice(2).join('\n'); // Skip title and empty line
      
      console.log("Título extraído:", titleFromContent);
      console.log("Contenido sin título:", contentWithoutTitle.substring(0, 50) + "...");

      // Las pausas inteligentes ahora se aplican automáticamente en el backend
      const audioData = await generateAudio({
        text: contentWithoutTitle, // Enviar solo el contenido sin título
        voiceId: voiceType,
        speechRate: speechRate,
        musicTrack: musicTrack,
        title: titleFromContent // Pasar el título extraído para detección automática de pausas
      });

      if (!audioData) {
        throw new Error('No se recibieron datos de audio del servidor');
      }

      console.log("Respuesta del servidor:", audioData);
      
      if (audioData.audioUrl) {
        console.log("URL de audio recibida:", audioData.audioUrl.substring(0, 50) + "...");
        setAudioUrl(audioData.audioUrl);
        setAudioCount(prev => prev + 1);
        // Scroll to title and audio player after audio is generated
        setTimeout(() => {
          const storyTitleElement = document.querySelector('.story-display h3');
          if (storyTitleElement) {
            storyTitleElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else if (audioData.audioData) {
        console.log("Datos de audio recibidos, convirtiendo a URL...");
        setAudioUrl(`data:audio/mp3;base64,${audioData.audioData}`);
        setAudioCount(prev => prev + 1);
        // Scroll to title and audio player after audio is generated
        setTimeout(() => {
          const storyTitleElement = document.querySelector('.story-display h3');
          if (storyTitleElement) {
            storyTitleElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 100);
      } else {
        throw new Error("La respuesta del servidor no contiene datos de audio válidos");
      }

    } catch (error) {
      console.error('Error generating audio:', error);
      setAlertMessage(t('storyDisplay.audioError') + ': ' + error.message);
      setTimeout(() => setAlertMessage(null), 5000);
    } finally {
      setIsGeneratingAudio(false);
    }
  };

  const handleDownloadAudio = async () => {
    try {
      const response = await fetch(audioUrl);
      const blob = await response.blob();
      const file = new File([blob], `cuento-${story.title}.mp3`, { type: 'audio/mp3' });
      
      if (navigator.share) {
        await navigator.share({
          title: story.title,
          text: `${story.title}\n\nEscucha este cuento en AudioGretel`,
          files: [file]
        });
      } else {
        // Si no hay API de compartir, descargamos el archivo
        const element = document.createElement('a');
        element.href = URL.createObjectURL(blob);
        element.download = `cuento-${story.title}.mp3`;
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);
      }
    } catch (error) {
      console.error('Error sharing audio:', error);
      setAlertMessage(t('storyDisplay.shareError'));
      setTimeout(() => setAlertMessage(null), 3000);
    }
  };

  const handleShareText = async () => {
    if (isSharing) return;
    setIsSharing(true);

    try {
      const shareText = `${story.title}\n\n${story.content}\n\n🎧 Create more stories at AudioGretel: https://www.audiogretel.com`;

      // Check if we're on mobile and Web Share API is available
      if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) && navigator.share) {
        await navigator.share({
          title: story.title,
          text: shareText,
          url: 'https://www.audiogretel.com'
        });
      } else {
        // For desktop or when Web Share API is not available
        const shareWindow = window.open('', '_blank', 'width=600,height=400');
        if (shareWindow) {
          // Get translations before creating the popup
          const translations = {
            shareTitle: t('common.share'),
            twitterShare: t('common.shareOnTwitter'),
            facebookShare: t('common.shareOnFacebook'),
            whatsappShare: t('common.shareOnWhatsApp'),
            telegramShare: t('common.shareOnTelegram'),
            copyToClipboard: t('common.copyToClipboard'),
            copiedToClipboard: t('common.copiedToClipboard')
          };

          shareWindow.document.write(`
            <html>
              <head>
                <title>${translations.shareTitle}</title>
                <style>
                  body { font-family: Arial, sans-serif; padding: 20px; }
                  .share-button {
                    display: block;
                    width: 100%;
                    padding: 12px;
                    margin: 10px 0;
                    border: none;
                    border-radius: 8px;
                    background-color: #4361ee;
                    color: white;
                    cursor: pointer;
                    text-decoration: none;
                    text-align: center;
                    font-size: 16px;
                  }
                  .share-button:hover {
                    background-color: #3a56d4;
                  }
                  .copy-button {
                    background-color: #6c757d;
                  }
                  .copy-button:hover {
                    background-color: #5a6268;
                  }
                </style>
              </head>
              <body>
                <a href="https://twitter.com/intent/tweet?text=${encodeURIComponent(story.title + '\n\n' + story.content.substring(0, 200) + '...\n\n🎧 Create more stories at AudioGretel: https://www.audiogretel.com')}" 
                   class="share-button" target="_blank">${translations.twitterShare}</a>
                <a href="https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent('https://www.audiogretel.com')}&quote=${encodeURIComponent(shareText)}" 
                   class="share-button" target="_blank">${translations.facebookShare}</a>
                <a href="https://wa.me/?text=${encodeURIComponent(shareText)}" 
                   class="share-button" target="_blank">${translations.whatsappShare}</a>
                <a href="https://t.me/share/url?url=${encodeURIComponent('https://www.audiogretel.com')}&text=${encodeURIComponent(shareText)}" 
                   class="share-button" target="_blank">${translations.telegramShare}</a>
              </body>
            </html>
          `);
        } else {
          // If popup is blocked, fall back to clipboard
          await navigator.clipboard.writeText(shareText);
          setAlertMessage(t('common.copiedToClipboard'));
          setTimeout(() => setAlertMessage(null), 4000);
        }
      }
    } catch (error) {
      console.error('Error sharing:', error);
      setAlertMessage(t('common.copyError'));
      setTimeout(() => setAlertMessage(null), 4000);
    } finally {
      setIsSharing(false);
    }
  };

  const handleShareAudio = () => {
    // Prevent multiple simultaneous share operations
    if (isSharing) {
      return;
    }

    const productionUrl = 'https://www.audiogretel.com';
    const textToShare = `🎧 ${story.title || t('storyDisplay.title')}

Escucha este cuento en AudioGretel: ${productionUrl}`;
    
    setIsSharing(true);
    
    // Ir directamente a copiar al portapapeles - es más confiable
    copyToClipboard(textToShare);
  };

  const copyToClipboard = (text) => {
    console.log('copyToClipboard called with text length:', text.length);
    console.log('navigator.clipboard available:', !!navigator.clipboard);
    console.log('window.isSecureContext:', window.isSecureContext);
    
    // Método 1: Clipboard API moderno
    if (navigator.clipboard && window.isSecureContext) {
      console.log('Using modern clipboard API');
      navigator.clipboard.writeText(text).then(() => {
        console.log('Modern clipboard API success');
        setAlertMessage('✅ Texto copiado al portapapeles - Ya puedes pegarlo en WhatsApp, Telegram o cualquier app');
        setTimeout(() => setAlertMessage(null), 4000);
      }).catch((error) => {
        console.log('Modern clipboard API failed:', error);
        // Si falla, usar método legacy
        legacyCopyMethod(text);
      }).finally(() => {
        console.log('Setting isSharing to false');
        setIsSharing(false);
      });
    } else {
      console.log('Using legacy copy method');
      // Método 2: Usar método legacy directamente
      legacyCopyMethod(text);
    }
  };

  const legacyCopyMethod = (text) => {
    console.log('legacyCopyMethod called');
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      
      // Estilos para hacerlo invisible pero seleccionable
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      console.log('execCommand copy result:', successful);
      document.body.removeChild(textArea);
      
      if (successful) {
        console.log('Legacy copy success');
        setAlertMessage('✅ Texto copiado al portapapeles - Ya puedes pegarlo en WhatsApp, Telegram o cualquier app');
        setTimeout(() => setAlertMessage(null), 4000);
      } else {
        console.log('Legacy copy failed');
        setAlertMessage('❌ No se pudo copiar automáticamente. Selecciona y copia el texto manualmente.');
        setTimeout(() => setAlertMessage(null), 4000);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      setAlertMessage('❌ No se pudo copiar automáticamente. Selecciona y copia el texto manualmente.');
      setTimeout(() => setAlertMessage(null), 4000);
    } finally {
      console.log('Setting isSharing to false (legacy)');
      setIsSharing(false);
    }
  };

  return (
    <div className="story-display">
      {alertMessage && (
        <div className="alert-message">
          {alertMessage}
        </div>
      )}

      <h3>
        <span className="title-icon">📖</span>
        {story.title || (i18n.language === 'en' ? 'Your Story' : t('storyDisplay.title'))}
      </h3>

      {audioUrl && <AudioPlayer audioUrl={audioUrl} />}

      {audioUrl && (
        <div className="audio-actions">
          {/* Share button moved to AudioPlayer component */}
        </div>
      )}

      <div className="story-content">
        {story.content.split('\n').map((paragraph, index) => (
          <p key={index}>{paragraph}</p>
        ))}
      </div>

      <div className="action-section">
        <div className="action-title">{t('storyDisplay.textOptions')}</div>
        <div className="text-actions">
          <button onClick={handleCopyToClipboard}>
            <span className="btn-icon">📋</span> {t('storyDisplay.copyText')}
          </button>
          <button onClick={handleDownloadText}>
            <span className="btn-icon">💾</span> {t('storyDisplay.downloadText')}
          </button>
          <button 
            onClick={handleShareText}
            className="share-button"
            disabled={isSharing}
          >
            <span className="btn-icon">📤</span> {t('common.share')}
          </button>
        </div>
      </div>

      <div className="action-section audio-section">
        <div className="action-title">{t('storyDisplay.audioOptions')}</div>
        <div className="audio-actions">
          <div className="voice-selector">
            <label htmlFor="voiceType">{t('storyDisplay.voiceType')}</label>
            <div className="select-wrapper">
              <select
                id="voiceType"
                value={voiceType}
                onChange={(e) => setVoiceType(e.target.value)}
                disabled={isGeneratingAudio || audioCount >= 4}
              >
                <option value="female">{t('storyDisplay.voiceFemale')}</option>
                <option value="male">{t('storyDisplay.voiceMale')}</option>
                <option value="female-latam">{t('storyDisplay.voiceFemaleLatam')}</option>
                <option value="male-latam">{t('storyDisplay.voiceMaleLatam')}</option>
                <option value="female-english">{t('storyDisplay.voiceFemaleEnglish')}</option>
                <option value="male-english">{t('storyDisplay.voiceMaleEnglish')}</option>
                <option value="female-catalan">{t('storyDisplay.voiceFemaleCatalan')}</option>
                <option value="male-catalan">{t('storyDisplay.voiceMaleCatalan')}</option>
                <option value="female-galician">{t('storyDisplay.voiceFemaleGalician')}</option>
                <option value="male-galician">{t('storyDisplay.voiceMaleGalician')}</option>
                <option value="female-basque">{t('storyDisplay.voiceFemaleBasque')}</option>
                <option value="male-basque">{t('storyDisplay.voiceMaleBasque')}</option>
                <option value="female-german">{t('storyDisplay.voiceFemaleGerman')}</option>
                <option value="male-german">{t('storyDisplay.voiceMaleGerman')}</option>
                <option value="female-italian">{t('storyDisplay.voiceFemaleItalian')}</option>
                <option value="male-italian">{t('storyDisplay.voiceMaleItalian')}</option>
                <option value="male-portuguese-pt">{t('storyDisplay.voiceMalePortuguesePT')}</option>
                <option value="female-portuguese-br">{t('storyDisplay.voiceFemalePortugueseBR')}</option>
                <option value="male-portuguese-br">{t('storyDisplay.voiceMalePortugueseBR')}</option>
                <option value="female-french">{t('storyDisplay.voiceFemaleFrench')}</option>
                <option value="male-french">{t('storyDisplay.voiceMaleFrench')}</option>
              </select>
            </div>
          </div>

          <div className="voice-selector">
            <label htmlFor="speechRate">{t('storyDisplay.speechRate')}</label>
            <div className="select-wrapper">
              <select
                id="speechRate"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                disabled={isGeneratingAudio || audioCount >= 4}
              >
                <option value="0.5">{t('storyDisplay.speedVerySlow')}</option>
                <option value="0.7">{t('storyDisplay.speedSlow')}</option>
                <option value="0.8">{t('storyDisplay.speedNormal')}</option>
                <option value="1.0">{t('storyDisplay.speedFast')}</option>
                <option value="1.2">{t('storyDisplay.speedVeryFast')}</option>
              </select>
            </div>
          </div>
          
          <div className="voice-selector">
            <label htmlFor="musicTrack">{t('storyDisplay.backgroundMusic')}</label>
            <div className="select-wrapper">
              <select
                id="musicTrack"
                value={musicTrack}
                onChange={handleMusicTrackChange}
                disabled={isGeneratingAudio || audioCount >= 4}
              >
                <option value="none">{t('storyDisplay.noMusic')}</option>
                <option value="random">{t('storyDisplay.randomMusic')}</option>
                <option value="relaxing">{t('storyDisplay.relaxingMusic')}</option>
                <option value="magical">{t('storyDisplay.magicalMusic')}</option>
                <option value="adventure">{t('storyDisplay.adventureMusic')}</option>
                <option value="bedtime">{t('storyDisplay.bedtimeMusic')}</option>
                <option value="piano">{t('storyDisplay.pianoMusic')}</option>
                <option value="forest">{t('storyDisplay.forestMusic')}</option>
                <option value="magic-box">{t('storyDisplay.musicBoxMusic')}</option>
                <option value="journey">{t('storyDisplay.journeyMusic')}</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerateAudio}
            disabled={isGeneratingAudio || audioCount >= 4}
            className="generate-audio-btn"
          >
            {isGeneratingAudio ? (
              <>
                <span className="spinner"></span> {t('storyDisplay.generatingAudio')}
              </>
            ) : (
              <>
                <span className="btn-icon">🔊</span> {t('storyDisplay.generateAudio')}
              </>
            )}
          </button>
        </div>
        {audioCount >= 4 && (
          <div className="audio-limit-message">
            <p>{t('storyDisplay.audioLimitReached')}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default StoryDisplay;
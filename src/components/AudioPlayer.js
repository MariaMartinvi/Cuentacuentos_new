import React, { useRef, useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './AudioPlayer.css';

const AudioPlayer = ({ audioUrl, title }) => {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (audioRef.current) {
      const audio = audioRef.current;

      const setAudioData = () => {
        console.log('🎵 AudioPlayer: Audio loaded', {
          duration: audio.duration,
          readyState: audio.readyState,
          src: audio.src?.substring(0, 100) + '...'
        });
        setDuration(audio.duration);
      };

      const setAudioTime = () => {
        const currentTime = audio.currentTime;
        const duration = audio.duration;
        const progress = (currentTime / duration) * 100;
        
        setCurrentTime(currentTime);
        setProgress(progress);

        // Debug: Monitor potential premature stopping
        if (isPlaying && !audio.ended && audio.paused) {
          console.warn('⚠️ AudioPlayer: Audio unexpectedly paused during playback', {
            currentTime,
            duration,
            progress: Math.round(progress),
            buffered: audio.buffered.length > 0 ? {
              start: audio.buffered.start(0),
              end: audio.buffered.end(audio.buffered.length - 1)
            } : 'none',
            networkState: audio.networkState,
            readyState: audio.readyState
          });
        }

        // Check if we're approaching the end of buffered content
        if (audio.buffered.length > 0) {
          const bufferedEnd = audio.buffered.end(audio.buffered.length - 1);
          const timeToBufferEnd = bufferedEnd - currentTime;
          
          if (timeToBufferEnd < 5 && timeToBufferEnd > 0) { // Less than 5 seconds of buffer left
            console.warn('⚠️ AudioPlayer: Approaching end of buffered content', {
              currentTime,
              bufferedEnd,
              timeToBufferEnd,
              totalDuration: duration
            });
          }
        }
      };

      const handleAudioEnd = () => {
        console.log('🎵 AudioPlayer: Playback ended naturally', {
          currentTime: audio.currentTime,
          duration: audio.duration,
          ended: audio.ended
        });
        setIsPlaying(false);
      };

      const handleAudioError = (error) => {
        console.error('❌ AudioPlayer: Audio error occurred', {
          error: error,
          errorCode: audio.error?.code,
          errorMessage: audio.error?.message,
          networkState: audio.networkState,
          readyState: audio.readyState,
          src: audio.src,
          audioUrlOriginal: audioUrl
        });

        // Enhanced error diagnosis
        if (audio.error?.code === 4) { // MEDIA_ELEMENT_ERROR: Media loading aborted
          console.error('🚨 AudioPlayer: Media loading was aborted - could be URL issues');
        } else if (audio.error?.code === 3) { // MEDIA_ELEMENT_ERROR: Decoding error
          console.error('🚨 AudioPlayer: Audio decoding error - file may be corrupted');
        } else if (audio.error?.code === 2) { // MEDIA_ELEMENT_ERROR: Network error
          console.error('🚨 AudioPlayer: Network error loading audio - check connectivity/CORS');
        } else if (audio.error?.code === 1) { // MEDIA_ELEMENT_ERROR: Format not supported
          console.error('🚨 AudioPlayer: Audio format not supported');
        }

        // Check if the URL might be expired or invalid
        if (audio.src && audio.src.includes('Expires=')) {
          const match = audio.src.match(/Expires=(\d+)/);
          if (match) {
            const expiryTime = parseInt(match[1]) * 1000;
            const now = Date.now();
            if (now > expiryTime) {
              console.error('🚨 AudioPlayer: Firebase URL has EXPIRED!', {
                expired: new Date(expiryTime),
                now: new Date(now)
              });
            }
          }
        }
      };

      const handleAudioStalled = () => {
        console.warn('⚠️ AudioPlayer: Audio playback stalled', {
          currentTime: audio.currentTime,
          buffered: audio.buffered,
          networkState: audio.networkState
        });
      };

      const handleAudioWaiting = () => {
        console.warn('⚠️ AudioPlayer: Audio waiting for data', {
          currentTime: audio.currentTime,
          readyState: audio.readyState
        });
      };

      // Event listeners with enhanced logging
      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', handleAudioEnd);
      audio.addEventListener('error', handleAudioError);
      audio.addEventListener('stalled', handleAudioStalled);
      audio.addEventListener('waiting', handleAudioWaiting);

      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', handleAudioEnd);
        audio.removeEventListener('error', handleAudioError);
        audio.removeEventListener('stalled', handleAudioStalled);
        audio.removeEventListener('waiting', handleAudioWaiting);
      };
    }
  }, []);

  const togglePlay = async () => {
    const audio = audioRef.current;
    console.log('🎵 AudioPlayer: Toggle play requested', {
      isPlaying,
      currentTime: audio.currentTime,
      duration: audio.duration,
      readyState: audio.readyState,
      networkState: audio.networkState,
      src: audio.src?.substring(0, 100) + '...'
    });

    try {
      if (isPlaying) {
        audio.pause();
        console.log('⏸️ AudioPlayer: Paused successfully');
      } else {
        const playPromise = audio.play();
        console.log('▶️ AudioPlayer: Play initiated');
        
        if (playPromise !== undefined) {
          await playPromise;
          console.log('✅ AudioPlayer: Play promise resolved successfully');
        }
      }
      setIsPlaying(!isPlaying);
    } catch (error) {
      console.error('❌ AudioPlayer: Error during play/pause', {
        error: error.message,
        name: error.name,
        isPlaying,
        audioSrc: audio.src
      });
    }
  };

  const handleProgressChange = (e) => {
    const newTime = (e.target.value / 100) * duration;
    audioRef.current.currentTime = newTime;
    setProgress(e.target.value);
    setCurrentTime(newTime);
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  const getDownloadUrl = () => {
    console.log('🔗 AudioPlayer: Getting download URL', {
      audioUrlType: typeof audioUrl,
      audioUrlValue: audioUrl,
      hasUrlProperty: audioUrl && typeof audioUrl === 'object' && audioUrl.url
    });

    let finalUrl;
    
    if (typeof audioUrl === 'object' && audioUrl.url) {
      finalUrl = audioUrl.url;
    } else if (typeof audioUrl === 'string') {
      finalUrl = audioUrl;
    } else {
      console.error('❌ AudioPlayer: Invalid audioUrl format', audioUrl);
      return '';
    }

    // Validate URL format
    if (!finalUrl || finalUrl.length === 0) {
      console.error('❌ AudioPlayer: Empty URL provided');
      return '';
    }

    // Check for common Firebase URL patterns
    if (finalUrl.includes('firebasestorage.googleapis.com') || 
        finalUrl.includes('storage.googleapis.com')) {
      console.log('🔥 AudioPlayer: Firebase Storage URL detected');
      
      // Check if it has proper parameters
      if (!finalUrl.includes('alt=media')) {
        console.warn('⚠️ AudioPlayer: Firebase URL missing alt=media parameter');
      }
      
      // Check for token expiration warning
      if (finalUrl.includes('Expires=')) {
        const match = finalUrl.match(/Expires=(\d+)/);
        if (match) {
          const expiryTime = parseInt(match[1]) * 1000; // Convert to milliseconds
          const now = Date.now();
          const timeToExpiry = expiryTime - now;
          
          if (timeToExpiry < 3600000) { // Less than 1 hour
            console.warn('⚠️ AudioPlayer: Firebase URL expires soon', {
              expiryTime: new Date(expiryTime),
              timeToExpiry: Math.round(timeToExpiry / 1000 / 60) + ' minutes'
            });
          }
        }
      }
    } else if (finalUrl.startsWith('data:audio/')) {
      console.log('📊 AudioPlayer: Base64 data URL detected', {
        length: finalUrl.length,
        preview: finalUrl.substring(0, 100) + '...'
      });
      
      // Check if base64 data seems truncated
      if (finalUrl.length < 1000) {
        console.warn('⚠️ AudioPlayer: Base64 data seems too short for audio file');
      }
    } else {
      console.log('🔗 AudioPlayer: Other URL format detected:', finalUrl.substring(0, 100) + '...');
    }

    console.log('✅ AudioPlayer: Final URL prepared:', finalUrl.substring(0, 100) + '...');
    return finalUrl;
  };

  const handleShareAudio = async () => {
    if (isSharing) return;
    
    setIsSharing(true);
    
    try {
      const productionUrl = 'https://www.audiogretel.com';
      const textToShare = `🎧 ${title || 'Cuento'}

Escucha este cuento en AudioGretel: ${productionUrl}`;
      
      // Check if Web Share API is available and supports files
      if (navigator.share) {
        try {
          // Try to share the audio file if possible
          const response = await fetch(getDownloadUrl());
          const blob = await response.blob();
          const file = new File([blob], `${title || 'cuento'}.mp3`, { type: 'audio/mp3' });
          
          await navigator.share({
            title: title || 'Cuento',
            text: textToShare,
            files: [file]
          });
        } catch (shareError) {
          // Fallback to text-only sharing
          await navigator.share({
            title: title || 'Cuento',
            text: textToShare
          });
        }
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(textToShare);
        // You could add a toast notification here
        console.log('Texto copiado al portapapeles');
      }
    } catch (error) {
      console.error('Error sharing audio:', error);
    } finally {
      setIsSharing(false);
    }
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={getDownloadUrl()} />

      <div className="player-controls">
        <button
          onClick={togglePlay}
          className="play-pause-btn"
          aria-label={isPlaying ? t('audioPlayer.pause') : t('audioPlayer.play')}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>

        <div className="time-display">
          {formatTime(currentTime)}
        </div>

        <input
          type="range"
          className="progress-bar"
          value={progress}
          onChange={handleProgressChange}
          min="0"
          max="100"
          step="0.1"
          aria-label={t('audioPlayer.progress')}
        />

        <div className="time-display">
          {formatTime(duration)}
        </div>

        <a 
          href={getDownloadUrl()} 
          download={`${title || 'audio'}.mp3`}
          className="download-audio-btn"
          aria-label={t('audioPlayer.download')}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('audioPlayer.download')}
        </a>

        <button 
          className="share-audio-btn"
          onClick={handleShareAudio}
          aria-label={t('audioPlayer.share.audioTitle')}
        >
          📤 {t('storyDisplay.shareAudio', 'Compartir')}
        </button>
      </div>
    </div>
  );
};

export default AudioPlayer;
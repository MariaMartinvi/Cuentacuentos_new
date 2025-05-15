import React, { useState, useRef, useEffect } from 'react';
import './AudioPlayer.css';
import { useTranslation } from 'react-i18next';
import { fetchThroughProxy } from '../services/proxyService';

const AudioPlayer = ({ audioUrl, title }) => {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceNodeRef = useRef(null);
  const gainNodeRef = useRef(null);
  const audioBufferRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [debugInfo, setDebugInfo] = useState('');
  const [usingWebAudio, setUsingWebAudio] = useState(true); // Use Web Audio API by default
  const [startTime, setStartTime] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const animationRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);

  // Initialize Web Audio API
  useEffect(() => {
    // Create AudioContext
    if (!audioContextRef.current) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
      } catch (err) {
        console.error('Failed to initialize Web Audio API:', err);
        setUsingWebAudio(false);
      }
    }

    return () => {
      // Clean up animation frame
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      // Stop any playing audio
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {
          // Ignore errors if already stopped
        }
      }
    };
  }, []);

  // Load and decode audio
  useEffect(() => {
    const fetchAudio = async () => {
      setLoading(true);
      setError(null);
      
      if (!audioUrl) {
        setError('No audio URL provided');
        setLoading(false);
        return;
      }
      
      try {
        let sourceUrl = '';
        if (typeof audioUrl === 'object' && audioUrl.url) {
          sourceUrl = audioUrl.url;
        } else if (typeof audioUrl === 'string') {
          sourceUrl = audioUrl;
        } else {
          throw new Error('Invalid audio URL format');
        }
        
        // Ensure the URL has the alt=media parameter
        if (!sourceUrl.includes('alt=media')) {
          sourceUrl = sourceUrl.includes('?') ? `${sourceUrl}&alt=media` : `${sourceUrl}?alt=media`;
        }
        
        // Try direct fetch first since it's more reliable
        try {
          // Fallback to direct fetch with improved headers
          const response = await fetch(sourceUrl, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            headers: {
              'Accept': 'audio/*',
              'Origin': window.location.origin
            },
            cache: 'no-cache'
          });
          
          if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          
          // Decode audio data
          const audioContext = audioContextRef.current;
          if (!audioContext) {
            throw new Error('Audio context not available');
          }
          
          const decodedData = await audioContext.decodeAudioData(arrayBuffer);
          
          // Store the decoded audio buffer
          audioBufferRef.current = decodedData;
          setAudioBuffer(decodedData);
          setDuration(decodedData.duration);
          setLoading(false);
          return;
        } catch (directFetchErr) {
          // Continue to proxy fetch as fallback
        }
        
        // Try using proxy as fallback
        try {
          const audioBlob = await fetchThroughProxy(sourceUrl, 'blob');
          const arrayBuffer = await audioBlob.arrayBuffer();
          
          // Decode audio data
          const audioContext = audioContextRef.current;
          if (!audioContext) {
            throw new Error('Audio context not available');
          }
          
          const decodedData = await audioContext.decodeAudioData(arrayBuffer);
          
          // Store the decoded audio buffer
          audioBufferRef.current = decodedData;
          setAudioBuffer(decodedData);
          setDuration(decodedData.duration);
          setLoading(false);
          return;
        } catch (proxyErr) {
          throw proxyErr; // Rethrow to be caught by outer catch
        }
      } catch (err) {
        console.error('Error loading audio:', err);
        
        // Fallback to HTML5 Audio if Web Audio API fails
        if (usingWebAudio && retryCount < 1) {
          setUsingWebAudio(false);
          setRetryCount(retryCount + 1);
        } else {
          setError(`Failed to load audio: ${err.message}`);
          setLoading(false);
        }
      }
    };
    
    fetchAudio();
  }, [audioUrl, usingWebAudio, retryCount]);

  // Update current time during playback
  const updatePlaybackTime = () => {
    if (isPlaying && audioContextRef.current && startTime > 0) {
      const elapsed = audioContextRef.current.currentTime - startTime;
      setCurrentTime(elapsed);
      animationRef.current = requestAnimationFrame(updatePlaybackTime);
    }
  };

  // Play/pause audio using Web Audio API
  const togglePlay = () => {
    if (!usingWebAudio) {
      // HTML5 Audio fallback
      if (audioRef.current) {
        if (isPlaying) {
          audioRef.current.pause();
        } else {
          audioRef.current.play().catch(err => {
            console.error('Error playing audio:', err);
            setError(`Error playing audio: ${err.message}`);
          });
        }
        setIsPlaying(!isPlaying);
      }
      return;
    }
    
    if (!audioContextRef.current || !audioBufferRef.current) {
      return;
    }
    
    try {
      // Resume audio context if it's suspended (browser autoplay policy)
      if (audioContextRef.current.state === 'suspended') {
        audioContextRef.current.resume();
      }
      
      if (isPlaying) {
        // Stop playback
        if (sourceNodeRef.current) {
          sourceNodeRef.current.stop();
          sourceNodeRef.current = null;
        }
        cancelAnimationFrame(animationRef.current);
      } else {
        // Create new source node
        const source = audioContextRef.current.createBufferSource();
        source.buffer = audioBufferRef.current;
        source.connect(gainNodeRef.current);
        
        // Calculate start position
        const offset = currentTime;
        source.start(0, offset);
        setStartTime(audioContextRef.current.currentTime - offset);
        
        // Set up ended event
        source.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
          setStartTime(0);
          sourceNodeRef.current = null;
          cancelAnimationFrame(animationRef.current);
        };
        
        // Store source node reference
        sourceNodeRef.current = source;
        
        // Start animation frame for time updates
        animationRef.current = requestAnimationFrame(updatePlaybackTime);
      }
      
      setIsPlaying(!isPlaying);
    } catch (playError) {
      console.error('Error controlling playback:', playError);
      setError(`Error controlling playback: ${playError.message}`);
    }
  };

  // Handle progress bar click
  const handleProgress = (e) => {
    if (!usingWebAudio) {
      // HTML5 Audio fallback
      if (audioRef.current) {
        const progressBar = e.currentTarget;
        const position = e.nativeEvent.offsetX / progressBar.offsetWidth;
        audioRef.current.currentTime = position * audioRef.current.duration;
      }
      return;
    }
    
    if (!audioBufferRef.current) return;
    
    const progressBar = e.currentTarget;
    const position = e.nativeEvent.offsetX / progressBar.offsetWidth;
    const newTime = position * duration;
    
    // Stop current playback
    if (sourceNodeRef.current && isPlaying) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current = null;
    }
    
    setCurrentTime(newTime);
    
    // If currently playing, restart from new position
    if (isPlaying) {
      const source = audioContextRef.current.createBufferSource();
      source.buffer = audioBufferRef.current;
      source.connect(gainNodeRef.current);
      source.start(0, newTime);
      setStartTime(audioContextRef.current.currentTime - newTime);
      
      // Set up ended event
      source.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setStartTime(0);
        sourceNodeRef.current = null;
        cancelAnimationFrame(animationRef.current);
      };
      
      // Store source node reference
      sourceNodeRef.current = source;
    }
  };

  // Format time display
  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  // Get the download URL (direct URL for download button)
  const getDownloadUrl = () => {
    if (typeof audioUrl === 'object' && audioUrl.url) {
      return audioUrl.url;
    }
    return audioUrl;
  };

  // Toggle between Web Audio API and HTML5 Audio
  const toggleAudioEngine = () => {
    setUsingWebAudio(!usingWebAudio);
    setIsPlaying(false);
    setCurrentTime(0);
    setError(null);
  };

  // HTML5 Audio fallback
  useEffect(() => {
    if (!usingWebAudio && audioUrl) {
      let sourceUrl = '';
      if (typeof audioUrl === 'object' && audioUrl.url) {
        sourceUrl = audioUrl.url;
      } else if (typeof audioUrl === 'string') {
        sourceUrl = audioUrl;
      }
      
      if (audioRef.current) {
        audioRef.current.src = sourceUrl;
        audioRef.current.load();
        
        audioRef.current.onloadedmetadata = () => {
          setDuration(audioRef.current.duration);
          setLoading(false);
        };
        
        audioRef.current.ontimeupdate = () => {
          setCurrentTime(audioRef.current.currentTime);
        };
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };
        
        audioRef.current.onerror = (e) => {
          console.error('HTML5 Audio error:', e);
          setError(`HTML5 Audio error: ${e.target.error ? e.target.error.message : 'Unknown error'}`);
          setLoading(false);
        };
      }
    }
  }, [audioUrl, usingWebAudio]);

  return (
    <div className="audio-player-container">
      <h3>{title || t('audioPlayer.title')}</h3>
      
      {error && (
        <div className="audio-player-error">
          {error}
          <div className="audio-error-actions">
            <button onClick={toggleAudioEngine} className="toggle-audio-engine-btn">
              {usingWebAudio ? 'Try HTML5 Audio' : 'Try Web Audio API'}
            </button>
          </div>
        </div>
      )}
      
      <div className="audio-player-controls">
        <button 
          className="audio-player-button" 
          onClick={togglePlay}
          disabled={loading || (!audioBuffer && usingWebAudio)}
          aria-label={isPlaying ? t('audioPlayer.pause') : t('audioPlayer.play')}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
        
        <div className="audio-player-time">
          {formatTime(currentTime)}
        </div>
        
        <div 
          className="audio-player-progress" 
          onClick={handleProgress}
          aria-label={t('audioPlayer.progress')}
        >
          <div 
            className="audio-player-progress-bar" 
            style={{ width: `${(currentTime / duration) * 100 || 0}%` }}
          />
        </div>
        
        <div className="audio-player-time">
          {formatTime(duration)}
        </div>
        
        <a 
          href={getDownloadUrl()} 
          download={`${t('audioPlayer.downloadFileName')}.mp3`}
          className="audio-download-button"
          aria-label={t('audioPlayer.download')}
          target="_blank"
          rel="noopener noreferrer"
        >
          {t('audioPlayer.download')}
        </a>
      </div>
      
      {loading && (
        <div className="audio-loading">
          Loading audio...
        </div>
      )}
      
      {/* HTML5 Audio element (hidden) */}
      {!usingWebAudio && (
        <audio ref={audioRef} style={{ display: 'none' }} />
      )}
    </div>
  );
};

export default AudioPlayer;
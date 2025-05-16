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
  const [usingWebAudio, setUsingWebAudio] = useState(true);
  const [startTime, setStartTime] = useState(0);
  const [audioBuffer, setAudioBuffer] = useState(null);
  const animationRef = useRef(null);
  const [retryCount, setRetryCount] = useState(0);
  const [showError, setShowError] = useState(false);
  const loadingTimeoutRef = useRef(null);

  // Initialize Web Audio API
  useEffect(() => {
    if (!audioContextRef.current) {
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        audioContextRef.current = new AudioContext();
        gainNodeRef.current = audioContextRef.current.createGain();
        gainNodeRef.current.connect(audioContextRef.current.destination);
      } catch (err) {
        console.error('[AUDIO] Failed to initialize Web Audio API:', err);
        setUsingWebAudio(false);
      }
    }

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
      
      if (sourceNodeRef.current) {
        try {
          sourceNodeRef.current.stop();
        } catch (e) {
          // Ignore errors if already stopped
        }
      }

      if (loadingTimeoutRef.current) {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
  }, []);

  // Load and decode audio
  useEffect(() => {
    const fetchAudio = async () => {
      setLoading(true);
      setError(null);
      setShowError(false);
      
      // Set a timeout to prevent infinite loading
      loadingTimeoutRef.current = setTimeout(() => {
        if (loading) {
          console.warn('[AUDIO] Loading timeout reached, switching to HTML5 Audio');
          setUsingWebAudio(false);
          setLoading(false);
        }
      }, 10000); // 10 second timeout
      
      if (!audioUrl) {
        console.error("[AUDIO] No audio URL provided");
        setError('No audio URL provided');
        setShowError(true);
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

        console.log("[AUDIO] Source URL:", sourceUrl);
        
        // Ensure the URL has the alt=media parameter
        if (!sourceUrl.includes('alt=media')) {
          sourceUrl = sourceUrl.includes('?') ? `${sourceUrl}&alt=media` : `${sourceUrl}?alt=media`;
        }
        
        // Try direct fetch first with timeout
        try {
          console.log("[AUDIO] Attempting direct fetch...");
          const controller = new AbortController();
          const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
          
          const response = await fetch(sourceUrl, {
            method: 'GET',
            mode: 'cors',
            credentials: 'omit',
            headers: {
              'Accept': 'audio/*',
              'Origin': window.location.origin
            },
            cache: 'no-cache',
            signal: controller.signal
          });
          
          clearTimeout(timeoutId);
          
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
          clearTimeout(loadingTimeoutRef.current);
          return;
        } catch (directFetchErr) {
          console.warn("[AUDIO] Direct fetch failed:", directFetchErr);
          // Continue to proxy fetch as fallback
        }
        
        // Try using proxy as fallback with timeout
        try {
          console.log("[AUDIO] Attempting proxy fetch...");
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
          clearTimeout(loadingTimeoutRef.current);
          return;
        } catch (proxyErr) {
          throw proxyErr;
        }
      } catch (err) {
        console.error('[AUDIO] Error loading audio:', err);
        
        // Fallback to HTML5 Audio if Web Audio API fails
        if (usingWebAudio && retryCount < 1) {
          setUsingWebAudio(false);
          setRetryCount(retryCount + 1);
          console.log("[AUDIO] Switching to HTML5 Audio fallback");
        } else {
          setError(`Failed to load audio: ${err.message}`);
          if (!usingWebAudio || retryCount >= 1) {
            setTimeout(() => {
              if (audioRef.current && audioRef.current.readyState > 0) {
                console.log("[AUDIO] Audio is actually working, hiding error");
                setShowError(false);
              } else {
                setShowError(true);
              }
            }, 2000);
          }
          setLoading(false);
        }
      } finally {
        clearTimeout(loadingTimeoutRef.current);
      }
    };
    
    fetchAudio();
  }, [audioUrl, usingWebAudio, retryCount]);

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
        console.log("[AUDIO] Setting HTML5 audio source:", sourceUrl);
        audioRef.current.src = sourceUrl;
        audioRef.current.load();
        
        // Set a timeout for HTML5 audio loading
        const html5Timeout = setTimeout(() => {
          if (loading) {
            console.warn('[AUDIO] HTML5 Audio loading timeout');
            setError('Audio loading timeout');
            setShowError(true);
            setLoading(false);
          }
        }, 10000);
        
        audioRef.current.onloadedmetadata = () => {
          console.log("[AUDIO] HTML5 audio metadata loaded");
          setDuration(audioRef.current.duration);
          setLoading(false);
          setShowError(false);
          clearTimeout(html5Timeout);
        };
        
        audioRef.current.ontimeupdate = () => {
          setCurrentTime(audioRef.current.currentTime);
          if (error) {
            setShowError(false);
          }
        };
        
        audioRef.current.onended = () => {
          setIsPlaying(false);
          setCurrentTime(0);
        };
        
        audioRef.current.oncanplay = () => {
          console.log("[AUDIO] HTML5 audio can play");
          setShowError(false);
          clearTimeout(html5Timeout);
        };
        
        audioRef.current.onerror = (e) => {
          console.error('[AUDIO] HTML5 Audio error:', e);
          setError(`HTML5 Audio error: ${e.target.error ? e.target.error.message : 'Unknown error'}`);
          setShowError(true);
          setLoading(false);
          clearTimeout(html5Timeout);
        };
      }
    }
  }, [audioUrl, usingWebAudio, error, loading]);

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
            console.error('[AUDIO] Error playing audio:', err);
            setError(`Error playing audio: ${err.message}`);
            setShowError(true);
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
      // Resume audio context if it's suspended
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
      console.error('[AUDIO] Error controlling playback:', playError);
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

  // Get the download URL
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
    setShowError(false);
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={getDownloadUrl()} />
      <div className="player-controls">
        <button
          onClick={togglePlay}
          className="play-pause-btn"
          disabled={loading}
          aria-label={isPlaying ? t('audioPlayer.pause') : t('audioPlayer.play')}
        >
          {isPlaying ? '❚❚' : '▶'}
        </button>
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
      </div>
    </div>
  );
};

export default AudioPlayer;
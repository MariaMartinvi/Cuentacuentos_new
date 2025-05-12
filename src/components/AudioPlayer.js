import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

const AudioPlayer = ({ audioUrl, title }) => {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const audio = audioRef.current;
    
    if (!audio) return;

    // Event listeners
    const setAudioData = () => {
      setDuration(audio.duration);
      setLoading(false);
    };

    const setAudioTime = () => setCurrentTime(audio.currentTime);
    
    const handleEnded = () => setIsPlaying(false);

    // Add event listeners
    audio.addEventListener('loadeddata', setAudioData);
    audio.addEventListener('timeupdate', setAudioTime);
    audio.addEventListener('ended', handleEnded);

    // Clean up
    return () => {
      audio.removeEventListener('loadeddata', setAudioData);
      audio.removeEventListener('timeupdate', setAudioTime);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [audioRef]);

  // Reset player when audio URL changes
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setLoading(true);
  }, [audioUrl]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleProgress = (e) => {
    const progressBar = e.currentTarget;
    const position = e.nativeEvent.offsetX / progressBar.offsetWidth;
    const newTime = position * duration;
    
    if (audioRef.current) {
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  const formatTime = (time) => {
    if (isNaN(time)) return '0:00';
    
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    return `${minutes}:${seconds}`;
  };

  return (
    <div className="audio-player-container">
      <h3>{title || t('audioPlayer.title')}</h3>
      
      <audio ref={audioRef} src={audioUrl} preload="metadata" />
      
      <div className="audio-player-controls">
        <button 
          className="audio-player-button" 
          onClick={togglePlay}
          disabled={loading}
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
          href={audioUrl} 
          download={`${t('audioPlayer.downloadFileName')}.mp3`}
          className="audio-download-button"
          aria-label={t('audioPlayer.download')}
        >
          {t('audioPlayer.download')}
        </a>
      </div>
    </div>
  );
};

export default AudioPlayer;
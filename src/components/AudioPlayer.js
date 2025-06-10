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
        setDuration(audio.duration);
      };

      const setAudioTime = () => {
        setCurrentTime(audio.currentTime);
        setProgress((audio.currentTime / audio.duration) * 100);
      };

      // Event listeners
      audio.addEventListener('loadeddata', setAudioData);
      audio.addEventListener('timeupdate', setAudioTime);
      audio.addEventListener('ended', () => setIsPlaying(false));

      return () => {
        audio.removeEventListener('loadeddata', setAudioData);
        audio.removeEventListener('timeupdate', setAudioTime);
        audio.removeEventListener('ended', () => setIsPlaying(false));
      };
    }
  }, []);

  const togglePlay = () => {
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
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
    if (typeof audioUrl === 'object' && audioUrl.url) {
      return audioUrl.url;
    }
    return audioUrl;
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
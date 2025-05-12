import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

function AudioPlayer({ audioUrl }) {
  const { t } = useTranslation();
  const audioRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);

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

      // Set audio to loop to ensure continuous background music
      audio.loop = true;

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

  const handleDownloadAudio = () => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `${t('audioPlayer.downloadFileName')}-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={audioUrl} loop />

      <div className="player-header">
        <div className="player-title">
          <span className="audio-icon">🔊</span> {t('audioPlayer.title')}
        </div>
      </div>

      <div className="player-controls">
        <button
          onClick={togglePlay}
          className="play-pause-btn"
          aria-label={isPlaying ? t('audioPlayer.pause') : t('audioPlayer.play')}
        >
          {isPlaying ? (
            <>⏸️ {t('audioPlayer.pause')}</>
          ) : (
            <>▶️ {t('audioPlayer.play')}</>
          )}
        </button>

        <div className="progress-container">
          <div className="time-display current-time">
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

          <div className="time-display duration">
            {formatTime(duration)}
          </div>
        </div>

        <button
          onClick={handleDownloadAudio}
          className="download-audio-btn"
          aria-label={t('audioPlayer.download')}
        >
          ⬇️ {t('audioPlayer.download')}
        </button>
      </div>
    </div>
  );
}

export default AudioPlayer;
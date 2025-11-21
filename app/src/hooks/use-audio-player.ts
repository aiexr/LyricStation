import { useEffect, useRef, useState } from 'react';

export default function useAudioPlayer() {
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [audioFileName, setAudioFileName] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState(1);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    return () => {
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
    };
  }, [audioUrl]);

  useEffect(() => {
    let raf: number;
    const update = () => {
      setCurrentTime(audioRef.current?.currentTime ?? 0);
      raf = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(raf);
  }, []);

  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate]);

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setAudioUrl(url);
    setAudioFileName(file.name);
  };

  const removeAudioFile = () => {
    if (audioUrl) {
      URL.revokeObjectURL(audioUrl);
    }
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
    setAudioUrl(null);
    setAudioFileName(null);
    setDuration(0);
    setCurrentTime(0);
    setPlaying(false);
  };

  const togglePlay = () => {
    const media = audioRef.current;
    if (!media) return;
    if (media.paused) {
      media.play();
      setPlaying(true);
    } else {
      media.pause();
      setPlaying(false);
    }
  };

  return {
    audioUrl,
    setAudioUrl,
    audioFileName,
    setAudioFileName,
    currentTime,
    setCurrentTime,
    duration,
    setDuration,
    audioRef,
    playing,
    volume,
    setVolume,
    playbackRate,
    setPlaybackRate,
    handleAudioUpload,
    removeAudioFile,
    togglePlay,
  };
}

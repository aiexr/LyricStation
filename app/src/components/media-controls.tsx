import React, { useEffect } from 'react';
import { formatTime } from '../utils/time-utils';

interface Props {
  audioUrl: string | null;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  playing: boolean;
  onTogglePlay: () => void;
  currentTime: number;
  setCurrentTime: (t: number) => void;
  duration: number;
  setDuration: (d: number) => void;
  volume: number;
  setVolume: (v: number) => void;
  playbackRate: number;
  setPlaybackRate: (r: number) => void;
  /**
   * When true the play/pause button fills the entire window and is invisible
   * so clicking anywhere toggles playback.
   */
  fullscreenPlayButton?: boolean;
}

const MediaControls: React.FC<Props> = ({
  audioUrl,
  audioRef,
  playing,
  onTogglePlay,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  volume,
  setVolume,
  playbackRate,
  setPlaybackRate,
  fullscreenPlayButton = false,
}) => {
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume, audioRef]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.playbackRate = playbackRate;
    }
  }, [playbackRate, audioRef]);

  return (
    <>
      <audio
        ref={audioRef}
        src={audioUrl ?? undefined}
        onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
        style={{ display: 'none' }}
      />
      <div
        style={{ display: 'flex', alignItems: 'center', marginBottom: '1rem' }}
      >
        <button
          onClick={onTogglePlay}
          style={
            fullscreenPlayButton
              ? {
                  position: 'fixed',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  opacity: 0,
                  cursor: 'none',
                  border: 'none',
                  background: 'transparent',
                }
              : undefined
          }
        >
          {playing ? 'Pause' : 'Play'}
        </button>
        <span style={{ margin: '0 0.5rem' }}>
          {formatTime(currentTime)} / {formatTime(duration)}
        </span>
        <input
          type="range"
          min={0}
          max={duration}
          step={0.01}
          value={currentTime}
          onChange={(e) => {
            const val = parseFloat(e.target.value);
            if (audioRef.current) {
              audioRef.current.currentTime = val;
            }
            setCurrentTime(val);
          }}
          style={{ flex: 1 }}
        />
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          marginBottom: '1rem',
          marginTop: '0.25rem',
        }}
      >
        <label style={{ display: 'flex', alignItems: 'center' }}>
          Volume:
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            style={{ marginLeft: '0.5rem', width: '120px' }}
          />
        </label>
        <div
          style={{
            marginLeft: '1rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          Speed:
          {[0.25, 0.5, 0.75, 1].map((rate) => (
            <button
              key={rate}
              onClick={() => setPlaybackRate(rate)}
              style={{
                marginLeft: '0.25rem',
                padding: '0.25rem 0.5rem',
                fontWeight: playbackRate === rate ? 'bold' : 'normal',
              }}
            >
              {rate}x
            </button>
          ))}
        </div>
      </div>
    </>
  );
};

export default MediaControls;

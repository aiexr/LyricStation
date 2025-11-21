import React from 'react';
import type { DisplayPrefs } from '../settings/editor-display-settings';
import { BASE_RESOLUTION, CANVAS_HEIGHT } from '../utils/lrc-editor-constants';

export default function useWaveform(
  audioUrl: string | null,
  duration: number,
  canvasRef: React.RefObject<HTMLCanvasElement | null>,
  sensitivity: number,
  prefs: DisplayPrefs,
) {
  const [waveform, setWaveform] = React.useState<number[]>([]);

  React.useEffect(() => {
    if (!audioUrl) {
      setWaveform([]);
      return;
    }
    let cancelled = false;
    const ctx = new AudioContext();
    fetch(audioUrl)
      .then((res) => res.arrayBuffer())
      .then((buf) => ctx.decodeAudioData(buf))
      .then((audio) => {
        if (cancelled) return;
        const data = audio.getChannelData(0);
        const samples = Math.floor(duration * BASE_RESOLUTION);
        const block = Math.floor(data.length / samples);
        const waveformData: number[] = [];
        for (let i = 0; i < samples; i++) {
          let sum = 0;
          for (let j = 0; j < block; j++)
            sum += Math.abs(data[i * block + j] || 0);
          waveformData.push(sum / block);
        }
        setWaveform(waveformData);
      })
      .catch(() => setWaveform([]));
    return () => {
      cancelled = true;
      ctx.close();
    };
  }, [audioUrl, duration]);

  React.useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || waveform.length === 0) return;
    canvas.width = waveform.length;
    canvas.height = CANVAS_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = prefs.waveformColor;
    ctx.strokeStyle = prefs.waveformColor;
    if (prefs.waveformType === 'bars') {
      for (let i = 0; i < waveform.length; i++) {
        const val = Math.min(waveform[i] * sensitivity, 1);
        const h = val * CANVAS_HEIGHT;
        ctx.fillRect(i, (CANVAS_HEIGHT - h) / 2, 1, h);
      }
    } else {
      ctx.beginPath();
      for (let i = 0; i < waveform.length; i++) {
        const val = Math.min(waveform[i] * sensitivity, 1);
        const y = CANVAS_HEIGHT - val * CANVAS_HEIGHT;
        if (i === 0) ctx.moveTo(i, y);
        else ctx.lineTo(i, y);
      }
      ctx.stroke();
    }
  }, [waveform, sensitivity, prefs.waveformType, prefs.waveformColor]);

  return waveform;
}

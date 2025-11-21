import { useCallback, useRef, useState } from 'react';

export interface RecordingSettings {
  mimeType: string;
  videoBitsPerSecond: number;
  frameRate: number;
  fileExtension: string;
}

export interface ScreenRecorder {
  recording: boolean;
  start: (onStarted?: () => void) => Promise<void>;
  stop: () => void;
}

export function useScreenRecorder(settings: RecordingSettings): ScreenRecorder {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const [recording, setRecording] = useState(false);

  const stop = useCallback(() => {
    const recorder = mediaRecorderRef.current;
    if (recorder && recording) {
      recorder.stop();
      setRecording(false);
    }
  }, [recording]);

  const start = useCallback(
    async (onStarted?: () => void) => {
      if (recording) {
        stop();
      }
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: settings.frameRate },
        audio: true,
      });
      const recorder = new MediaRecorder(stream, {
        mimeType: settings.mimeType,
        videoBitsPerSecond: settings.videoBitsPerSecond,
      });
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: settings.mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recording.${settings.fileExtension}`;
        a.click();
        URL.revokeObjectURL(url);
        stream.getTracks().forEach((t) => t.stop());
      };
      recorder.onstart = () => {
        setRecording(true);
        if (onStarted) onStarted();
      };
      mediaRecorderRef.current = recorder;
      recorder.start();
    },
    [recording, settings, stop],
  );

  return { recording, start, stop };
}

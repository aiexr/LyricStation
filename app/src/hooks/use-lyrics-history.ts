import { useCallback, useState } from 'react';
import type { LrcLine } from '../utils/parse-lrc';

const cloneLines = (lines: LrcLine[]): LrcLine[] =>
  lines.map((l) => ({ ...l }));

export default function useLyricsHistory(
  lyricsRef: React.MutableRefObject<LrcLine[]>,
  setLyrics: React.Dispatch<React.SetStateAction<LrcLine[]>>,
  setSelectedIdx: React.Dispatch<React.SetStateAction<number | null>>,
) {
  const [history, setHistory] = useState<LrcLine[][]>([]);
  const [redoHistory, setRedoHistory] = useState<LrcLine[][]>([]);

  const pushHistory = useCallback((lines: LrcLine[]) => {
    setHistory((h) => [...h, cloneLines(lines)]);
    setRedoHistory([]);
  }, []);

  const updateLyrics = useCallback(
    (lines: LrcLine[], save = true) => {
      if (save) pushHistory(lyricsRef.current);
      const cloned = cloneLines(lines);
      setLyrics(cloned);
      lyricsRef.current = cloned;
    },
    [lyricsRef, pushHistory, setLyrics],
  );

  const undo = useCallback(() => {
    setHistory((h) => {
      if (h.length === 0) return h;
      const prev = h[h.length - 1];
      setRedoHistory((r) => [...r, cloneLines(lyricsRef.current)]);
      const clonedPrev = cloneLines(prev);
      setLyrics(clonedPrev);
      lyricsRef.current = clonedPrev;
      return h.slice(0, -1);
    });
    setSelectedIdx(null);
  }, [lyricsRef, setLyrics, setSelectedIdx]);

  const redo = useCallback(() => {
    setRedoHistory((r) => {
      if (r.length === 0) return r;
      const next = r[r.length - 1];
      setHistory((h) => [...h, cloneLines(lyricsRef.current)]);
      const clonedNext = cloneLines(next);
      setLyrics(clonedNext);
      lyricsRef.current = clonedNext;
      return r.slice(0, -1);
    });
    setSelectedIdx(null);
  }, [lyricsRef, setLyrics, setSelectedIdx]);

  const resetHistory = () => {
    setHistory([]);
    setRedoHistory([]);
  };

  return {
    updateLyrics,
    undo,
    redo,
    resetHistory,
    canUndo: history.length > 0,
    canRedo: redoHistory.length > 0,
  };
}

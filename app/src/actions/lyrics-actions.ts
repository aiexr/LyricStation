import type React from 'react';
import { parseLyrics, type LrcLine, generateId } from '../utils/parse-lrc';

export function handleLrcUpload(
  e: React.ChangeEvent<HTMLInputElement>,
  lyricsInitialized: boolean,
  setLrcFileName: (name: string) => void,
  updateLyrics: (lines: LrcLine[], reset?: boolean) => void,
  setLyricsInitialized: (value: boolean) => void,
  setLyricsInputChosen: (value: boolean) => void,
): void {
  const file = e.target.files?.[0];
  if (!file) return;
  if (lyricsInitialized) {
    const confirmChange = window.confirm(
      'Warning, changing the file will result in a loss of data if you do not save your current LRC file.',
    );
    if (!confirmChange) {
      e.target.value = '';
      return;
    }
  }
  setLrcFileName(file.name.replace(/\.ass$/i, '.lrc'));
  void file
    .text()
    .then((text) => {
      updateLyrics(parseLyrics(text), false);
      setLyricsInitialized(true);
      setLyricsInputChosen(true);
    })
    .catch((err) => console.error(err));
}

export function removeLyricsFile(
  setLyrics: (lines: LrcLine[]) => void,
  setLyricsInitialized: (value: boolean) => void,
  setLyricsInputChosen: (value: boolean) => void,
  setLrcFileName: (name: string) => void,
  setEditing: (value: boolean) => void,
  resetHistory: () => void,
): void {
  const confirmRemove = window.confirm(
    'Removing the uploaded lyrics will discard any current work that is not saved. Continue?',
  );
  if (!confirmRemove) return;
  setLyrics([]);
  setLyricsInitialized(false);
  setLyricsInputChosen(false);
  setLrcFileName('lyrics.lrc');
  setEditing(false);
  resetHistory();
}

export function deleteLine(
  idx: number,
  lyrics: LrcLine[],
  updateLyrics: (lines: LrcLine[]) => void,
  removeTranslationLine: (index: number) => void,
): void {
  removeTranslationLine(idx);
  updateLyrics(lyrics.filter((_, i) => i !== idx));
}

export async function splitLine(
  idx: number,
  lyrics: LrcLine[],
  showPrompt: (title: string, initial: string) => Promise<string | null>,
  insertTranslationLines: (index: number, count: number) => void,
  updateLyrics: (lines: LrcLine[]) => void,
): Promise<void> {
  const current = lyrics[idx];
  const input = await showPrompt(
    'Insert "|" where you want to split',
    current.text,
  );
  if (input === null) return;
  const parts = input.split('|');
  if (parts.length <= 1) {
    if (input !== current.text) {
      const updated = [...lyrics];
      updated[idx] = { ...current, text: input };
      updateLyrics(updated);
    }
    return;
  }
  const segLen = (current.end - current.time) / parts.length;
  const newLines: LrcLine[] = parts.map((text, i) => ({
    id: generateId(),
    time: current.time + segLen * i,
    end: current.time + segLen * (i + 1),
    text: text.trim(),
  }));
  if (parts.length > 1) {
    insertTranslationLines(idx + 1, parts.length - 1);
  }
  updateLyrics([
    ...lyrics.slice(0, idx),
    ...newLines,
    ...lyrics.slice(idx + 1),
  ]);
}

export function applyOffsetToLyrics(
  offsetMs: number,
  lyrics: LrcLine[],
  updateLyrics: (lines: LrcLine[]) => void,
  resetOffset: () => void,
): void {
  if (offsetMs === 0) return;
  const sec = offsetMs / 1000;
  const adjusted = lyrics.map((l) => ({
    ...l,
    time: l.time + sec,
    end: l.end + sec,
  }));
  updateLyrics(adjusted);
  resetOffset();
}

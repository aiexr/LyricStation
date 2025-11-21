import type { LrcLine } from './parse-lrc';
import type { LyricLine } from '@applemusic-like-lyrics/core';

export const mapLines = (
  lines: LrcLine[],
  translation: string[] = [],
): LyricLine[] =>
  lines.map((l, idx) => ({
    words: [
      {
        word: l.text,
        startTime: Math.round(l.time * 1000),
        endTime: Math.round(l.end * 1000),
        obscene: false,
      },
    ],
    startTime: Math.round(l.time * 1000),
    endTime: Math.round(l.end * 1000),
    translatedLyric: translation[idx] ?? '',
    romanLyric: '', // <--- although its reserved for roman, we could actually fit a 3rd translation
    isBG: false,
    isDuet: false,
  }));

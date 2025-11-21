import { useCallback, useEffect, useRef, useState } from 'react';
import { parseLyrics, type LrcLine, stringifyLrc } from '../utils/parse-lrc';
import { saveTextFile } from '../utils/file-utils';

interface Args {
  lyrics: LrcLine[];
  updateLyrics: (lines: LrcLine[], save?: boolean) => void;
  offsetMs: number;
  lrcFileName: string;
}

export default function useTranslation({
  lyrics,
  updateLyrics,
  offsetMs,
  lrcFileName,
}: Args) {
  const [translation, setTranslation] = useState(false);
  const [translationLines, setTranslationLines] = useState<string[] | null>(
    null,
  );
  const translationInputRef = useRef<HTMLInputElement | null>(null);

  const swapWithTranslation = useCallback(() => {
    if (!translationLines) return;
    const mainTexts = lyrics.map((l) => l.text);
    const swapped = lyrics.map((l, i) => ({
      ...l,
      text: translationLines[i] ?? '',
    }));
    setTranslationLines(mainTexts);
    updateLyrics(swapped);
  }, [lyrics, translationLines, updateLyrics]);

  const saveMain = useCallback(async () => {
    const adjusted = lyrics.map((l) => ({
      ...l,
      time: l.time + offsetMs / 1000,
      end: l.end + offsetMs / 1000,
    }));
    const text = stringifyLrc(adjusted);
    await saveTextFile(text, lrcFileName);
  }, [lyrics, offsetMs, lrcFileName]);

  const removeTranslation = useCallback(() => {
    if (!translationLines) return;
    if (confirm('Remove translation?')) {
      setTranslationLines(null);
      setTranslation(false);
    }
  }, [translationLines]);

  useEffect(() => {
    if (!translationLines) return;
    if (lyrics.length === 0) return;
    if (translationLines.length === lyrics.length) return;
    setTranslationLines((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      if (next.length < lyrics.length) {
        for (let i = next.length; i < lyrics.length; i++) next.push('');
      } else {
        next.length = lyrics.length;
      }
      return next;
    });
  }, [lyrics, translationLines]);

  const insertTranslationLines = useCallback((index: number, count = 1) => {
    setTranslationLines((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      for (let i = 0; i < count; i++) next.splice(index + i, 0, '');
      return next;
    });
  }, []);

  const removeTranslationLine = useCallback((idx: number) => {
    setTranslationLines((prev) => {
      if (!prev) return prev;
      const next = [...prev];
      next.splice(idx, 1);
      return next;
    });
  }, []);

  const startTranslation = () => {
    setTranslationLines(lyrics.map(() => ''));
    setTranslation(true);
  };

  const handleTranslationUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      file
        .text()
        .then((text) => {
          const parsed = parseLyrics(text);
          const texts = parsed.map((l) => l.text);
          setTranslationLines(lyrics.map((_, i) => texts[i] ?? ''));
        })
        .catch((err) => console.error(err));
    },
    [lyrics],
  );

  const saveTranslation = useCallback(async () => {
    if (!translationLines) return;
    const data = lyrics.map((l, i) => ({
      ...l,
      text: translationLines[i] ?? '',
    }));
    const lrcText = stringifyLrc(data);
    await saveTextFile(lrcText, 'translation.lrc');
  }, [lyrics, translationLines]);

  return {
    translation,
    setTranslation,
    translationLines,
    setTranslationLines,
    translationInputRef,
    swapWithTranslation,
    saveMain,
    removeTranslation,
    insertTranslationLines,
    removeTranslationLine,
    startTranslation,
    handleTranslationUpload,
    saveTranslation,
  };
}

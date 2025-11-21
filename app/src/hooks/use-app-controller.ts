import { useCallback, useEffect, useRef, useState } from 'react';
import type { LrcLine } from '../utils/parse-lrc';
import useLibrary, { type ProjectSnapshot } from './use-library';
import useProfiles from './use-profiles';
import useTranslation from './use-translation';
import usePrompt from './use-prompt';
import useLyricsHistory from './use-lyrics-history';
import useAudioPlayer from './use-audio-player';
import { saveProject, loadProject } from '../actions/project-actions';
import {
  handleLrcUpload,
  removeLyricsFile,
  deleteLine,
  splitLine,
  applyOffsetToLyrics,
} from '../actions/lyrics-actions';
import useBeforeUnload from './use-before-unload';
import type { DisplaySettings } from '../types/display-settings';
import type { Step } from '../types';

export default function useAppController() {
  const [lyrics, setLyrics] = useState<LrcLine[]>([]);
  const [step, setStep] = useState<Step>('editor');
  const [initialTab, setInitialTab] = useState(true);
  const changeStep = useCallback((s: Step) => {
    setStep(s);
    if (s !== 'editor' && s !== 'library') setInitialTab(false);
    window.scrollTo({ top: 0 });
  }, []);

  const {
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
  } = useAudioPlayer();
  const [editing, setEditing] = useState(false);
  const [albumArt, setAlbumArt] = useState<string | null>(null);
  const [albumArtFileName, setAlbumArtFileName] = useState<string | null>(null);
  const [songName, setSongName] = useState('');
  const [artistName, setArtistName] = useState('');
  const [albumName, setAlbumName] = useState('');
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [displaySettings, setDisplaySettings] = useState<
    DisplaySettings | undefined
  >(undefined);
  const [lrcFileName, setLrcFileName] = useState('lyrics.lrc');
  const [offsetInput, setOffsetInput] = useState('0');
  const offsetMs = parseFloat(offsetInput) || 0;
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const {
    promptVisible,
    promptTitle,
    promptInitial,
    showPrompt,
    handlePromptCancel,
    handlePromptSubmit,
  } = usePrompt();
  const [lyricsInputChosen, setLyricsInputChosen] = useState(false);
  const [lyricsInitialized, setLyricsInitialized] = useState(false);
  const [editButtonPressed, setEditButtonPressed] = useState(false);
  const lyricsRef = useRef(lyrics);
  const { updateLyrics, undo, redo, resetHistory, canUndo, canRedo } =
    useLyricsHistory(lyricsRef, setLyrics, setSelectedIdx);
  const [projects, setProjects] = useLibrary();
  const [profiles, setProfiles] = useProfiles();
  const [version, setVersion] = useState(1);
  const hasProject = version > 1;
  const hasContent = lyrics.length > 0 || audioUrl !== null;
  const [showHomePrompt, setShowHomePrompt] = useState(false);
  const initialMount = useRef(true);

  useEffect(() => {
    lyricsRef.current = lyrics;
  }, [lyrics]);

  useEffect(() => {
    if (initialMount.current) {
      initialMount.current = false;
      return;
    }
    setVersion((v) => v + 1);
  }, [
    lyrics,
    audioUrl,
    albumArt,
    songName,
    artistName,
    albumName,
    customBg,
    displaySettings,
  ]);

  const {
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
  } = useTranslation({
    lyrics,
    updateLyrics,
    offsetMs,
    lrcFileName,
  });

  useBeforeUnload(editButtonPressed);

  const onLrcUpload = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleLrcUpload(
        e,
        lyricsInitialized,
        setLrcFileName,
        updateLyrics,
        setLyricsInitialized,
        setLyricsInputChosen,
      );
    },
    [lyricsInitialized, updateLyrics, setLrcFileName],
  );

  const onRemoveLyricsFile = useCallback(() => {
    removeLyricsFile(
      setLyrics,
      setLyricsInitialized,
      setLyricsInputChosen,
      setLrcFileName,
      setEditing,
      resetHistory,
    );
  }, [
    setLyrics,
    setLyricsInitialized,
    setLyricsInputChosen,
    setLrcFileName,
    setEditing,
    resetHistory,
  ]);

  const handleDeleteLine = useCallback(
    (idx: number) => {
      deleteLine(idx, lyrics, updateLyrics, removeTranslationLine);
    },
    [lyrics, updateLyrics, removeTranslationLine],
  );

  const handleSplitLine = useCallback(
    (idx: number) =>
      splitLine(idx, lyrics, showPrompt, insertTranslationLines, updateLyrics),
    [lyrics, showPrompt, insertTranslationLines, updateLyrics],
  );

  const applyOffset = useCallback(() => {
    applyOffsetToLyrics(offsetMs, lyricsRef.current, updateLyrics, () =>
      setOffsetInput('0'),
    );
  }, [offsetMs, updateLyrics]);

  const handleSaveProject = async (settingsOverride?: DisplaySettings) => {
    await saveProject(
      {
        lyrics: lyricsRef.current,
        translationLines,
        audioUrl,
        audioFileName,
        albumArt,
        albumArtFileName,
        songName,
        artistName,
        albumName,
        customBg,
        displaySettings,
        lrcFileName,
        profiles,
        setProjects,
        setVersion,
      },
      settingsOverride,
    );
  };

  const handleLoadProject = (p: ProjectSnapshot) => {
    loadProject({
      snapshot: p,
      setLyrics,
      setLyricsInitialized,
      setLyricsInputChosen,
      setEditing,
      setTranslationLines,
      setTranslation,
      setAudioUrl,
      setAudioFileName,
      setAlbumArt,
      setAlbumArtFileName,
      setSongName,
      setArtistName,
      setAlbumName,
      setCustomBg,
      setDisplaySettings,
      setLrcFileName,
      setProfiles,
      setVersion,
    });
  };

  const handleHomeClick = () => {
    if (hasProject && hasContent) {
      setShowHomePrompt(true);
      return;
    }
    window.location.href = '/';
  };

  const handleHomeCancel = () => {
    setShowHomePrompt(false);
  };

  const handleHomeReset = () => {
    setShowHomePrompt(false);
    window.location.href = '/';
  };

  return {
    lyrics,
    setLyrics,
    step,
    setStep,
    initialTab,
    changeStep,
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
    editing,
    setEditing,
    albumArt,
    setAlbumArt,
    albumArtFileName,
    setAlbumArtFileName,
    songName,
    setSongName,
    artistName,
    setArtistName,
    albumName,
    setAlbumName,
    customBg,
    setCustomBg,
    displaySettings,
    setDisplaySettings,
    lrcFileName,
    setLrcFileName,
    offsetInput,
    setOffsetInput,
    offsetMs,
    selectedIdx,
    setSelectedIdx,
    promptVisible,
    promptTitle,
    promptInitial,
    showPrompt,
    handlePromptCancel,
    handlePromptSubmit,
    lyricsInputChosen,
    setLyricsInputChosen,
    lyricsInitialized,
    setLyricsInitialized,
    editButtonPressed,
    setEditButtonPressed,
    updateLyrics,
    undo,
    redo,
    resetHistory,
    canUndo,
    canRedo,
    projects,
    setProjects,
    profiles,
    setProfiles,
    version,
    setVersion,
    hasProject,
    hasContent,
    showHomePrompt,
    setShowHomePrompt,
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
    onLrcUpload,
    onRemoveLyricsFile,
    handleDeleteLine,
    handleSplitLine,
    applyOffset,
    handleSaveProject,
    handleLoadProject,
    handleHomeClick,
    handleHomeCancel,
    handleHomeReset,
  };
}

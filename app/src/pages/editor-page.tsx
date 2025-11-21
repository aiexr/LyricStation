import React, { useEffect, useState } from 'react';
import OffsetInput from '../components/offset-input';
import LrcEditor from '../components/editors/lrc-editor';
import MediaControls from '../components/media-controls';
import RawInputModal from '../modals/raw-input-modal';
import LyricsMainEditor from '../components/editors/lyrics-main-editor';
import TranslationEditor from '../components/editors/translation-editor';
import { parseLyrics, type LrcLine } from '../utils/parse-lrc';
import type useTranslation from '../hooks/use-translation';
import type { Step } from '../types';
import UploadSection from '../components/upload-section';

export type TranslationState = ReturnType<typeof useTranslation>;

interface Props extends TranslationState {
  lyrics: LrcLine[];
  setLyrics: React.Dispatch<React.SetStateAction<LrcLine[]>>;
  lyricsInputChosen: boolean;
  setLyricsInputChosen: React.Dispatch<React.SetStateAction<boolean>>;
  lyricsInitialized: boolean;
  setLyricsInitialized: React.Dispatch<React.SetStateAction<boolean>>;
  lrcFileName: string;
  audioFileName: string | null;
  handleAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAudioFile: () => void;
  audioUrl: string | null;
  editing: boolean;
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
  setEditButtonPressed: React.Dispatch<React.SetStateAction<boolean>>;
  onLrcUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLyricsFile: () => void;
  offsetInput: string;
  setOffsetInput: React.Dispatch<React.SetStateAction<string>>;
  updateLyrics: (lines: LrcLine[], save?: boolean) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  audioRef: React.RefObject<HTMLAudioElement | null>;
  currentTime: number;
  setCurrentTime: React.Dispatch<React.SetStateAction<number>>;
  duration: number;
  setDuration: React.Dispatch<React.SetStateAction<number>>;
  playing: boolean;
  togglePlay: () => void;
  volume: number;
  setVolume: React.Dispatch<React.SetStateAction<number>>;
  playbackRate: number;
  setPlaybackRate: React.Dispatch<React.SetStateAction<number>>;
  offsetMs: number;
  selectedIdx: number | null;
  setSelectedIdx: React.Dispatch<React.SetStateAction<number | null>>;
  handleDeleteLine: (idx: number) => void;
  handleSplitLine: (idx: number) => void | Promise<void>;
  applyOffset: () => void;
  changeStep: (s: Step) => void;
}

const EditorPage: React.FC<Props> = ({
  lyrics,
  setLyrics,
  lyricsInputChosen,
  setLyricsInputChosen,
  lyricsInitialized,
  setLyricsInitialized,
  lrcFileName,
  audioFileName,
  handleAudioUpload,
  removeAudioFile,
  audioUrl,
  editing,
  setEditing,
  setEditButtonPressed,
  onLrcUpload,
  onRemoveLyricsFile,
  offsetInput,
  setOffsetInput,
  updateLyrics,
  undo,
  redo,
  canUndo,
  canRedo,
  audioRef,
  currentTime,
  setCurrentTime,
  duration,
  setDuration,
  playing,
  togglePlay,
  volume,
  setVolume,
  playbackRate,
  setPlaybackRate,
  offsetMs,
  translation,
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
  selectedIdx,
  setSelectedIdx,
  handleDeleteLine,
  handleSplitLine,
  applyOffset,
  changeStep,
}) => {
  const [scrollVersion, setScrollVersion] = useState(0);
  const [showRawInput, setShowRawInput] = useState(false);
  const [rawText, setRawText] = useState('');

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        e.code === 'Space' &&
        target.tagName !== 'INPUT' &&
        target.tagName !== 'TEXTAREA' &&
        !target.isContentEditable
      ) {
        e.preventDefault();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const showEditorControls = Boolean(audioUrl && lyricsInitialized);

  return (
    <>
      {lyricsInputChosen && (
        <div className="glass-panel" style={{ marginBottom: '1rem' }}>
          <div className="section-header" style={{ marginBottom: 0 }}>
            <div>
              <div style={{ fontWeight: 700 }}>Ready for metadata?</div>
              <div className="muted">
                Apply your timing offset, then continue to album details.
              </div>
            </div>
            <button
              className="next-button"
              onClick={() => {
                applyOffset();
                setEditing(false);
                changeStep('metadata');
              }}
            >
              Next: Metadata
            </button>
          </div>
        </div>
      )}
      <UploadSection
        lyrics={lyrics}
        lrcFileName={lrcFileName}
        lyricsInputChosen={lyricsInputChosen}
        audioFileName={audioFileName}
        audioUrl={audioUrl}
        duration={duration}
        onLrcUpload={onLrcUpload}
        onRemoveLyricsFile={onRemoveLyricsFile}
        handleAudioUpload={handleAudioUpload}
        removeAudioFile={removeAudioFile}
        showEditorControls={showEditorControls}
        editing={editing}
        setEditing={setEditing}
        setEditButtonPressed={setEditButtonPressed}
        setRawText={setRawText}
        setShowRawInput={setShowRawInput}
        setLyrics={setLyrics}
        setLyricsInitialized={setLyricsInitialized}
        setLyricsInputChosen={setLyricsInputChosen}
      />
      {editing && (
        <>
          <div className="glass-panel" style={{ marginBottom: '1rem' }}>
            <div className="inline-actions" style={{ justifyContent: 'space-between' }}>
              <label style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                Offset (ms):
                <OffsetInput value={offsetInput} onChange={setOffsetInput} />
              </label>
              <span className="muted">Nudge timing before exporting.</span>
            </div>
          </div>
          <LrcEditor
            lines={lyrics}
            onChange={updateLyrics}
            onUndo={undo}
            onRedo={redo}
            canUndo={canUndo}
            canRedo={canRedo}
            getCurrentTime={() => audioRef.current?.currentTime ?? 0}
            onSeek={(t) => {
              if (audioRef.current) {
                audioRef.current.currentTime = t;
              }
              setCurrentTime(t);
            }}
            duration={duration}
            audioUrl={audioUrl}
            offsetMs={offsetMs}
            fileName={lrcFileName}
            scrollToIndex={selectedIdx}
            scrollVersion={scrollVersion}
            playing={playing}
            onTogglePlay={togglePlay}
            onDeleteLine={removeTranslationLine}
            onInsertLines={insertTranslationLines}
          />
        </>
      )}
      {audioUrl && (
        <MediaControls
          audioUrl={audioUrl}
          audioRef={audioRef}
          playing={playing}
          onTogglePlay={togglePlay}
          currentTime={currentTime}
          setCurrentTime={setCurrentTime}
          duration={duration}
          setDuration={setDuration}
          volume={volume}
          setVolume={setVolume}
          playbackRate={playbackRate}
          setPlaybackRate={setPlaybackRate}
        />
      )}
      {lyrics.length > 0 && !translationLines && (
        <div style={{ textAlign: 'right', marginBottom: '0.5rem' }}>
          <button onClick={startTranslation}>Add translation</button>
        </div>
      )}
      <div className="lyrics-lists">
        {lyricsInputChosen && (
          <LyricsMainEditor
            lyrics={lyrics}
            currentTime={currentTime}
            offsetMs={offsetMs}
            translation={translation}
            swapWithTranslation={swapWithTranslation}
            saveMain={saveMain}
            updateLyrics={updateLyrics}
            setSelectedIdx={setSelectedIdx}
            setScrollVersion={setScrollVersion}
            deleteLine={handleDeleteLine}
            splitLine={handleSplitLine}
          />
        )}
        {translationLines && (
          <TranslationEditor
            translationLines={translationLines}
            translation={translation}
            translationInputRef={translationInputRef}
            setTranslationLines={setTranslationLines}
            handleTranslationUpload={handleTranslationUpload}
            saveTranslation={saveTranslation}
            removeTranslation={removeTranslation}
          />
        )}
      </div>
      {showRawInput && (
        <RawInputModal
          rawText={rawText}
          onChange={setRawText}
          onCancel={() => setShowRawInput(false)}
          onLoad={() => {
            updateLyrics(parseLyrics(rawText, duration));
            setLyricsInitialized(true);
            setShowRawInput(false);
            setEditing(true);
            setLyricsInputChosen(true);
          }}
        />
      )}
    </>
  );
};

export default EditorPage;

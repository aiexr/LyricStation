import React from 'react';
import FileDropZone, { DefaultFolderIcon } from './file-drop-zone';
import Tooltip from './tooltip';
import { stringifyLrc, type LrcLine } from '../utils/parse-lrc';

interface Props {
  lyrics: LrcLine[];
  lrcFileName: string;
  lyricsInputChosen: boolean;
  audioFileName: string | null;
  audioUrl: string | null;
  duration: number;
  onLrcUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveLyricsFile: () => void;
  handleAudioUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  removeAudioFile: () => void;
  showEditorControls: boolean;
  editing: boolean;
  setEditing: React.Dispatch<React.SetStateAction<boolean>>;
  setEditButtonPressed: React.Dispatch<React.SetStateAction<boolean>>;
  setRawText: React.Dispatch<React.SetStateAction<string>>;
  setShowRawInput: React.Dispatch<React.SetStateAction<boolean>>;
  setLyrics: React.Dispatch<React.SetStateAction<LrcLine[]>>;
  setLyricsInitialized: React.Dispatch<React.SetStateAction<boolean>>;
  setLyricsInputChosen: React.Dispatch<React.SetStateAction<boolean>>;
}

const UploadSection: React.FC<Props> = ({
  lyrics,
  lrcFileName,
  lyricsInputChosen,
  audioFileName,
  audioUrl,
  duration,
  onLrcUpload,
  onRemoveLyricsFile,
  handleAudioUpload,
  removeAudioFile,
  showEditorControls,
  editing,
  setEditing,
  setEditButtonPressed,
  setRawText,
  setShowRawInput,
  setLyrics,
  setLyricsInitialized,
  setLyricsInputChosen,
}) => (
  <div style={{ marginBottom: '1rem' }}>
    <div className="upload-container" style={{ marginBottom: '1rem' }}>
      <FileDropZone
        id="lyrics-upload"
        title="Upload lyrics (optional)"
        accept=".ass,.lrc"
        hint="Supports: .ass .lrc"
        onFile={(file) => {
          const e = {
            target: { files: [file] },
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          onLrcUpload(e);
        }}
        fileName={lyricsInputChosen ? lrcFileName : null}
        icon={<DefaultFolderIcon />}
        onRemove={onRemoveLyricsFile}
      />
      <FileDropZone
        id="audio-upload"
        title="Upload video or audio"
        accept=".mp3,.ogg,.wav,.mp4,.mov,.flv"
        hint="Supports: .mp3 .ogg, .wav .mov .mp4 .flv"
        onFile={(file) => {
          const e = {
            target: { files: [file] },
          } as unknown as React.ChangeEvent<HTMLInputElement>;
          handleAudioUpload(e);
        }}
        fileName={audioFileName}
        icon={<DefaultFolderIcon />}
        onRemove={removeAudioFile}
      />
    </div>
    {showEditorControls && (
      <div className="inline-actions" style={{ marginBottom: '1rem' }}>
        <button
          onClick={() => {
            setEditing((e) => !e);
            setEditButtonPressed(true);
          }}
        >
          {editing ? 'Close Editor' : 'Edit Lyrics'}
        </button>
      </div>
    )}
    {!lyricsInputChosen && (
      <div
        className="inline-actions"
        style={{ marginTop: '0.5rem', flexWrap: 'wrap' }}
      >
        <Tooltip
          message="Upload some audio first!"
          show={!audioUrl || duration <= 0}
        >
          <button
            onClick={() => {
              setRawText(stringifyLrc(lyrics));
              setShowRawInput(true);
            }}
            disabled={!audioUrl || duration <= 0}
          >
            Paste raw text lyrics
          </button>
        </Tooltip>
        <Tooltip message="Upload some audio first!" show={!audioUrl}>
          <button
            onClick={() => {
              setLyrics([]);
              setEditing(true);
              setLyricsInitialized(true);
              setLyricsInputChosen(true);
            }}
            disabled={!audioUrl}
          >
            Create lyrics from scratch
          </button>
        </Tooltip>
      </div>
    )}
  </div>
);

export default UploadSection;

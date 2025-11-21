import React from 'react';
import trashIcon from '../../assets/trash.svg';
import splitIcon from '../../assets/split.svg';
import type { LrcLine } from '../../utils/parse-lrc';

interface Props {
  lyrics: LrcLine[];
  currentTime: number;
  offsetMs: number;
  translation: boolean;
  swapWithTranslation: () => void;
  saveMain: () => void;
  updateLyrics: (lines: LrcLine[], save?: boolean) => void;
  setSelectedIdx: React.Dispatch<React.SetStateAction<number | null>>;
  setScrollVersion: React.Dispatch<React.SetStateAction<number>>;
  deleteLine: (idx: number) => void;
  splitLine: (idx: number) => void | Promise<void>;
}

const LyricsMainEditor: React.FC<Props> = ({
  lyrics,
  currentTime,
  offsetMs,
  translation,
  swapWithTranslation,
  saveMain,
  updateLyrics,
  setSelectedIdx,
  setScrollVersion,
  deleteLine,
  splitLine,
}) => (
  <div className="lyrics-main">
    {translation && (
      <div style={{ marginBottom: '0.5rem' }}>
        <h2 style={{ textAlign: 'center' }}>Main Lyrics</h2>
        <button onClick={swapWithTranslation}>Swap with translation</button>
        <button onClick={saveMain} style={{ marginLeft: '0.5rem' }}>
          Save main as…
        </button>
      </div>
    )}

    <ul>
      {lyrics.map((line, i) => {
        const active =
          currentTime >= line.time + offsetMs / 1000 &&
          currentTime < line.end + offsetMs / 1000;
        return (
          <li
            key={`${i}-${line.time}`}
            className={`line-item ${active ? 'active-line' : ''}`}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.25rem',
              position: 'relative',
            }}
          >
            <input
              type="text"
              className="text-input"
              value={line.text}
              onChange={(e) => {
                const updated = [...lyrics];
                updated[i] = {
                  ...updated[i],
                  text: e.target.value,
                };
                updateLyrics(updated, false);
              }}
              onClick={() => {
                setSelectedIdx(i);
                setScrollVersion((v) => v + 1);
              }}
            />
            <div className="line-actions">
              <button
                onClick={() => deleteLine(i)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <img
                  src={trashIcon}
                  alt="Delete"
                  style={{ width: 20, height: 20 }}
                />
              </button>
              <button
                onClick={() => splitLine(i)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <img
                  src={splitIcon}
                  alt="Split"
                  style={{ width: 20, height: 20 }}
                />
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  </div>
);

export default LyricsMainEditor;

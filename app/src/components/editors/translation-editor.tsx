import React from 'react';

interface Props {
  translationLines: string[];
  translation: boolean;
  translationInputRef: React.RefObject<HTMLInputElement | null>;
  setTranslationLines: React.Dispatch<React.SetStateAction<string[] | null>>;
  handleTranslationUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  saveTranslation: () => Promise<void>;
  removeTranslation: () => void;
}

export default function TranslationEditor({
  translationLines,
  translation,
  translationInputRef,
  setTranslationLines,
  handleTranslationUpload,
  saveTranslation,
  removeTranslation,
}: Props) {
  return (
    <div className="lyrics-translation">
      {/* shown only when `translation` is true */}

      {translation && <h2 style={{ textAlign: 'center' }}>Translation</h2>}
      {translation && (
        <div style={{ marginBottom: '0.5rem' }}>
          <button onClick={() => translationInputRef.current?.click()}>
            Load from file
          </button>
          <button onClick={saveTranslation} style={{ marginLeft: '0.5rem' }}>
            Save translation as…
          </button>
          <button
            onClick={removeTranslation}
            style={{ marginLeft: '0.5rem', color: '#d9534f' }}
          >
            X
          </button>

          <input
            type="file"
            accept=".ass,.lrc"
            ref={translationInputRef}
            style={{ display: 'none' }}
            onChange={handleTranslationUpload}
          />
        </div>
      )}
      {/* end additional-context div */}

      <ul>
        {translationLines.map((text, i) => (
          <li key={i} style={{ marginBottom: '0.25rem' }}>
            <input
              type="text"
              className="text-input"
              value={text}
              onChange={(e) =>
                setTranslationLines((prev) => {
                  if (!prev) return prev;
                  const arr = [...prev];
                  arr[i] = e.target.value;
                  return arr;
                })
              }
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

import React from 'react';
import type { KeybindConfig } from '../utils/keybinds';
import { defaultKeybinds } from '../utils/keybinds';

interface Props {
  binds: KeybindConfig;
  onChange: (b: KeybindConfig) => void;
  onClose: () => void;
}

const labels: Record<keyof KeybindConfig, string> = {
  jumpToPlayhead: 'Jump to playhead',
  setStart: 'Set start to playhead',
  setEnd: 'Set end to playhead',
  newBlock: 'New block at playhead',
  addAfter: 'Add lyric after current block',
  deleteBlock: 'Delete current block',
  removeGapsRight: 'Remove all gaps (->)',
  removeGapsLeft: 'Remove all gaps (<-)',
};

const KeybindSettings: React.FC<Props> = ({ binds, onChange, onClose }) => {
  const [waiting, setWaiting] = React.useState<keyof KeybindConfig | null>(
    null,
  );

  React.useEffect(() => {
    if (!waiting) return;
    const handler = (e: KeyboardEvent) => {
      e.preventDefault();
      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      onChange({ ...binds, [waiting]: key });
      setWaiting(null);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [waiting, binds, onChange]);

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
    >
      <div
        style={{
          background: '#1f2937',
          color: '#f9fafb',
          padding: '1rem',
          width: '300px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Keybinds</h3>
        {(Object.keys(labels) as Array<keyof KeybindConfig>).map((key) => (
          <div
            key={key}
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.5rem',
            }}
          >
            <span style={{ flex: 1 }}>{labels[key]}</span>
            <button
              onClick={() => setWaiting(key)}
              style={{ marginRight: '0.5rem' }}
            >
              {waiting === key ? 'Press any key...' : binds[key]}
            </button>
          </div>
        ))}
        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <button onClick={() => onChange(defaultKeybinds)}>Reset</button>
          <button onClick={onClose} style={{ marginLeft: '0.5rem' }}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default KeybindSettings;

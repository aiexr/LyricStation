import React from 'react';

export interface DisplayPrefs {
  waveformType: 'bars' | 'line';
  waveformColor: string;
  blockHeight: number;
  blockOpacity: number;
  blockColor: string;
  blockFontSize: number;
  blockTextColor: string;
  breakColor: string;
}

export const DEFAULT_DISPLAY_PREFS: DisplayPrefs = {
  waveformType: 'bars',
  waveformColor: '#cce5ff',
  blockHeight: 32,
  blockOpacity: 0.8,
  blockColor: '#007bff',
  blockFontSize: 15,
  blockTextColor: '#ffffff',
  breakColor: '#a52a2a',
};

interface Props {
  prefs: DisplayPrefs;
  onChange: (p: DisplayPrefs) => void;
  onClose: () => void;
}

const EditorDisplaySettings: React.FC<Props> = ({
  prefs,
  onChange,
  onClose,
}) => {
  const [local, setLocal] = React.useState(prefs);
  const original = React.useRef(prefs);

  React.useEffect(() => {
    setLocal(prefs);
    original.current = prefs;
  }, [prefs]);

  const handle = <K extends keyof DisplayPrefs>(
    key: K,
    val: DisplayPrefs[K],
  ) => {
    const updated = { ...local, [key]: val };
    setLocal(updated);
    onChange(updated);
  };

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
          width: '320px',
        }}
      >
        <h3 style={{ marginTop: 0 }}>Editor Display</h3>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Waveform Type
            <select
              value={local.waveformType}
              onChange={(e) =>
                handle(
                  'waveformType',
                  e.target.value as DisplayPrefs['waveformType'],
                )
              }
              style={{ marginLeft: '0.5rem' }}
            >
              <option value="bars">Bars</option>
              <option value="line">Line</option>
            </select>
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Waveform Color
            <input
              type="color"
              value={local.waveformColor}
              onChange={(e) => handle('waveformColor', e.target.value)}
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Block Height
            <input
              type="range"
              min="16"
              max="64"
              value={local.blockHeight}
              onChange={(e) =>
                handle('blockHeight', parseInt(e.target.value, 10))
              }
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Block Transparency
            <input
              type="range"
              min="0.1"
              max="1"
              step="0.05"
              value={local.blockOpacity}
              onChange={(e) =>
                handle('blockOpacity', parseFloat(e.target.value))
              }
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Default Block Color
            <input
              type="color"
              value={local.blockColor}
              onChange={(e) => handle('blockColor', e.target.value)}
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Block Font Size
            <input
              type="number"
              min="8"
              max="48"
              value={local.blockFontSize}
              onChange={(e) =>
                handle('blockFontSize', parseInt(e.target.value, 10))
              }
              style={{ marginLeft: '0.5rem', width: '60px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Block Text Color
            <input
              type="color"
              value={local.blockTextColor}
              onChange={(e) => handle('blockTextColor', e.target.value)}
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Break Block Color
            <input
              type="color"
              value={local.breakColor}
              onChange={(e) => handle('breakColor', e.target.value)}
              style={{ marginLeft: '0.5rem' }}
            />
          </label>
        </div>
        <div style={{ textAlign: 'right' }}>
          <button
            onClick={() => {
              onChange(original.current);
              onClose();
            }}
          >
            Cancel
          </button>
          <button
            style={{ marginLeft: '0.5rem', marginRight: '0.5rem' }}
            onClick={() => {
              setLocal(DEFAULT_DISPLAY_PREFS);
              onChange(DEFAULT_DISPLAY_PREFS);
            }}
          >
            Reset to Default
          </button>
          <button
            style={{ marginLeft: '0.5rem' }}
            onClick={() => {
              onChange(local);
              onClose();
            }}
          >
            Save Preferences
          </button>
        </div>
      </div>
    </div>
  );
};

export default EditorDisplaySettings;

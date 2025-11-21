import React from 'react';
import OffsetInput from './offset-input';

interface Props {
  visible: boolean;
  bpmInput: string;
  setBpmInput: (v: string) => void;
  analyzingBpm: boolean;
  onAnalyzeBpm: () => void;
  subdivision: number;
  setSubdivision: (n: number) => void;
  gridOffsetInput: string;
  setGridOffsetInput: (v: string) => void;
  onClose: () => void;
  onShowAdvanced: () => void;
}

const ViewOptionsDialog: React.FC<Props> = ({
  visible,
  bpmInput,
  setBpmInput,
  analyzingBpm,
  onAnalyzeBpm,
  subdivision,
  setSubdivision,
  gridOffsetInput,
  setGridOffsetInput,
  onClose,
  onShowAdvanced,
}) => {
  if (!visible) return null;

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
          padding: '1rem',
          width: '320px',
          color: '#f9fafb',
        }}
      >
        <h3 style={{ marginTop: 0 }}>View Options</h3>
        <div style={{ marginBottom: '0.5rem' }}>
          <button onClick={onAnalyzeBpm} disabled={analyzingBpm}>
            {analyzingBpm ? 'Analyzing…' : 'Analyze bpm'}
          </button>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            BPM:
            <input
              type="number"
              min={1}
              value={bpmInput}
              onChange={(e) => setBpmInput(e.target.value)}
              style={{ marginLeft: '0.5rem', width: '60px' }}
            />
          </label>
        </div>
        <div style={{ marginBottom: '0.5rem' }}>
          <label>
            Grid:
            <select
              value={subdivision}
              onChange={(e) => setSubdivision(parseInt(e.target.value, 10))}
              style={{ marginLeft: '0.5rem' }}
            >
              <option value={1}>1/1</option>
              <option value={2}>1/2</option>
              <option value={4}>1/4</option>
            </select>
          </label>
        </div>
        <div
          style={{
            marginBottom: '0.5rem',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <span style={{ marginRight: '0.25rem' }}>Grid Offset:</span>
          <OffsetInput value={gridOffsetInput} onChange={setGridOffsetInput} />
        </div>
        <div style={{ marginTop: '1rem', textAlign: 'right' }}>
          <button onClick={onShowAdvanced} style={{ marginRight: 'auto' }}>
            Advanced
          </button>
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ViewOptionsDialog;

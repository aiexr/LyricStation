interface RawInputModalProps {
  rawText: string;
  onChange: (text: string) => void;
  onCancel: () => void;
  onLoad: () => void;
}

export default function RawInputModal({
  rawText,
  onChange,
  onCancel,
  onLoad,
}: RawInputModalProps) {
  return (
    <div className="modal-overlay">
      <div className="raw-input-modal glass-panel" style={{ width: '100%', maxWidth: 720 }}>
        <textarea
          value={rawText}
          onChange={(e) => onChange(e.target.value)}
          className="raw-input-textarea"
        />
        <div
          style={{
            marginTop: '0.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <span>Lyrics are separated by new line</span>
          <div style={{ textAlign: 'right' }}>
            <button onClick={onCancel}>Cancel</button>
            <button onClick={onLoad} style={{ marginLeft: '0.5rem' }}>
              Load Lyrics
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

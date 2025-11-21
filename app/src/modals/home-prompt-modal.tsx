import React from 'react';

interface Props {
  visible: boolean;
  onCancel: () => void;
  // onSave: () => void;
  onReset: () => void;
}

const HomePromptModal: React.FC<Props> = ({
  visible,
  onCancel,
  // onSave,
  onReset,
}) => {
  if (!visible) return null;
  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: '100%', maxWidth: 420 }}>
        <p style={{ marginTop: 0, marginBottom: '0.5rem' }}>
          Navigate back to the homepage? Unsaved progress may be lost.
        </p>
        <div className="modal-actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={onReset}>
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default HomePromptModal;

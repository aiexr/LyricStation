import React from 'react';

interface Props {
  visible: boolean;
  title: string;
  initialValue?: string;
  onCancel: () => void;
  onSubmit: (value: string) => void;
  placeholder?: string;
  message?: string;
}

const InputModal: React.FC<Props> = ({
  visible,
  title,
  initialValue = '',
  onCancel,
  onSubmit,
  placeholder,
  message,
}) => {
  const [value, setValue] = React.useState(initialValue);
  const inputRef = React.useRef<HTMLTextAreaElement | null>(null);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onSubmit(value);
    }
  };

  React.useEffect(() => {
    setValue(initialValue);
  }, [initialValue]);

  React.useEffect(() => {
    if (visible) {
      inputRef.current?.focus();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: '100%', maxWidth: 620 }}>
        <h3 style={{ marginTop: 0 }}>{title}</h3>
        {message && <p className="muted" style={{ marginTop: 0 }}>{message}</p>}
        <textarea
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            height: '150px',
            marginBottom: '0.5rem',
            background: '#111827',
            color: '#f9fafb',
            border: '1px solid #4b5563',
          }}
          onKeyDown={handleKeyDown}
        />
        <div
          style={{ fontSize: '12px', color: '#d1d5db', marginBottom: '0.5rem' }}
        >
          Press Ctrl+Enter to confirm
        </div>
        <div className="modal-actions">
          <button onClick={onCancel}>Cancel</button>
          <button onClick={() => onSubmit(value)}>OK</button>
        </div>
      </div>
    </div>
  );
};

export default InputModal;

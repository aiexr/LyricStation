import React from 'react';

interface Props {
  value: string;
  onChange: (val: string) => void;
}

const getStep = (e: {
  shiftKey?: boolean;
  ctrlKey?: boolean;
  metaKey?: boolean;
}): number => {
  if (e.ctrlKey || e.metaKey) return 100;
  if (e.shiftKey) return 10;
  return 1;
};

const OffsetInput: React.FC<Props> = ({ value, onChange }) => {
  const adjust = (
    delta: number,
    e:
      | React.MouseEvent<HTMLButtonElement>
      | React.KeyboardEvent<HTMLInputElement>,
  ) => {
    e.preventDefault();
    const step = getStep(e);
    const current = parseFloat(value) || 0;
    const next = current + delta * step;
    onChange(String(next));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      adjust(1, e);
    } else if (e.key === 'ArrowDown') {
      adjust(-1, e);
    }
  };

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center' }}>
      <input
        type="number"
        value={value}
        step="any"
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        style={{ width: '80px' }}
      />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          marginLeft: '0.25rem',
        }}
      >
        <button
          type="button"
          onClick={(e) => adjust(1, e)}
          style={{ lineHeight: 1 }}
        >
          ▲
        </button>
        <button
          type="button"
          onClick={(e) => adjust(-1, e)}
          style={{ lineHeight: 1 }}
        >
          ▼
        </button>
      </div>
    </div>
  );
};

export default OffsetInput;

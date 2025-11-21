import React from 'react';

interface Props {
  text: string;
}

const MAX_LEN = 40;

const splitText = (text: string): [string, string?] => {
  if (text.length <= MAX_LEN) return [text];
  const idx = text.lastIndexOf(' ', MAX_LEN);
  if (idx === -1) return [text.slice(0, MAX_LEN), text.slice(MAX_LEN)];
  return [text.slice(0, idx), text.slice(idx + 1)];
};

const LyricListItem: React.FC<Props> = ({ text }) => {
  const [first, second] = React.useMemo(() => splitText(text), [text]);

  if (!second) {
    return <span>{first || '\u00A0'}</span>;
  }

  return (
    <span
      style={{
        display: 'flex',
        alignItems: 'stretch',
        justifyContent: 'center',
        margin: '0 auto',
      }}
    >
      <span
        style={{
          textAlign: 'center',
          width: 4,
          background: '#357ad3',
          borderRadius: 2,
          marginRight: 4,
        }}
      />
      <span>
        {first}
        <br />
        {second}
      </span>
    </span>
  );
};

export default LyricListItem;

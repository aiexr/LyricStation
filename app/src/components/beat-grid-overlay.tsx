import React from 'react';

interface Props {
  duration: number;
  pxPerSec: number;
  audioOffsetSec: number;
  bpm: number;
  overlayOffsetSec: number;
  height: number;
  subdivision: number;
}

const BeatGridOverlay: React.FC<Props> = ({
  duration,
  pxPerSec,
  audioOffsetSec,
  bpm,
  overlayOffsetSec,
  height,
  subdivision,
}) => {
  if (bpm <= 0) return null;

  const quarterSec = 60 / bpm / 4;
  if (!isFinite(quarterSec) || quarterSec <= 0) return null;

  const first = ((overlayOffsetSec % quarterSec) + quarterSec) % quarterSec;
  const baselineHeight = 2;
  const scale = 4;
  const major = baselineHeight * 3 * scale;
  const mid = baselineHeight * 2 * scale;
  const minor = Math.round(baselineHeight * 1.5 * scale);
  const baselineY = height / 2;

  const ticks: React.ReactElement[] = [];
  for (let t = first, i = 0; t <= duration; t += quarterSec, i += 1) {
    const left = (t + audioOffsetSec) * pxPerSec;
    const idx = Math.round((t - overlayOffsetSec) / quarterSec);
    const type = idx % 4 === 0 ? 'major' : idx % 2 === 0 ? 'mid' : 'minor';
    if (subdivision < 4 && type === 'minor') continue;
    if (subdivision < 2 && type === 'mid') continue;
    const h = type === 'major' ? major : type === 'mid' ? mid : minor;
    const color =
      type === 'major' ? '#ffffff' : type === 'mid' ? '#ff3c3c' : '#3c7bff';

    ticks.push(
      <div
        key={i}
        style={{
          position: 'absolute',
          top: `${baselineY + baselineHeight / 2}px`,
          left: `${left}px`,
          width: '1px',
          height: `${h}px`,
          background: color,
          pointerEvents: 'none',
        }}
      />,
    );
  }

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: `${duration * pxPerSec}px`,
        height: `${height}px`,
        pointerEvents: 'none',
        zIndex: 2,
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: `${baselineY - baselineHeight / 2}px`,
          left: 0,
          width: '100%',
          height: `${baselineHeight}px`,
          background: '#ffffff',
        }}
      />
      {ticks}
    </div>
  );
};

export default BeatGridOverlay;

import type { LrcLine } from './parse-lrc';

export interface LinkedIndices {
  startTimes: number[];
  startEnds: number[];
  endTimes: number[];
  endEnds: number[];
}

export const EPS = 1e-4;

export function hexToRgba(hex: string, alpha: number): string {
  const clean = hex.replace('#', '');
  const num = parseInt(clean, 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export const getLinkedIndices = (
  lines: LrcLine[],
  idx: number,
): LinkedIndices => {
  const { time: start, end } = lines[idx];
  const linked: LinkedIndices = {
    startTimes: [],
    startEnds: [],
    endTimes: [],
    endEnds: [],
  };
  lines.forEach((l, i) => {
    if (i === idx) return;
    if (Math.abs(l.time - start) < EPS) linked.startTimes.push(i);
    if (Math.abs(l.end - start) < EPS) linked.startEnds.push(i);
    if (Math.abs(l.time - end) < EPS) linked.endTimes.push(i);
    if (Math.abs(l.end - end) < EPS) linked.endEnds.push(i);
  });
  return linked;
};

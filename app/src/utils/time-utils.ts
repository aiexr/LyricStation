export const formatTime = (t: number): string => {
  const m = Math.floor(t / 60)
    .toString()
    .padStart(2, '0');
  const s = Math.floor(t % 60)
    .toString()
    .padStart(2, '0');
  return `${m}:${s}`;
};

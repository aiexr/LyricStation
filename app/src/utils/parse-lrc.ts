export interface LrcLine {
  /** unique identifier for stable rendering */
  id: string;
  /** start time in seconds */
  time: number;
  /** end time in seconds */
  end: number;
  text: string;
}

let idCounter = 0;
export const generateId = (): string => `lrc-${idCounter++}`;

export function parseLrc(lrc: string): LrcLine[] {
  const parsed = lrc
    .split(/\r?\n/)
    .map((line) => line.trim())
    .flatMap((line) => {
      const match = /^\[(\d{2}):(\d{2}(?:\.\d{1,2})?)\]\s*(.*)$/.exec(line);
      if (!match) return [];
      const [, mm, ss, text] = match;
      const time = parseInt(mm, 10) * 60 + parseFloat(ss);
      return [{ time, text }];
    })
    .sort((a, b) => a.time - b.time);

  const lines: LrcLine[] = parsed.map((l, i) => ({
    id: generateId(),
    time: l.time,
    end: parsed[i + 1]?.time ?? l.time + 3,
    text: l.text,
  }));

  return lines;
}

function parseAssTime(str: string): number {
  const [h, m, s] = str.split(':');
  return parseInt(h, 10) * 3600 + parseInt(m, 10) * 60 + parseFloat(s);
}

export function parseAss(ass: string): LrcLine[] {
  const lines: LrcLine[] = [];
  let inEvents = false;
  let startIdx = -1;
  let endIdx = -1;
  let textIdx = -1;
  let columnCount = 0;

  ass.split(/\r?\n/).forEach((raw) => {
    const line = raw.trim();

    if (!inEvents) {
      if (/^\[Events]/i.test(line)) inEvents = true;
      return;
    }

    if (/^Format:/i.test(line)) {
      const cols = line.substring(line.indexOf(':') + 1).split(',');
      columnCount = cols.length;
      cols.forEach((c, i) => {
        const name = c.trim().toLowerCase();
        if (name === 'start') startIdx = i;
        if (name === 'end') endIdx = i;
        if (name === 'text') textIdx = i;
      });
      return;
    }

    if (/^Dialogue:/i.test(line)) {
      const rest = line.substring(line.indexOf(':') + 1);
      const parts: string[] = [];
      let cur = '';
      let col = 0;
      for (let i = 0; i < rest.length; i++) {
        const ch = rest[i];
        if (ch === ',' && col < columnCount - 1) {
          parts.push(cur);
          cur = '';
          col++;
        } else {
          cur += ch;
        }
      }
      parts.push(cur);

      if (startIdx >= 0 && endIdx >= 0 && textIdx >= 0) {
        const start = parts[startIdx]?.trim() ?? '';
        const end = parts[endIdx]?.trim() ?? '';
        const text = parts.slice(textIdx).join(',').trim();
        lines.push({
          id: generateId(),
          time: parseAssTime(start),
          end: parseAssTime(end),
          text,
        });
      }
    }
  });

  return lines.sort((a, b) => a.time - b.time);
}

export function parseLyrics(text: string, duration?: number): LrcLine[] {
  if (/^\s*\[Script Info]/i.test(text) || /^Dialogue:/im.test(text)) {
    return parseAss(text);
  }
  if (/^\s*\[\d{2}:\d{2}(?:\.\d{1,2})?]/m.test(text)) {
    return parseLrc(text);
  }
  // Treat as raw lyrics without timestamps
  const rows = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (rows.length === 0) return [];
  const segment = duration && duration > 0 ? duration / rows.length : 3;
  return rows.map((t, i) => ({
    id: generateId(),
    time: segment * i,
    end: segment * (i + 1),
    text: t,
  }));
}

function formatTime(time: number): string {
  const mm = Math.floor(time / 60)
    .toString()
    .padStart(2, '0');
  const ss = (time % 60).toFixed(2).padStart(5, '0');
  return `${mm}:${ss}`;
}

export function stringifyLrc(lines: LrcLine[]): string {
  return lines.map((l) => `[${formatTime(l.time)}] ${l.text}`).join('\n');
}

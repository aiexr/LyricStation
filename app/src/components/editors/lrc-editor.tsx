import React from 'react';
import InputModal from '../../modals/input-modal';
import BeatGridOverlay from '../beat-grid-overlay';
import { type LrcLine, stringifyLrc, generateId } from '../../utils/parse-lrc';
import { saveTextFile } from '../../utils/file-utils';
import KeybindSettings from '../../settings/keybind-settings';
import type { KeybindConfig } from '../../utils/keybinds';
import { loadKeybinds, saveKeybinds } from '../../utils/keybinds';
import useCookieState from '../../hooks/use-cookie-state';
import usePrompt from '../../hooks/use-prompt';
import useWaveform from '../../hooks/use-waveform';
import EditorDisplaySettings, {
  type DisplayPrefs,
} from '../../settings/editor-display-settings';
import ViewOptionsDialog from '../view-options-dialog';
import detect from 'bpm-detective';
import undoIcon from '../../assets/undo.svg';
import redoIcon from '../../assets/redo.svg';
import optionIcon from '../../assets/option.svg';
import {
  CANVAS_HEIGHT,
  DEFAULT_PREFS,
  MIN_ZOOM,
  MAX_ZOOM,
  MIN_SENSITIVITY,
  MAX_SENSITIVITY,
  SNAP_THRESHOLD_SEC,
} from '../../utils/lrc-editor-constants';
import { hexToRgba, getLinkedIndices } from '../../utils/lrc-editor-utils';

interface Props {
  lines: LrcLine[];
  onChange: (lines: LrcLine[], save?: boolean) => void;
  /** Triggered when user requests undo */
  onUndo?: () => void;
  /** Triggered when user requests redo */
  onRedo?: () => void;
  /** Whether undo is currently possible */
  canUndo?: boolean;
  /** Whether redo is currently possible */
  canRedo?: boolean;
  /** Optional function that returns the current playback time in seconds. */
  getCurrentTime?: () => number;
  /** Optional callback to seek the audio element when the user seeks. */
  onSeek?: (time: number) => void;
  /** Duration of the currently loaded audio in seconds. */
  duration: number;
  /** URL of the loaded audio file so we can render a waveform. */
  audioUrl: string | null;
  /** Offset applied when rendering captions on the timeline in ms */
  offsetMs?: number;
  /** Suggested file name when saving */
  fileName?: string;
  /** If provided, jumps to this index and recentres timeline */
  scrollToIndex?: number | null;
  /** Increment whenever you want to force recenter on same index */
  scrollVersion?: number;
  /** Whether the audio is currently playing */
  playing?: boolean;
  /** Optional callback toggling playback when space is pressed */
  onTogglePlay?: () => void;
  /** Optional callback when a lyric line is deleted */
  onDeleteLine?: (idx: number) => void;
  /** Optional callback when new lyric lines are inserted */
  onInsertLines?: (index: number, count: number) => void;
}

const LrcEditor: React.FC<Props> = ({
  lines,
  onChange,
  onUndo,
  onRedo,
  canUndo = false,
  canRedo = false,
  getCurrentTime,
  onSeek,
  duration,
  audioUrl,
  offsetMs = 0,
  fileName = 'lyrics.lrc',
  scrollToIndex = null,
  scrollVersion = 0,
  playing = false,
  onTogglePlay,
  onDeleteLine,
  onInsertLines,
}) => {
  /* ------------------------- REFS ------------------------- */
  const timelineRef = React.useRef<HTMLDivElement | null>(null);
  // Scroll container that holds the timeline
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  // Track latest lines without triggering effects on every change
  const linesRef = React.useRef(lines);
  const canvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const playheadRef = React.useRef<HTMLDivElement | null>(null);
  const playTimeRef = React.useRef(0);
  const copiedTextRef = React.useRef<string | null>(null);

  /* ------------------------ STATE ------------------------- */
  const [playTime, setPlayTime] = React.useState(0);
  React.useEffect(() => {
    playTimeRef.current = playTime;
  }, [playTime]);
  const [zoom, setZoom] = React.useState(100);
  const [sensitivity, setSensitivity] = React.useState(1);
  const [timelineMenu, setTimelineMenu] = React.useState<{
    x: number;
    y: number;
    time: number;
  } | null>(null);
  const [blockMenu, setBlockMenu] = React.useState<{
    x: number;
    y: number;
    idx: number;
  } | null>(null);
  // Snapping is controlled via Shift key; no dynamic hinting
  const [followPlayhead, setFollowPlayhead] = React.useState(true);
  const [linkNodes, setLinkNodes] = React.useState(true);
  const [selectedIdx, setSelectedIdx] = React.useState<number | null>(null);
  const selectedIdxRef = React.useRef<number | null>(null);
  const [keybinds, setKeybinds] = React.useState<KeybindConfig>(() =>
    loadKeybinds(),
  );
  const [showKeybinds, setShowKeybinds] = React.useState(false);
  const [prefs, setPrefs] = useCookieState<DisplayPrefs>(
    'editor-display',
    DEFAULT_PREFS,
  );
  // Ensure any missing preference keys from older cookies are filled with
  // current defaults to avoid undefined values
  React.useEffect(() => {
    const merged = { ...DEFAULT_PREFS, ...prefs };
    const hasDiff = (Object.keys(DEFAULT_PREFS) as (keyof DisplayPrefs)[]).some(
      (key) => merged[key] !== prefs[key],
    );
    if (hasDiff) {
      setPrefs(merged);
    }
    // We only want this to run on mount
  }, []);
  const [showDisplaySettings, setShowDisplaySettings] = React.useState(false);
  const [showViewOptions, setShowViewOptions] = React.useState(false);

  // Tempo/grid controls
  const [bpmInput, setBpmInput] = React.useState('120');
  const bpm = parseFloat(bpmInput) || 120;
  const [subdivision, setSubdivision] = React.useState(1);
  const [gridOffsetInput, setGridOffsetInput] = React.useState('0');
  const [analyzingBpm, setAnalyzingBpm] = React.useState(false);
  const [showBeatGrid, setShowBeatGrid] = React.useState(true);

  useWaveform(audioUrl, duration, canvasRef, sensitivity, prefs);

  const handleAnalyzeBpm = React.useCallback(async () => {
    if (!audioUrl) return;
    if (!window.confirm('Are you sure? This may require extra CPU usage'))
      return;
    setAnalyzingBpm(true);
    try {
      const ctx = new AudioContext();
      const res = await fetch(audioUrl);
      const buf = await res.arrayBuffer();
      const audioBuffer = await ctx.decodeAudioData(buf);
      const estimated = detect(audioBuffer);
      if (estimated) setBpmInput(estimated.toFixed(2));
      ctx.close();
    } catch (err) {
      console.error('Failed to analyze BPM', err);
    } finally {
      setAnalyzingBpm(false);
    }
  }, [audioUrl]);

  React.useEffect(() => {
    selectedIdxRef.current = selectedIdx;
  }, [selectedIdx]);

  // Generic input modal state
  const {
    promptVisible,
    promptTitle,
    promptInitial,
    showPrompt,
    handlePromptCancel,
    handlePromptSubmit,
  } = usePrompt();

  React.useEffect(() => {
    saveKeybinds(keybinds);
  }, [keybinds]);

  const pxPerSec = zoom;
  const offsetSec = offsetMs / 1000;
  const gridOffsetSec = (parseFloat(gridOffsetInput) || 0) / 1000;
  const blockHeight = prefs.blockHeight;
  const blockTop = (CANVAS_HEIGHT - blockHeight) / 2;

  // Keep ref in sync with latest lines
  React.useEffect(() => {
    linesRef.current = lines;
  }, [lines]);

  React.useEffect(() => {
    if (
      selectedIdxRef.current !== null &&
      selectedIdxRef.current >= lines.length
    ) {
      setSelectedIdx(null);
    }
  }, [lines]);

  // Flag to differentiate true timeline clicks from drag/resize interactions
  const isInteractingRef = React.useRef(false);
  // Suppresses the next block click after a drag/resize
  const skipBlockClickRef = React.useRef(false);
  const shiftDownRef = React.useRef(false);

  // Temporarily disable auto-centering while the offset is being adjusted
  const suppressCenterRef = React.useRef(false);
  const offsetTimeoutRef = React.useRef<number | undefined>(undefined);

  React.useEffect(() => {
    suppressCenterRef.current = true;
    if (offsetTimeoutRef.current) clearTimeout(offsetTimeoutRef.current);
    offsetTimeoutRef.current = window.setTimeout(() => {
      suppressCenterRef.current = false;
    }, 300);
  }, [offsetSec]);

  /* ------------------- GLOBAL LISTENERS ------------------- */
  /* ------------------ PLAYHEAD COLLISIONS ----------------- */

  /* ------------------ COLLISION HANDLER -------------------- */
  const resolveCollisions = React.useCallback(
    (updated: LrcLine[], moverIdx: number): LrcLine[] => {
      const sorted = [...updated].sort((a, b) => a.time - b.time);
      const mover = updated[moverIdx];
      for (let i = 0; i < sorted.length; i++) {
        const cur = sorted[i];
        if (cur === mover) continue;
        const overlap = cur.time < mover.end && mover.time < cur.end;
        if (!overlap) continue;
        // Mover cuts into cur
        if (mover.time <= cur.time) {
          const len = cur.end - cur.time;
          const newStart = mover.end;
          const minLen = 0.1;
          if (len - (newStart - cur.time) < minLen) {
            updated = updated.filter((l) => l !== cur);
          } else cur.time = newStart;
        } else {
          const len = cur.end - cur.time;
          const newEnd = mover.time;
          if (len - (cur.end - newEnd) < 0.1) {
            updated = updated.filter((l) => l !== cur);
          } else cur.end = newEnd;
        }
      }
      return [...updated];
    },
    [],
  );

  /* ------------------ SNAPPING HELPERS --------------------- */
  const snapTime = (timeSec: number, excludeIdx: number): number => {
    if (!shiftDownRef.current) return timeSec; // Snapping OFF unless Shift held
    const points: number[] = [];
    lines.forEach((l, i) => {
      if (i === excludeIdx) return;
      points.push(l.time, l.end);
    });

    // Snap to visible beat grid ticks when the grid is shown
    if (showBeatGrid) {
      const container = containerRef.current;
      const quarterSec = 60 / bpm / 4;
      if (container && bpm > 0 && isFinite(quarterSec) && quarterSec > 0) {
        const startVis = container.scrollLeft / pxPerSec - offsetSec;
        const endVis =
          (container.scrollLeft + container.clientWidth) / pxPerSec - offsetSec;
        const startTick =
          Math.ceil((startVis - gridOffsetSec) / quarterSec) * quarterSec +
          gridOffsetSec;
        for (let t = startTick; t <= endVis; t += quarterSec) {
          const idx = Math.round((t - gridOffsetSec) / quarterSec);
          const type =
            idx % 4 === 0 ? 'major' : idx % 2 === 0 ? 'mid' : 'minor';
          if (subdivision < 4 && type === 'minor') continue;
          if (subdivision < 2 && type === 'mid') continue;
          points.push(t);
        }
      }
    }

    let closest = timeSec;
    let minDiff = SNAP_THRESHOLD_SEC + 1;
    points.forEach((p) => {
      const diff = Math.abs(p - timeSec);
      if (diff < minDiff && diff <= SNAP_THRESHOLD_SEC) {
        closest = p;
        minDiff = diff;
      }
    });
    return closest;
  };

  /* ------------------ TIMELINE UTILS ----------------------- */
  const centerTimeline = React.useCallback(
    (time: number) => {
      const container = containerRef.current;
      if (!container) return;
      const left = time * pxPerSec;
      container.scrollTo({
        left: Math.max(left - container.clientWidth / 2, 0),
        behavior: 'smooth',
      });
    },
    [pxPerSec],
  );

  const jumpToTime = React.useCallback(
    (time: number, alsoCenter: boolean = false) => {
      setPlayTime(time);
      onSeek?.(time);
      if (alsoCenter) centerTimeline(time);
    },
    [centerTimeline, onSeek],
  );

  // Keep the latest jumpToTime function without re-running effects when it changes
  const jumpToTimeRef = React.useRef(jumpToTime);
  React.useEffect(() => {
    jumpToTimeRef.current = jumpToTime;
  }, [jumpToTime]);

  // Keep playhead centred when zoom changes
  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const left = playTimeRef.current * pxPerSec - container.clientWidth / 2;
    container.scrollLeft = Math.max(left, 0);
  }, [pxPerSec]);

  /* -------------------- PLAYHEAD UPDATER ------------------- */
  React.useEffect(() => {
    if (!getCurrentTime) return;
    let raf: number;
    const update = () => {
      // centerTimeline(playTime);

      const current = getCurrentTime();
      if (!isInteractingRef.current) {
        setPlayTime(current);
        if (followPlayhead && playing && !suppressCenterRef.current) {
          const container = containerRef.current;
          if (container) {
            const playheadX = current * pxPerSec;
            const { scrollLeft, clientWidth } = container;
            if (
              playheadX < scrollLeft ||
              playheadX > scrollLeft + clientWidth
            ) {
              container.scrollTo({
                left: Math.max(playheadX - clientWidth / 2, 0),
              });
            }
          }
        }
      }
      raf = requestAnimationFrame(update);
    };
    update();
    return () => cancelAnimationFrame(raf);
  }, [getCurrentTime, followPlayhead, playing, pxPerSec]);

  /* ------------- SCROLL / SEEK TO SPECIFIC LYRIC ----------- */
  React.useEffect(() => {
    if (scrollToIndex === null) return;
    const t = linesRef.current[scrollToIndex]?.time ?? 0;
    // Jump playhead *and* recentre when prop changes
    jumpToTimeRef.current(t, true);
  }, [scrollToIndex, scrollVersion]);

  /* --------------------- DRAG HELPERS ---------------------- */
  const startDrag = (
    idx: number,
    startX: number,
    startTime: number,
    endTime: number,
  ) => {
    isInteractingRef.current = true;
    const segmentLen = endTime - startTime;
    onChange([...lines], true);
    let latest = [...lines];
    const linked = getLinkedIndices(lines, idx);

    const onMove = (ev: MouseEvent) => {
      const diff = (ev.clientX - startX) / pxPerSec;
      let newStart = startTime + diff;
      newStart = Math.min(
        Math.max(newStart, 0),
        Math.max(duration - segmentLen, 0),
      );
      newStart = snapTime(newStart, idx);

      let updated = [...lines];
      const newEnd = newStart + segmentLen;
      updated[idx] = {
        ...updated[idx],
        time: newStart,
        end: newEnd,
      };
      if (linkNodes) {
        linked.startTimes.forEach((i) => {
          updated[i] = { ...updated[i], time: newStart };
        });
        linked.startEnds.forEach((i) => {
          updated[i] = { ...updated[i], end: newStart };
        });
        linked.endTimes.forEach((i) => {
          updated[i] = { ...updated[i], time: newEnd };
        });
        linked.endEnds.forEach((i) => {
          updated[i] = { ...updated[i], end: newEnd };
        });
      }
      const indices = new Set([
        idx,
        ...linked.startTimes,
        ...linked.startEnds,
        ...linked.endTimes,
        ...linked.endEnds,
      ]);
      indices.forEach((i) => {
        updated = resolveCollisions(updated, i);
      });
      latest = updated;
      onChange(updated, false);
    };
    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      skipBlockClickRef.current = true;
      // Delay resetting so block click doesn't fire after drag
      setTimeout(() => {
        isInteractingRef.current = false;
        skipBlockClickRef.current = false;
      }, 50);
      onChange(latest, false);
    };
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp, { passive: false });
  };

  const handleMouseDownBlock = (idx: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startDrag(idx, e.clientX, lines[idx].time, lines[idx].end);
  };

  const startResize = (
    idx: number,
    which: 'start' | 'end',
    startX: number,
    startTime: number,
  ) => {
    isInteractingRef.current = true;
    onChange([...lines], true);
    let latest = [...lines];
    const linked = getLinkedIndices(lines, idx);

    const onMove = (ev: MouseEvent) => {
      const diff = (ev.clientX - startX) / pxPerSec;
      let newTime = startTime + diff;
      newTime = Math.min(Math.max(newTime, 0), duration);
      newTime = snapTime(newTime, idx);

      let updated = [...lines];
      if (which === 'start') {
        const max = updated[idx].end - 0.1; // min 100 ms
        const finalTime = Math.min(newTime, max);
        updated[idx] = { ...updated[idx], time: finalTime };
        if (linkNodes) {
          linked.startTimes.forEach((i) => {
            updated[i] = { ...updated[i], time: finalTime };
          });
          linked.startEnds.forEach((i) => {
            updated[i] = { ...updated[i], end: finalTime };
          });
        }
      } else {
        const min = updated[idx].time + 0.1;
        const finalTime = Math.max(Math.min(newTime, duration), min);
        updated[idx] = {
          ...updated[idx],
          end: finalTime,
        };
        if (linkNodes) {
          linked.endTimes.forEach((i) => {
            updated[i] = { ...updated[i], time: finalTime };
          });
          linked.endEnds.forEach((i) => {
            updated[i] = { ...updated[i], end: finalTime };
          });
        }
      }
      const indices = new Set([
        idx,
        ...(which === 'start'
          ? [...linked.startTimes, ...linked.startEnds]
          : [...linked.endTimes, ...linked.endEnds]),
      ]);
      indices.forEach((i) => {
        updated = resolveCollisions(updated, i);
      });
      latest = updated;
      onChange(updated, false);
    };

    const onUp = () => {
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
      skipBlockClickRef.current = true;
      // Delay resetting so block click doesn't fire after resize
      setTimeout(() => {
        isInteractingRef.current = false;
        skipBlockClickRef.current = false;
      }, 50);
      onChange(latest, false);
    };
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp, { passive: false });
  };

  /* --------------------- HELPERS -------------------------- */
  const editLineText = async (idx: number) => {
    const current = lines[idx]?.text ?? '';
    const result = await showPrompt('Edit lyric', current);
    if (result !== null) {
      const updated = [...lines];
      updated[idx] = { ...updated[idx], text: result };
      onChange(updated, true);
    }
  };

  const deleteLine = React.useCallback(
    (idx: number) => {
      onDeleteLine?.(idx);
      onChange(
        lines.filter((_, i) => i !== idx),
        true,
      );
    },
    [lines, onChange, onDeleteLine],
  );

  const splitLine = async (idx: number) => {
    const current = lines[idx];
    const input = await showPrompt(
      'Insert "|" where you want to split',
      current.text,
    );
    if (input === null) return;
    const parts = input.split('|');
    if (parts.length <= 1) {
      if (input !== current.text) {
        const updated = [...lines];
        updated[idx] = { ...current, text: input };
        onChange(updated, true);
      }
      return;
    }
    const segLen = (current.end - current.time) / parts.length;
    const newLines: LrcLine[] = parts.map((text, i) => ({
      id: generateId(),
      time: current.time + segLen * i,
      end: current.time + segLen * (i + 1),
      text: text.trim(),
    }));
    onInsertLines?.(idx + 1, parts.length - 1);
    onChange(
      [...lines.slice(0, idx), ...newLines, ...lines.slice(idx + 1)],
      true,
    );
  };

  const save = async () => {
    const adjusted = lines.map((l) => ({
      ...l,
      time: l.time + offsetSec,
      end: l.end + offsetSec,
    }));
    const lrcText = stringifyLrc(adjusted);
    await saveTextFile(lrcText, fileName);
  };

  const removeAllGapsRight = React.useCallback(() => {
    const sorted = [...lines].sort((a, b) => a.time - b.time);
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i].end < sorted[i + 1].time) {
        sorted[i].end = sorted[i + 1].time;
      }
    }
    onChange(sorted, true);
  }, [lines, onChange]);

  const removeAllGapsLeft = React.useCallback(() => {
    const sorted = [...lines].sort((a, b) => a.time - b.time);
    for (let i = 1; i < sorted.length; i++) {
      const prevEnd = sorted[i - 1].end;
      if (sorted[i].time > prevEnd) {
        sorted[i].time = prevEnd;
      }
    }
    onChange(sorted, true);
  }, [lines, onChange]);

  /* ------------------- GLOBAL LISTENERS ------------------- */
  React.useEffect(() => {
    // Shift toggles snapping ON while held and disables zoom-by-wheel

    const down = async (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftDownRef.current = true;
      }

      const getActiveIdx = () => {
        const t = playTimeRef.current;
        const offset = offsetSec;

        // First try the remembered selection, but only if it still covers the playhead
        const selected = selectedIdxRef.current;
        if (selected !== null && selected < linesRef.current.length) {
          const selLine = linesRef.current[selected];
          if (t >= selLine.time + offset && t <= selLine.end + offset) {
            return selected;
          }
        }

        // Otherwise scan for the line that currently contains the playhead
        for (let i = 0; i < linesRef.current.length; i++) {
          const l = linesRef.current[i];
          if (t >= l.time + offset && t <= l.end + offset) return i;
        }
        return null;
      };

      const target = e.target as HTMLElement;
      const isEditingTarget =
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable;

      // Allow spacebar to toggle playback even when editing text
      if (isEditingTarget && e.code === 'Space') {
        return;
      }

      if (isEditingTarget) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        onUndo?.();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        onRedo?.();
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        const idx = getActiveIdx();
        const curLines = linesRef.current;
        if (idx !== null) copiedTextRef.current = curLines[idx]?.text ?? null;
        return;
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        const text = copiedTextRef.current;
        if (!text) return;
        const idx = getActiveIdx();
        const time = playTimeRef.current;
        const curLines = linesRef.current;
        if (idx !== null) {
          const cur = curLines[idx];
          if (time >= cur.time + offsetSec && time <= cur.end + offsetSec) {
            const next = curLines[idx + 1];
            const newLine: LrcLine = {
              id: generateId(),
              time,
              end: next ? next.time : cur.end,
              text,
            };
            const updated = [...curLines];
            updated[idx] = { ...cur, end: time };
            updated.splice(idx + 1, 0, newLine);
            onChange(updated, true);
            setSelectedIdx(idx + 1);
            return;
          }
        }
        const { prev, next } = findNeighbours(time);
        const start = prev ? prev.end : 0;
        const end = next ? next.time : Math.min(start + 3, duration);
        const newLine: LrcLine = {
          id: generateId(),
          time: start,
          end: Math.max(end, start + 0.1),
          text,
        };
        onChange([...curLines, newLine], true);
        return;
      }
      // Global play / pause (Space)
      if (e.code === 'Space') {
        e.preventDefault();
        if (onTogglePlay) {
          onTogglePlay();
        } else {
          const media = document.querySelector<HTMLMediaElement>('audio,video');
          if (media) {
            if (media.paused) {
              media.play();
            } else {
              media.pause();
            }
          }
        }
      }

      const key = e.key.length === 1 ? e.key.toUpperCase() : e.key;
      if (key === keybinds.jumpToPlayhead) {
        e.preventDefault();
        centerTimeline(playTimeRef.current);
        return;
      }
      if (key === keybinds.removeGapsRight) {
        e.preventDefault();
        removeAllGapsRight();
        return;
      }
      if (key === keybinds.removeGapsLeft) {
        e.preventDefault();
        removeAllGapsLeft();
        return;
      }
      if (key === keybinds.newBlock) {
        e.preventDefault();
        const text = await showPrompt('New lyric text', '');
        if (text === null) return;

        const currentLines = linesRef.current;
        const time = playTimeRef.current;

        const activeIdx = getActiveIdx();
        if (activeIdx !== null) {
          const cur = currentLines[activeIdx];
          if (time >= cur.time + offsetSec && time <= cur.end + offsetSec) {
            const next = currentLines[activeIdx + 1];
            const newLine: LrcLine = {
              id: generateId(),
              time,
              end: next ? next.time : cur.end,
              text,
            };
            const updated = [...currentLines];
            updated[activeIdx] = { ...cur, end: time };
            updated.splice(activeIdx + 1, 0, newLine);
            onInsertLines?.(activeIdx + 1, 1);
            onChange(updated, true);
            setSelectedIdx(activeIdx + 1);
            return;
          }
        }

        if (currentLines.length === 0) {
          const start = time;
          const end = Math.min(start + 3, duration);
          const newLine: LrcLine = {
            id: generateId(),
            time: start,
            end: Math.max(end, start + 0.1),
            text,
          };
          onInsertLines?.(0, 1);
          onChange([newLine], true);
        } else {
          const { prev, next } = findNeighbours(time);
          const start = prev ? prev.end : 0;
          const end = next ? next.time : Math.min(start + 3, duration);
          const newLine: LrcLine = {
            id: generateId(),
            time: start,
            end: Math.max(end, start + 0.1),
            text,
          };
          onInsertLines?.(currentLines.length, 1);
          onChange([...currentLines, newLine], true);
        }
        return;
      }
      if (key === keybinds.addAfter) {
        e.preventDefault();
        let idx = selectedIdxRef.current;
        if (idx === null) {
          const active = getActiveIdx();
          if (active !== null) idx = active;
        }
        if (idx === null) return;
        const text = await showPrompt('New lyric text', '');
        if (text === null) return;
        const curLines = linesRef.current;
        const cur = curLines[idx];
        const next = curLines[idx + 1];
        const start = cur.end;
        const end = next ? next.time : Math.min(start + 3, duration);
        const newLine: LrcLine = {
          id: generateId(),
          time: start,
          end: Math.max(end, start + 0.1),
          text,
        };
        const updated = [...curLines];
        updated.splice(idx + 1, 0, newLine);
        onInsertLines?.(idx + 1, 1);
        onChange(updated, true);
        setSelectedIdx(idx + 1);
        return;
      }
      {
        const activeIdx = getActiveIdx();
        if (activeIdx !== null) {
          if (key === keybinds.setStart) {
            e.preventDefault();
            const updated = [...lines];
            const cur = updated[activeIdx];
            updated[activeIdx] = { ...cur, time: playTimeRef.current };
            onChange(updated, true);
            return;
          }
          if (key === keybinds.setEnd) {
            e.preventDefault();
            const updated = [...lines];
            const cur = updated[activeIdx];
            updated[activeIdx] = { ...cur, end: playTimeRef.current };
            onChange(updated, true);
            return;
          }
          if (key === keybinds.deleteBlock) {
            e.preventDefault();
            deleteLine(activeIdx);
            setSelectedIdx(null);
            return;
          }
        } else {
          const sorted = lines
            .map((l, i) => ({ ...l, idx: i }))
            .sort((a, b) => a.time - b.time);
          if (key === keybinds.setStart && sorted.length > 0) {
            const first = sorted[0];
            if (playTimeRef.current <= first.time) {
              e.preventDefault();
              const updated = [...lines];
              updated[first.idx] = {
                ...lines[first.idx],
                time: playTimeRef.current,
              };
              onChange(updated, true);
              return;
            }
          }
          if (key === keybinds.setEnd && sorted.length > 0) {
            const last = sorted[sorted.length - 1];
            if (playTimeRef.current >= last.end) {
              e.preventDefault();
              const updated = [...lines];
              updated[last.idx] = {
                ...lines[last.idx],
                end: playTimeRef.current,
              };
              onChange(updated, true);
              return;
            }
          }
        }
      }
    };
    const up = (e: KeyboardEvent) => {
      if (e.key === 'Shift') {
        shiftDownRef.current = false;
      }
    };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [
    onUndo,
    onRedo,
    onTogglePlay,
    keybinds,
    centerTimeline,
    onChange,
    deleteLine,
    duration,
    lines,
    offsetSec,
    removeAllGapsLeft,
    removeAllGapsRight,
  ]);
  /* ---------------- TIMELINE INTERACTION ------------------ */
  const seekToClientX = (clientX: number) => {
    const container = containerRef.current;
    const containerRect = container?.getBoundingClientRect();
    if (!container || !containerRect) return 0;

    // Account for container padding and border when converting clientX to timeline pixels
    const styles = window.getComputedStyle(container);
    const paddingLeft = parseFloat(styles.paddingLeft) || 0;
    const px =
      clientX -
      containerRect.left -
      container.clientLeft -
      paddingLeft +
      container.scrollLeft;
    const raw = px / pxPerSec;
    const time = Math.max(0, Math.min(raw, duration));
    jumpToTime(time);
    return time;
  };

  const isTimelineSurface = (target: HTMLElement) =>
    target.dataset.role !== 'lyric-block';
  const isPlayhead = (target: HTMLElement) =>
    target.dataset.role === 'playhead';

  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isInteractingRef.current) return;
    const target = e.target as HTMLElement;
    if (!isTimelineSurface(target) && !isPlayhead(target)) return;
    seekToClientX(e.clientX);
  };

  /* -------------- TIMELINE DRAG (SCRUB) ------------------- */
  const handleTimelineMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const playhead = isPlayhead(target);
    if (!isTimelineSurface(target) && !playhead) return;
    e.preventDefault();
    isInteractingRef.current = true;
    seekToClientX(e.clientX);

    const onMove = (ev: MouseEvent) => seekToClientX(ev.clientX);
    const onUp = () => {
      isInteractingRef.current = false;
      window.removeEventListener('mousemove', onMove);
      window.removeEventListener('mouseup', onUp);
    };
    window.addEventListener('mousemove', onMove, { passive: false });
    window.addEventListener('mouseup', onUp, { passive: false });
  };

  /* --------------- ZOOM WHEEL HANDLING -------------------- */
  /**
   * Scroll on the timeline controls zoom level (unless Shift held).
   */
  const handleTimelineWheel = React.useCallback((e: WheelEvent) => {
    // When holding Shift we allow the browser's native horizontal scroll
    if (shiftDownRef.current || e.shiftKey) {
      return;
    }

    // Otherwise prevent scrolling and use the wheel for zooming
    e.preventDefault();
    e.stopPropagation();

    const delta = e.deltaY < 0 ? 10 : -10; // scroll up → zoom in
    setZoom((z) => {
      const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, z + delta));
      return newZoom === z ? z : newZoom;
    });
  }, []);

  // Attach the wheel handler with passive: false so preventDefault works
  React.useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    container.addEventListener('wheel', handleTimelineWheel, {
      passive: false,
    });
    return () => {
      container.removeEventListener('wheel', handleTimelineWheel);
    };
  }, [handleTimelineWheel]);

  const handleZoomSliderChange: React.ChangeEventHandler<HTMLInputElement> = (
    e,
  ) => {
    const newZoom = Math.max(
      MIN_ZOOM,
      Math.min(MAX_ZOOM, parseInt(e.target.value, 10)),
    );
    setZoom(newZoom);
  };

  /* --------- CONTEXT MENU (TIMELINE RIGHT‑CLICK) ---------- */
  const handleTimelineContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    const playhead = isPlayhead(target);
    if (!isTimelineSurface(target) && !playhead) return; // ignore right‑clicks on blocks only
    e.preventDefault();
    const time = seekToClientX(e.clientX);
    setTimelineMenu({ x: e.clientX, y: e.clientY, time });
  };

  /* ------------ INSERT LOGIC WITH NEIGHBOURS -------------- */
  const findNeighbours = (t: number) => {
    let prev: LrcLine | null = null;
    let next: LrcLine | null = null;
    for (const l of [...linesRef.current].sort((a, b) => a.time - b.time)) {
      if (l.end <= t) prev = l;
      else if (l.time >= t && !next) next = l;
    }
    return { prev, next };
  };

  const insertBlock = async (time: number, promptForText: boolean) => {
    let text = '';
    if (promptForText) {
      const result = await showPrompt('New lyric text', '');
      if (result === null) {
        setTimelineMenu(null);
        return;
      }
      text = result;
    }

    const curLines = linesRef.current;
    if (curLines.length === 0) {
      const start = time;
      const end = Math.min(start + 3, duration);
      const newLine: LrcLine = {
        id: generateId(),
        time: start,
        end: Math.max(end, start + 0.1),
        text,
      };
      onInsertLines?.(0, 1);
      onChange([newLine], true);
    } else {
      const { prev, next } = findNeighbours(time);
      const start = prev ? prev.end : 0;
      const end = next ? next.time : Math.min(start + 3, duration);

      const newLine: LrcLine = {
        id: generateId(),
        time: start,
        end: Math.max(end, start + 0.1),
        text,
      };
      onInsertLines?.(curLines.length, 1);
      onChange([...curLines, newLine], true);
    }
    setTimelineMenu(null);
  };

  /* --------------- BLOCK CONTEXT MENU -------------------- */
  const handleBlockContextMenu = (idx: number) => (e: React.MouseEvent) => {
    e.preventDefault();
    setBlockMenu({ x: e.clientX, y: e.clientY, idx });
  };

  /* ------------------ RENDER ------------------------------ */
  const timelineHeight = CANVAS_HEIGHT + blockHeight + 20;

  return (
    <div>
      {/* Controls */}
      <div
        style={{
          marginBottom: '0.5rem',
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <label>
          Zoom:
          <input
            type="range"
            min={MIN_ZOOM}
            max={MAX_ZOOM}
            step={5}
            value={zoom}
            onChange={handleZoomSliderChange}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>
        <label>
          Wave Height:
          <input
            type="range"
            min={MIN_SENSITIVITY}
            max={MAX_SENSITIVITY}
            step={0.1}
            value={sensitivity}
            onChange={(e) => setSensitivity(parseFloat(e.target.value))}
            style={{ marginLeft: '0.5rem' }}
          />
        </label>
        <button onClick={() => setShowViewOptions(true)}>View Options</button>
        <label style={{ marginLeft: '0.5rem', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={followPlayhead}
            onChange={(e) => setFollowPlayhead(e.target.checked)}
            style={{ marginRight: '0.25rem' }}
          />
          Follow playhead
        </label>
        <label style={{ marginLeft: '0.5rem', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={linkNodes}
            onChange={(e) => setLinkNodes(e.target.checked)}
            style={{ marginRight: '0.25rem' }}
          />
          Link lyric nodes
        </label>
        <label style={{ marginLeft: '0.5rem', userSelect: 'none' }}>
          <input
            type="checkbox"
            checked={showBeatGrid}
            onChange={(e) => setShowBeatGrid(e.target.checked)}
            style={{ marginRight: '0.25rem' }}
          />
          Show beat grid
        </label>

        {/* Sticky snapping indicator moved outside scrolling region */}
        <div
          style={{
            fontSize: '12px',
            color: '#666',
            pointerEvents: 'none',
            marginLeft: 'auto',
          }}
        >
          SHIFT to snap
        </div>
      </div>

      {/* Timeline Scroll Container */}
      <div
        ref={containerRef}
        style={{
          position: 'relative',
          overflowX: 'auto',
          border: '1px solid #ccc',
          padding: '0.5rem',
          marginBottom: '1rem',
          userSelect: 'none',
          overscrollBehaviorX: 'contain',
          overscrollBehaviorY: 'contain',
          touchAction: 'none',
        }}
      >
        {/* Actual timeline (wide) */}
        <div
          ref={timelineRef}
          onClick={handleTimelineClick}
          onMouseDown={handleTimelineMouseDown}
          onContextMenu={handleTimelineContextMenu}
          style={{
            position: 'relative',
            width: `${duration * pxPerSec}px`,
            height: `${timelineHeight}px`,
          }}
        >
          {/* Waveform */}
          <canvas
            ref={canvasRef}
            style={{
              width: `${duration * pxPerSec}px`,
              height: `${CANVAS_HEIGHT}px`,
            }}
          />

          {/* Beat grid overlay */}
          {showBeatGrid && (
            <BeatGridOverlay
              duration={duration}
              pxPerSec={pxPerSec}
              audioOffsetSec={0}
              bpm={bpm}
              overlayOffsetSec={gridOffsetSec}
              height={timelineHeight}
              subdivision={subdivision}
            />
          )}

          {/* Playhead */}
          <div
            data-role="playhead"
            ref={playheadRef}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '2px',
              height: '100%',
              background: '#ff6b6b',
              pointerEvents: 'none',
              transform: `translateX(${playTime * pxPerSec}px)`,
              willChange: 'transform',
            }}
          />

          {/* Lyric blocks */}
          {lines.map((line, idx) => {
            const width = (line.end - line.time) * pxPerSec;
            const topPx = blockTop;
            const isBreak = line.text.trim() === '';
            const isActive =
              playTime >= line.time + offsetSec &&
              playTime < line.end + offsetSec;
            const baseColor = hexToRgba(
              isBreak ? prefs.breakColor : prefs.blockColor,
              prefs.blockOpacity,
            );

            return (
              <div
                key={line.id}
                data-role="lyric-block"
                data-idx={idx}
                className={`${isActive ? 'active-block' : ''} ${
                  selectedIdx === idx ? 'selected-block' : ''
                }`}
                onMouseDown={handleMouseDownBlock(idx)}
                onClick={() => {
                  if (skipBlockClickRef.current) {
                    skipBlockClickRef.current = false;
                    return;
                  }
                  if (!isInteractingRef.current) jumpToTime(line.time, true);
                  setSelectedIdx(idx);
                }}
                onDoubleClick={() => editLineText(idx)}
                onContextMenu={handleBlockContextMenu(idx)}
                style={{
                  position: 'absolute',
                  top: `${topPx}px`,
                  left: `${(line.time + offsetSec) * pxPerSec}px`,
                  width: `${width}px`,
                  height: `${blockHeight}px`,
                  cursor: 'grab',
                  backgroundColor: baseColor,
                  color: prefs.blockTextColor,
                  borderRadius: '2px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: `${prefs.blockFontSize}px`,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  userSelect: 'none',
                }}
              >
                {/* Left resize handle */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    startResize(idx, 'start', e.clientX, line.time);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    bottom: 0,
                    width: '8px',
                    cursor: 'ew-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '10px',
                      height: '10px',
                      background: '#ffffff',
                      border: '1px solid #0056b3',
                    }}
                  />
                </div>

                {line.text}

                {/* Right resize handle */}
                <div
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    startResize(idx, 'end', e.clientX, line.end);
                  }}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    position: 'absolute',
                    right: 0,
                    top: 0,
                    bottom: 0,
                    width: '8px',
                    cursor: 'ew-resize',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <div
                    style={{
                      width: '6px',
                      height: '10px',
                      background: '#ffffff',
                      border: '1px solid #0056b3',
                    }}
                  />
                </div>
              </div>
            );
          })}

          {(timelineMenu || blockMenu) && (
            <div
              onClick={() => {
                setTimelineMenu(null);
                setBlockMenu(null);
              }}
              style={{ position: 'fixed', inset: 0, zIndex: 999 }}
            />
          )}

          {/* Timeline context menu */}
          {timelineMenu && (
            <div
              className="context-menu"
              style={{ top: timelineMenu.y, left: timelineMenu.x }}
            >
              <div
                className="context-menu-item"
                onClick={() => insertBlock(timelineMenu.time, true)}
              >
                Insert new block
              </div>
              <div
                className="context-menu-item"
                onClick={() => insertBlock(timelineMenu.time, false)}
              >
                Insert new break
              </div>
              <div
                className="context-menu-item"
                style={{ color: '#888' }}
                onClick={() => setTimelineMenu(null)}
              >
                Cancel
              </div>
            </div>
          )}

          {/* Block context menu */}
          {blockMenu && (
            <div
              className="context-menu"
              style={{ top: blockMenu.y, left: blockMenu.x }}
            >
              <div
                className="context-menu-item"
                onClick={() => {
                  editLineText(blockMenu.idx);
                  setBlockMenu(null);
                }}
              >
                Edit lyric text
              </div>
              <div
                className="context-menu-item"
                onClick={() => {
                  splitLine(blockMenu.idx);
                  setBlockMenu(null);
                }}
              >
                Split block
              </div>
              <div
                className="context-menu-item"
                style={{ color: '#d9534f' }}
                onClick={() => {
                  deleteLine(blockMenu.idx);
                  setBlockMenu(null);
                }}
              >
                Delete
              </div>
              <div
                className="context-menu-item"
                style={{ color: '#888' }}
                onClick={() => setBlockMenu(null)}
              >
                Cancel
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Action buttons */}
      <div
        style={{
          marginTop: '0.5rem',
          display: 'flex',
          gap: '0.5rem',
          alignItems: 'center',
        }}
      >
        <button onClick={onUndo} disabled={!canUndo}>
          <img src={undoIcon} alt="Undo" style={{ width: 20, height: 20 }} />
        </button>
        <button onClick={onRedo} disabled={!canRedo}>
          <img src={redoIcon} alt="Redo" style={{ width: 20, height: 20 }} />
        </button>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
          <button onClick={save}>Save LRC As…</button>
          {/* The button above should disappear if the user has chosen to add a translation */}
          <button onClick={() => setShowKeybinds(true)}>
            <img
              src={optionIcon}
              alt="Keybinds"
              style={{ width: 20, height: 20 }}
            />
          </button>
          <button onClick={() => centerTimeline(playTime)}>
            Jump to current position
          </button>
        </div>
      </div>
      {showKeybinds && (
        <KeybindSettings
          binds={keybinds}
          onChange={setKeybinds}
          onClose={() => setShowKeybinds(false)}
        />
      )}
      {showDisplaySettings && (
        <EditorDisplaySettings
          prefs={prefs}
          onChange={setPrefs}
          onClose={() => setShowDisplaySettings(false)}
        />
      )}
      {showViewOptions && (
        <ViewOptionsDialog
          visible={showViewOptions}
          bpmInput={bpmInput}
          setBpmInput={setBpmInput}
          analyzingBpm={analyzingBpm}
          onAnalyzeBpm={handleAnalyzeBpm}
          subdivision={subdivision}
          setSubdivision={setSubdivision}
          gridOffsetInput={gridOffsetInput}
          setGridOffsetInput={setGridOffsetInput}
          onClose={() => setShowViewOptions(false)}
          onShowAdvanced={() => {
            setShowViewOptions(false);
            setShowDisplaySettings(true);
          }}
        />
      )}
      <InputModal
        visible={promptVisible}
        title={promptTitle}
        initialValue={promptInitial}
        onCancel={handlePromptCancel}
        onSubmit={handlePromptSubmit}
      />
    </div>
  );
};

export default LrcEditor;

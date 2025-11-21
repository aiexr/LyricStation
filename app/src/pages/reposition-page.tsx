import React from 'react';
import type { LrcLine } from '../utils/parse-lrc';
import useDraggable, { type Point } from '../hooks/use-draggable';
import usePersistedState from '../hooks/use-persisted-state';
import {
  useScreenRecorder,
  type RecordingSettings,
} from '../hooks/use-screen-recorder';
import RecordModal from '../modals/record-modal';
import { formatTime } from '../utils/time-utils';
import useImageGradient from '../hooks/use-image-gradient';
import FileDropZone, { DefaultFolderIcon } from '../components/file-drop-zone';
import { readFileAsDataURL } from '../utils/file-utils';
import ManageProfilesModal, {
  type PositionProfile,
} from '../modals/manage-profiles-modal';
import useProfiles from '../hooks/use-profiles';
import NewWindow from 'react-new-window';
import useFontOptions from '../hooks/use-font-options';
import TypographySettings from '../settings/typography-settings';
import LyricDisplayPage, {
  type LyricDisplayPageHandle,
} from './lyric-display-page';
import type { DisplaySettings } from '../types/display-settings';
import RecordSettingsModal from '../modals/record-settings-modal';
import {
  LyricPlayer,
  BackgroundRender,
  EplorRenderer,
} from '@applemusic-like-lyrics/react';

const BASE_ART_SIZE = 300;
const BAR_HEIGHT = 6;

interface Props {
  lines: LrcLine[];
  /** Optional translation lines matching the lyrics */
  translation?: string[];
  albumArtUrl: string | null;
  songName: string;
  artistName: string;
  albumName: string;
  audioUrl: string | null;
  customBg: string | null;
  onCustomBgChange: (url: string | null) => void;
  onBack: () => void;
  onNext: (settings: DisplaySettings) => void;
  onSave?: (settings: DisplaySettings) => void;
  /**
   * Optional initial display settings used when loading an existing project.
   */
  settings?: DisplaySettings;
}

const RepositionPage: React.FC<Props> = ({
  lines,
  translation,
  albumArtUrl,
  songName,
  artistName,
  albumName,
  audioUrl,
  customBg,
  onCustomBgChange,
  onBack,
  onNext,
  onSave,
  settings,
}) => {
  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [storedArtPos, setStoredArtPos] = usePersistedState('pos-art', {
    x: 0,
    y: 0,
  });
  const [storedMetaPos, setStoredMetaPos] = usePersistedState('pos-meta', {
    x: 0,
    y: 380,
  });
  const [storedLyricsPos, setStoredLyricsPos] = usePersistedState(
    'pos-lyrics',
    { x: 0, y: 60 },
  );
  const [storedBarPos, setStoredBarPos] = usePersistedState('pos-bar', {
    x: 0,
    y: 0,
  });
  const [showGrid, setShowGrid] = usePersistedState('show-grid', false);
  const [fontSize, setFontSize] = usePersistedState('lyrics-font-size', 4);
  const [lineHeight, setLineHeight] = usePersistedState(
    'lyrics-line-height',
    1.2,
  );
  const [lyricFontWeight, setLyricFontWeight] = usePersistedState(
    'lyrics-font-weight',
    700,
  );
  const [lyricShadow, setLyricShadow] = usePersistedState(
    'lyrics-text-shadow',
    '0 1px 3px rgba(0,0,0,0.8)',
  );
  const [lyricsColor, setLyricsColor] = usePersistedState(
    'lyrics-color',
    '#ffffff',
  );
  const [metaColor, setMetaColor] = usePersistedState('meta-color', '#ffffff');
  const [metaFontSize, setMetaFontSize] = usePersistedState(
    'meta-font-size',
    1,
  );

  const [useBlurBg, setUseBlurBg] = usePersistedState('use-blur-bg', false);
  const [blurAmount, setBlurAmount] = usePersistedState('blur-amount', 40);
  const [artScale, setArtScale] = usePersistedState('art-scale', 1);
  const [autoMeta, setAutoMeta] = usePersistedState('auto-meta', false);
  const [centerLyrics, setCenterLyrics] = usePersistedState(
    'center-lyrics',
    false,
  );
  const [fadeInDuration, setFadeInDuration] = usePersistedState(
    'fade-in-duration',
    0.5,
  );
  const [fadeOutDuration, setFadeOutDuration] = usePersistedState(
    'fade-out-duration',
    0.5,
  );
  const [displayScale, setDisplayScale] = usePersistedState('display-scale', 1);
  const [widthRatio, setWidthRatio] = usePersistedState('width-ratio', 16);
  const [heightRatio, setHeightRatio] = usePersistedState('height-ratio', 9);
  const [bgFps, setBgFps] = usePersistedState('bg-fps', 30);
  const [bgRenderScale, setBgRenderScale] = usePersistedState(
    'bg-render-scale',
    0.5,
  );
  const [bgFlowRate, setBgFlowRate] = usePersistedState('bg-flow-rate', 2);
  const [alignAnchor, setAlignAnchor] = usePersistedState<
    'top' | 'bottom' | 'center'
  >('align-anchor', 'center');
  const [enableBlur, setEnableBlur] = usePersistedState('enable-blur', true);
  const [enableScale, setEnableScale] = usePersistedState('enable-scale', true);
  const [enableSpring, setEnableSpring] = usePersistedState(
    'enable-spring',
    false,
  );
  const [enableHideLines, setPassedLines] = usePersistedState(
    'enable-hide-lines',
    false,
  );

  const [linePosXSpring, setLinePosXSpring] = usePersistedState(
    'line-posx-spring',
    { mass: 1, damping: 10, stiffness: 100 },
  );
  const [linePosYSpring, setLinePosYSpring] = usePersistedState(
    'line-posy-spring',
    { mass: 1, damping: 10, stiffness: 100 },
  );
  const [lineScaleSpring, setLineScaleSpring] = usePersistedState(
    'line-scale-spring',
    { mass: 1, damping: 10, stiffness: 100 },
  );
  const manualMetaPos = React.useRef(storedMetaPos);

  const [profiles, setProfiles] = useProfiles();
  const [showProfiles, setShowProfiles] = React.useState(false);

  const [recordSettings, setRecordSettings] =
    usePersistedState<RecordingSettings>('record-settings', {
      mimeType: 'video/webm',
      videoBitsPerSecond: 2500000,
      frameRate: 30,
      fileExtension: 'webm',
    });

  const fontOptions = useFontOptions();
  const {
    lyricFontFamily,
    lyricCjkFontFamily,
    setLyricFontFamily,
    setLyricCjkFontFamily,
  } = fontOptions;

  const { recording, start, stop } = useScreenRecorder(recordSettings);
  const [showRecordSettings, setShowRecordSettings] = React.useState(false);

  const [showRecordModal, setShowRecordModal] = React.useState(false);
  const popupWindowRef = React.useRef<Window | null>(null);

  const [playing, setPlaying] = React.useState(false);

  const audioRef = React.useRef<HTMLAudioElement>(null);
  const lyricPageRef = React.useRef<LyricDisplayPageHandle>(null);
  const [currentTime, setCurrentTime] = React.useState(0);
  const [duration, setDuration] = React.useState(0);

  const gradient = useImageGradient(albumArtUrl);

  const [openInPopup, setOpenInPopup] = React.useState(false);

  const [popupArtPos, setPopupArtPos] = React.useState<Point>(storedArtPos);
  const [popupMetaPos, setPopupMetaPos] = React.useState<Point>(storedMetaPos);

  const popupReadyResolvers = React.useRef<Array<(win: Window) => void>>([]);

  const nextPopup = (artOverride?: Point, metaOverride?: Point) => {
    setPopupArtPos(artOverride ?? storedArtPos);
    setPopupMetaPos(metaOverride ?? storedMetaPos);
    setOpenInPopup(true);
  };

  const openRecordingPopup = (): Promise<Window> => {
    return new Promise<Window>((resolve) => {
      popupReadyResolvers.current.push(resolve); // remember who to notify
      nextPopup(
        { x: artPos.x + 640, y: artPos.y },
        autoMeta ? { x: artPos.x, y: artPos.y + 450 } : undefined,
      );
      setCurrentTime(0);
    });
  };

  const resetDefaultPositions = () => {
    const container = containerRef.current;
    const defaultArt = container
      ? {
          x: container.offsetWidth * 0.05,
          y: container.offsetHeight * 0.15,
        }
      : { x: 0, y: 0 };

    const defaultMeta = { x: defaultArt.x + 183, y: defaultArt.y + 460 };

    const sideMargin = 12;
    const bottomMargin = 8;
    const defaultBar = container
      ? {
          x: sideMargin,
          y: container.offsetHeight - BAR_HEIGHT - bottomMargin,
        }
      : { x: 0, y: 0 };

    manualMetaPos.current = defaultMeta;
    setStoredArtPos(defaultArt);
    setArtPos(defaultArt);
    setStoredMetaPos(defaultMeta);
    setMetaPos(defaultMeta);
    setStoredLyricsPos({ x: 0, y: 290 });
    setLyricsPos({ x: 0, y: 290 });
    setStoredBarPos(defaultBar);
    setBarPos(defaultBar);
    setArtScale(1.5);
    setAutoMeta(true);
    setCenterLyrics(true);
  };

  const centerAudioBar = () => {
    const container = containerRef.current;
    if (!container) return;
    const barWidth = container.offsetWidth - 24;
    const x = (container.offsetWidth - barWidth) / 2;
    const pos = { x, y: barPos.y };
    setStoredBarPos(pos);
    setBarPos(pos);
  };

  const resetDefaultDisplaySettings = () => {
    setFadeInDuration(0.5);
    setFadeOutDuration(0.5);
    setShowGrid(false);
    setFontSize(4);
    setLineHeight(1.2);
    setLyricFontWeight(700);
    setLyricFontFamily('');
    setLyricCjkFontFamily('');
    setLyricShadow('0 1px 3px rgba(0,0,0,0.8)');
    setLyricsColor('#ffffff');
    setMetaColor('#ffffff');
    setMetaFontSize(1);
    setUseBlurBg(false);
    setBlurAmount(40);
    // setArtScale(1);
    // setAutoMeta(false);
    // setCenterLyrics(false);
    setDisplayScale(1);
    setBgFps(30);
    setBgRenderScale(0.5);
    setBgFlowRate(2);
    setAlignAnchor('center');
    setEnableBlur(true);
    setEnableScale(true);
    setEnableSpring(false);
    const defaultSpring = { mass: 1, damping: 10, stiffness: 100 };
    setLinePosXSpring(defaultSpring);
    setLinePosYSpring(defaultSpring);
    setLineScaleSpring(defaultSpring);
    setWidthRatio(16);
    setHeightRatio(9);
  };

  React.useEffect(() => {
    if (!settings) {
      resetDefaultPositions();
      console.log('Default positions loaded');
      return;
    }
    setStoredArtPos(settings.artPos);
    setArtPos(settings.artPos);
    setStoredMetaPos(settings.metaPos);
    setMetaPos(settings.metaPos);
    setStoredLyricsPos(settings.lyricsPos);
    setLyricsPos(settings.lyricsPos);
    setStoredBarPos(settings.barPos);
    setBarPos(settings.barPos);
    setFontSize(settings.fontSize);
    setLineHeight(settings.lineHeight);
    setLyricFontWeight(settings.fontWeight);
    setLyricFontFamily(settings.fontFamily);
    setLyricCjkFontFamily(settings.cjkFontFamily ?? '');
    setLyricShadow(settings.textShadow);
    setLyricsColor(settings.lyricsColor);
    setMetaColor(settings.metaColor);
    setMetaFontSize(settings.metaFontSize ?? 1);
    setArtScale(settings.artScale);
    setUseBlurBg(settings.useBlurBg);
    setBlurAmount(settings.blurAmount);
    setAutoMeta(settings.autoMeta);
    setDisplayScale(settings.scale);
    setBgFps(settings.bgFps);
    setBgRenderScale(settings.bgRenderScale);
    setBgFlowRate(settings.bgFlowRate);
    setAlignAnchor(settings.alignAnchor);
    setEnableBlur(settings.enableBlur);
    setEnableScale(settings.enableScale);
    setEnableSpring(settings.enableSpring);
    setPassedLines(settings.enableHideLines);
    setLinePosXSpring(settings.linePosXSpringParams);
    setLinePosYSpring(settings.linePosYSpringParams);
    setLineScaleSpring(settings.lineScaleSpringParams);
    setWidthRatio(settings.widthRatio);
    setHeightRatio(settings.heightRatio);
  }, [settings]);

  React.useEffect(() => {
    if (openInPopup && audioRef.current) {
      audioRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  }, [openInPopup]);

  const popupSettings = React.useMemo<DisplaySettings>(
    () => ({
      artPos: popupArtPos,
      metaPos: popupMetaPos,
      lyricsPos: storedLyricsPos,
      barPos: storedBarPos,
      fontSize,
      lineHeight,
      fontWeight: lyricFontWeight,
      fontFamily: lyricFontFamily,
      cjkFontFamily: lyricCjkFontFamily,
      textShadow: lyricShadow,
      lyricsColor,
      metaColor,
      metaFontSize,
      artScale,
      useBlurBg,
      blurAmount,
      autoMeta,
      scale: displayScale,
      bgFps,
      bgRenderScale,
      bgFlowRate,
      alignAnchor,
      enableBlur,
      enableScale,
      enableSpring,
      enableHideLines,
      linePosXSpringParams: linePosXSpring,
      linePosYSpringParams: linePosYSpring,
      lineScaleSpringParams: lineScaleSpring,
      widthRatio,
      heightRatio,
    }),
    [
      popupArtPos,
      popupMetaPos,
      storedLyricsPos,
      storedBarPos,
      fontSize,
      lineHeight,
      lyricFontWeight,
      lyricFontFamily,
      lyricCjkFontFamily,
      lyricShadow,
      lyricsColor,
      metaColor,
      metaFontSize,
      artScale,
      useBlurBg,
      blurAmount,
      autoMeta,
      displayScale,
      bgFps,
      bgRenderScale,
      bgFlowRate,
      alignAnchor,
      enableBlur,
      enableScale,
      enableSpring,
      enableHideLines,
      linePosXSpring,
      linePosYSpring,
      lineScaleSpring,
      widthRatio,
      heightRatio,
    ],
  );

  const autoMetaPos = React.useMemo(
    () => ({
      x: storedArtPos.x,
      y: storedArtPos.y + BASE_ART_SIZE * artScale + 10,
    }),
    [storedArtPos, artScale],
  );

  const pageSettings = React.useMemo<DisplaySettings>(
    () => ({
      artPos: storedArtPos,
      metaPos: autoMeta ? autoMetaPos : storedMetaPos,
      lyricsPos: storedLyricsPos,
      barPos: storedBarPos,
      fontSize,
      metaFontSize,
      lineHeight,
      fontWeight: lyricFontWeight,
      fontFamily: lyricFontFamily,
      cjkFontFamily: lyricCjkFontFamily,
      textShadow: lyricShadow,
      lyricsColor,
      metaColor,
      artScale,
      useBlurBg,
      blurAmount,
      autoMeta,
      scale: displayScale,
      bgFps,
      bgRenderScale,
      bgFlowRate,
      alignAnchor,
      enableBlur,
      enableScale,
      enableSpring,
      enableHideLines,
      linePosXSpringParams: linePosXSpring,
      linePosYSpringParams: linePosYSpring,
      lineScaleSpringParams: lineScaleSpring,
      widthRatio,
      heightRatio,
    }),
    [
      storedArtPos,
      storedMetaPos,
      autoMetaPos,
      storedLyricsPos,
      storedBarPos,
      fontSize,
      lineHeight,
      lyricFontWeight,
      lyricFontFamily,
      lyricCjkFontFamily,
      lyricShadow,
      lyricsColor,
      metaColor,
      metaFontSize,
      artScale,
      useBlurBg,
      blurAmount,
      autoMeta,
      displayScale,
      bgFps,
      bgRenderScale,
      bgFlowRate,
      alignAnchor,
      enableBlur,
      enableScale,
      enableSpring,
      enableHideLines,
      linePosXSpring,
      linePosYSpring,
      lineScaleSpring,
      widthRatio,
      heightRatio,
    ],
  );

  const pageSettingsJson = React.useMemo(
    () => JSON.stringify(pageSettings),
    [pageSettings],
  );
  const [lastSavedJson, setLastSavedJson] = React.useState<string | null>(
    settings ? JSON.stringify(settings) : null,
  );
  React.useEffect(() => {
    if (settings) setLastSavedJson(JSON.stringify(settings));
  }, [settings]);
  const hasSaved = lastSavedJson !== null;
  const hasUnsavedChanges = hasSaved && lastSavedJson !== pageSettingsJson;
  const saveLabel = hasSaved && hasUnsavedChanges ? 'Save Changes' : 'Save';
  const handleSave = () => {
    onSave?.(pageSettings);
    setLastSavedJson(pageSettingsJson);
  };

  React.useEffect(() => {
    const body = popupWindowRef.current?.document.body;
    if (!body) return;
    if (recording) {
      body.classList.add('hide-cursor');
    } else {
      body.classList.remove('hide-cursor');
    }
  }, [recording, openInPopup]);

  const background = React.useMemo(() => {
    if (customBg) {
      return {
        backgroundImage: `url(${customBg})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } as const;
    }
    if (useBlurBg && albumArtUrl) {
      return {
        backgroundImage: `url(${albumArtUrl})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } as const;
    }
    if (gradient) {
      return { background: gradient } as const;
    }
    return null;
  }, [customBg, useBlurBg, albumArtUrl, gradient]);

  React.useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = 1;
      const onPlay = () => setPlaying(true);
      const onPause = () => setPlaying(false);
      const el = audioRef.current;
      el.addEventListener('play', onPlay);
      el.addEventListener('pause', onPause);
      el.addEventListener('ended', onPause);
      return () => {
        el.removeEventListener('play', onPlay);
        el.removeEventListener('pause', onPause);
        el.removeEventListener('ended', onPause);
      };
    }
  }, []);

  const [artPos, artRef, setArtPos] =
    useDraggable<HTMLDivElement>(storedArtPos);
  const [metaPos, metaRef, setMetaPos] =
    useDraggable<HTMLDivElement>(storedMetaPos);
  const [lyricsPos, lyricsRef, setLyricsPos] =
    useDraggable<HTMLDivElement>(storedLyricsPos);
  const [barPos, barRef, setBarPos] =
    useDraggable<HTMLDivElement>(storedBarPos);

  // Update internal positions when stored positions change (e.g., after reset)
  React.useEffect(() => {
    if (artPos.x !== storedArtPos.x || artPos.y !== storedArtPos.y) {
      setArtPos(storedArtPos);
    }
  }, [storedArtPos]);
  React.useEffect(() => {
    if (metaPos.x !== storedMetaPos.x || metaPos.y !== storedMetaPos.y) {
      setMetaPos(storedMetaPos);
    }
  }, [storedMetaPos]);
  React.useEffect(() => {
    if (
      lyricsPos.x !== storedLyricsPos.x ||
      lyricsPos.y !== storedLyricsPos.y
    ) {
      setLyricsPos(storedLyricsPos);
    }
  }, [storedLyricsPos]);
  React.useEffect(() => {
    if (barPos.x !== storedBarPos.x || barPos.y !== storedBarPos.y) {
      setBarPos(storedBarPos);
    }
  }, [storedBarPos]);

  // Persist positions whenever they change
  React.useLayoutEffect(() => {
    if (artPos.x !== storedArtPos.x || artPos.y !== storedArtPos.y) {
      setStoredArtPos(artPos);
    }
  }, [artPos, storedArtPos]);
  React.useLayoutEffect(() => {
    if (metaPos.x !== storedMetaPos.x || metaPos.y !== storedMetaPos.y) {
      setStoredMetaPos(metaPos);
    }
  }, [metaPos, storedMetaPos]);
  React.useLayoutEffect(() => {
    if (
      lyricsPos.x !== storedLyricsPos.x ||
      lyricsPos.y !== storedLyricsPos.y
    ) {
      setStoredLyricsPos(lyricsPos);
    }
  }, [lyricsPos, storedLyricsPos]);
  React.useLayoutEffect(() => {
    if (barPos.x !== storedBarPos.x || barPos.y !== storedBarPos.y) {
      setStoredBarPos(barPos);
    }
  }, [barPos, storedBarPos]);

  React.useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    if (storedArtPos.x === 0 && storedArtPos.y === 0) {
      const x = container.offsetWidth * 0.3;
      const y = container.offsetHeight * 0.35;
      setStoredArtPos({ x, y });
      setArtPos({ x, y });
    }
    if (storedBarPos.x === 0 && storedBarPos.y === 0) {
      const sideMargin = 12;
      const bottomMargin = 8;
      const x = sideMargin;
      const y = container.offsetHeight - BAR_HEIGHT - bottomMargin;
      const pos = { x, y };
      setStoredBarPos(pos);
      setBarPos(pos);
    }
  }, []);

  // Remember manual metadata position when enabling automatic placement
  React.useEffect(() => {
    if (autoMeta) {
      manualMetaPos.current = metaPos;
    }
  }, [autoMeta]);

  // When disabling automatic metadata, restore manual position
  React.useEffect(() => {
    if (!autoMeta) {
      setMetaPos(manualMetaPos.current);
      setStoredMetaPos(manualMetaPos.current);
    }
  }, [autoMeta]);

  React.useLayoutEffect(() => {
    if (!centerLyrics) return;
    const update = () => {
      const container = containerRef.current;
      if (!container) return;
      const width = container.offsetWidth;
      const lyricsWidth = width * 0.6;
      const artWidth = BASE_ART_SIZE * artScale;
      const artRight = artPos.x + artWidth;
      const x = (width - lyricsWidth + artRight) / 2 + 16;
      if (Math.abs(x - lyricsPos.x) > 0.1) {
        const newPos = { x, y: lyricsPos.y };
        setLyricsPos(newPos);
        setStoredLyricsPos(newPos);
      }
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, [centerLyrics, artPos, artScale, lyricsPos.y]);

  const mapLines = React.useCallback(
    (ls: LrcLine[], trans: string[] = []) =>
      ls.map((l, idx) => ({
        words: [
          {
            word: l.text,
            startTime: Math.round(l.time * 1000),
            endTime: Math.round(l.end * 1000),
            obscene: false,
          },
        ],
        startTime: Math.round(l.time * 1000),
        endTime: Math.round(l.end * 1000),
        translatedLyric: trans[idx] ?? '',
        romanLyric: '',
        isBG: false,
        isDuet: false,
      })),
    [],
  );

  const amLines = React.useMemo(
    () => mapLines(lines, translation ?? []),
    [lines, translation, mapLines],
  );

  const currentProfile: Omit<PositionProfile, 'name'> = {
    artPos: storedArtPos,
    metaPos: storedMetaPos,
    lyricsPos: storedLyricsPos,
    artScale,
    fontSize,
    metaFontSize,
    lineHeight,
    fontWeight: lyricFontWeight,
    fontFamily: lyricFontFamily,
    cjkFontFamily: lyricCjkFontFamily,
    textShadow: lyricShadow,
    lyricsColor,
    autoMeta,
  };

  const combinedFontFamily = React.useMemo(() => {
    return [lyricFontFamily, lyricCjkFontFamily].filter(Boolean).join(', ');
  }, [lyricFontFamily, lyricCjkFontFamily]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      <div className="glass-panel">
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div>
            <h2 style={{ margin: 0 }}>Reposition Elements</h2>
            <div className="muted">
              Drag the preview to place album art, metadata, lyrics, and the timeline.
            </div>
          </div>
          <div className="inline-actions" style={{ justifyContent: 'flex-end' }}>
            <button onClick={() => setShowProfiles(true)}>Manage Profiles</button>
            <button className="back-button" onClick={onBack}>
              Back
            </button>
            <button onClick={handleSave}>{saveLabel}</button>
            <button className="next-button" onClick={() => onNext(pageSettings)}>
              Next: Display
            </button>
          </div>
        </div>
      </div>

      <div
        ref={containerRef}
        style={{
          position: 'relative',
          width: `min(100%, calc(80vh * ${widthRatio} / ${heightRatio}))`,
          aspectRatio: `${widthRatio} / ${heightRatio}`,
          border: '1px solid rgba(255,255,255,0.16)',
          borderRadius: 16,
          background: 'rgba(255,255,255,0.02)',
          boxShadow: '0 10px 30px rgba(0,0,0,0.35)',
          overflow: 'hidden',
          margin: '0 auto',
        }}
      >
        {background && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              ...background,
              filter: `blur(${useBlurBg ? blurAmount : 40}px)`,
              transform: 'scale(1.2)',
              zIndex: 0,
            }}
          />
        )}
        {albumArtUrl && (
          <BackgroundRender
            key={`${customBg ? 'img' : 'none'}-${useBlurBg}-${blurAmount}`}
            album={albumArtUrl}
            albumIsVideo={false}
            renderScale={bgRenderScale}
            flowSpeed={bgFlowRate}
            hasLyric
            staticMode={useBlurBg || !!customBg}
            fps={bgFps}
            renderer={EplorRenderer}
            playing={playing}
            style={{ position: 'absolute', inset: 0, zIndex: 0 }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: showGrid
              ? 'linear-gradient(#444 1px, transparent 1px), linear-gradient(90deg, #444 1px, transparent 1px)'
              : 'none',
            backgroundSize: '20px 20px',
            zIndex: 1,
            pointerEvents: 'none',
          }}
        />
        <div
          style={{
            position: 'absolute',
            inset: 0,
            zIndex: 2,
          }}
        >
          {albumArtUrl && (
            <div
              ref={artRef}
              draggable={false}
              style={{
                position: 'absolute',
                transform: `translate3d(${artPos.x}px, ${artPos.y}px, 0)`,
                cursor: 'move',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
              }}
            >
              <img
                src={albumArtUrl}
                alt="Album Art"
                draggable={false}
                style={{
                  width: BASE_ART_SIZE * artScale,
                  height: BASE_ART_SIZE * artScale,
                  objectFit: 'cover',
                  borderRadius: 8,
                  boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
                }}
              />
              {autoMeta && (
                <div
                  style={{
                    marginTop: 10,
                    color: metaColor,
                    fontSize: `${metaFontSize}rem`,
                    fontFamily: combinedFontFamily || undefined,
                    textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                    textAlign: 'center',
                    width: BASE_ART_SIZE * artScale,
                    pointerEvents: 'none',
                  }}
                >
                  <div>{songName}</div>
                  <div>
                    {artistName} - {albumName}
                  </div>
                </div>
              )}
            </div>
          )}
          {!autoMeta && (
            <div
              ref={metaRef}
              draggable={false}
              style={{
                position: 'absolute',
                transform: `translate3d(${metaPos.x}px, ${metaPos.y}px, 0)`,
                cursor: 'move',
                color: metaColor,
                fontSize: `${metaFontSize}rem`,
                fontFamily: combinedFontFamily || undefined,
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                textAlign: 'center',
              }}
            >
              <div>{songName}</div>
              <div>
                {artistName} - {albumName}
              </div>
            </div>
          )}
          <div
            ref={lyricsRef}
            className="lyrics-display"
            draggable={false}
            style={
              {
                position: 'absolute',
                transform: `translate3d(${lyricsPos.x}px, ${lyricsPos.y}px, 0)`,
                cursor: 'move',
                textAlign: 'center',
                width: '60%',
                height: '200px',
                fontSize: `${fontSize}rem`,
                lineHeight,
                fontFamily: combinedFontFamily || undefined,
                fontWeight: lyricFontWeight,
                textShadow: lyricShadow,
                '--amll-lyric-player-font-size': `${fontSize}rem`,
                '--amll-lyric-player-line-height': lineHeight.toString(),
                '--amll-lyric-player-font-weight': lyricFontWeight.toString(),
                '--amll-lyric-player-font-family': combinedFontFamily,
                '--amll-lyric-player-text-shadow': lyricShadow,
              } as React.CSSProperties
            }
          >
            <LyricPlayer
              lyricLines={amLines}
              currentTime={Math.round(currentTime * 1000)}
              playing={playing}
              alignAnchor={alignAnchor}
              alignPosition={0.22}
              enableScale={enableScale}
              enableBlur={enableBlur}
              enableSpring={enableSpring}
              hidePassedLines={enableHideLines}
              linePosXSpringParams={linePosXSpring}
              linePosYSpringParams={linePosYSpring}
              lineScaleSpringParams={lineScaleSpring}
              style={
                {
                  color: lyricsColor,
                  width: '100%',
                  height: '100%',
                  mixBlendMode: 'plus-lighter',
                  fontWeight: lyricFontWeight,
                  lineHeight,
                  fontFamily: combinedFontFamily || undefined,
                  textShadow: lyricShadow,
                  '--amll-lyric-view-color  ': lyricsColor,
                } as React.CSSProperties
              }
            />
          </div>
          <div
            ref={barRef}
            draggable={false}
            style={{
              position: 'absolute',
              transform: `translate3d(${barPos.x}px, ${barPos.y}px, 0)`,
              width: 'calc(100% - 24px)',
              height: BAR_HEIGHT,
              cursor: 'move',
            }}
          >
            <div
              onPointerDown={(e) => {
                e.stopPropagation();
                const rect = e.currentTarget.getBoundingClientRect();
                const update = (clientX: number) => {
                  const ratio = Math.min(
                    Math.max((clientX - rect.left) / rect.width, 0),
                    1,
                  );
                  const newTime = ratio * duration;
                  if (audioRef.current) {
                    audioRef.current.currentTime = newTime;
                  }
                  setCurrentTime(newTime);
                };
                update(e.clientX);
                const move = (ev: PointerEvent) => update(ev.clientX);
                const up = () => {
                  window.removeEventListener('pointermove', move);
                  window.removeEventListener('pointerup', up);
                };
                window.addEventListener('pointermove', move);
                window.addEventListener('pointerup', up);
              }}
              style={{
                position: 'relative',
                width: '100%',
                height: '100%',
                background: 'rgba(255,255,255,0.35)',
                borderRadius: 3,
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  width:
                    duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                  height: '100%',
                  background: 'rgba(255,255,255,0.9)',
                  borderRadius: 3,
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  left:
                    duration > 0 ? `${(currentTime / duration) * 100}%` : '0%',
                  top: 0,
                  width: 6,
                  height: '100%',
                  background: 'rgba(255,255,255,0.9)',
                  transform: 'translateX(-3px)',
                  zIndex: 1,
                }}
              />
            </div>
          </div>
        </div>
        {audioUrl && (
          <audio
            ref={audioRef}
            src={audioUrl ?? undefined}
            onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
            onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
            style={{ display: 'none' }}
          />
        )}
      </div>
      <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <div className="section-header" style={{ marginBottom: 0 }}>
          <div>
            <div style={{ fontWeight: 600 }}>Playback</div>
            <div className="muted">Scrub to preview and capture the final timing.</div>
          </div>
          <div className="inline-actions" style={{ justifyContent: 'flex-end' }}>
            <button
              onClick={() => {
                const audio = audioRef.current;
                if (!audio) return;
                if (playing) {
                  audio.pause();
                } else {
                  audio.play();
                }
                setPlaying(!playing);
              }}
            >
              {playing ? 'Pause' : 'Play'}
            </button>
            <button onClick={() => setShowRecordModal(true)}>Record</button>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
          }}
        >
          <span
            style={{ fontSize: '0.85rem', width: '60px', textAlign: 'right' }}
          >
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration}
            step={0.01}
            value={currentTime}
            onChange={(e) => {
              const val = parseFloat(e.target.value);
              if (audioRef.current) {
                audioRef.current.currentTime = val;
              }
              setCurrentTime(val);
            }}
            style={{ flex: 1 }}
          />
          <span style={{ fontSize: '0.85rem', width: '60px' }}>
            {formatTime(duration)}
          </span>
        </div>
      </div>

      <div className="settings-container">
        <fieldset className="settings-group">
          <legend>Layout</legend>
          <button onClick={resetDefaultPositions}>Reset Positions</button>
          <button onClick={resetDefaultDisplaySettings}>
            Reset Display Settings
          </button>
          <button onClick={() => setShowGrid((g) => !g)}>
            {showGrid ? 'Hide Grid' : 'Show Grid'}
          </button>
          <button onClick={centerAudioBar}>Center Audio</button>
        </fieldset>
        <TypographySettings
          fontSize={fontSize}
          setFontSize={setFontSize}
          lineHeight={lineHeight}
          setLineHeight={setLineHeight}
          lyricFontWeight={lyricFontWeight}
          setLyricFontWeight={setLyricFontWeight}
          lyricShadow={lyricShadow}
          setLyricShadow={setLyricShadow}
          fontOptions={fontOptions}
        />
        <fieldset className="settings-group">
          <legend>Display</legend>
          <label>
            Metadata Color
            <input
              type="color"
              value={metaColor}
              onChange={(e) => setMetaColor(e.target.value)}
              style={{ verticalAlign: 'middle' }}
            />
          </label>
          <label>
            Metadata Size
            <input
              type="number"
              min="0.1"
              max="10"
              step="0.1"
              value={metaFontSize}
              onChange={(e) => setMetaFontSize(parseFloat(e.target.value))}
              style={{
                verticalAlign: 'middle',
                width: '4rem',
              }}
            />
          </label>
          <label>
            Lyrics Color
            <input
              type="color"
              value={lyricsColor}
              onChange={(e) => setLyricsColor(e.target.value)}
              style={{ verticalAlign: 'middle' }}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={autoMeta}
              onChange={() => setAutoMeta((v) => !v)}
              style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}
            />
            Metadata under art
          </label>
          <label>
            {/* Removed manual popup button; popup can still be opened from the Record dialog */}
            {openInPopup && (
              <NewWindow
                title="Lyric Display"
                features={{
                  width: 1280 * displayScale,
                  height:
                    (1280 * (heightRatio / widthRatio) + 44) * displayScale,
                  center: 'screen',
                }}
                onOpen={(win) => {
                  popupWindowRef.current = win;
                  popupReadyResolvers.current.forEach((r) => r(win)); // fulfil all waiters
                  popupReadyResolvers.current = [];
                }}
                onUnload={() => {
                  setOpenInPopup(false);
                  popupWindowRef.current = null;
                }}
              >
                <LyricDisplayPage
                  ref={lyricPageRef}
                  lines={lines}
                  translation={translation ?? undefined}
                  albumArtUrl={albumArtUrl}
                  songName={songName}
                  artistName={artistName}
                  albumName={albumName}
                  audioUrl={audioUrl}
                  customBg={customBg}
                  onBack={() => setOpenInPopup(false)}
                  recordingMode={false}
                  showExtraControls={true}
                  audioCopy
                  fullscreenPlayButton
                  scaleAnchor="top"
                  settings={popupSettings}
                />
              </NewWindow>
            )}
            <input
              type="checkbox"
              checked={centerLyrics}
              onChange={() => setCenterLyrics((c) => !c)}
              style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}
            />
            Center lyrics after art
          </label>
          <label>
            Album Art Scale
            <input
              type="number"
              min="0.1"
              max="3"
              step="0.1"
              value={artScale}
              onChange={(e) => setArtScale(parseFloat(e.target.value))}
              style={{
                verticalAlign: 'middle',
                width: '4rem',
              }}
            />
          </label>
          <label>
            Display Scale
            <input
              type="number"
              min="0.5"
              max="4"
              step="0.1"
              value={displayScale}
              onChange={(e) => setDisplayScale(parseFloat(e.target.value))}
              style={{
                verticalAlign: 'middle',
                width: '4rem',
              }}
            />
          </label>
        </fieldset>
        <fieldset className="settings-group">
          <legend>Effects</legend>
          <label>
            BG FPS
            <input
              type="number"
              min="1"
              max="60"
              step="1"
              value={bgFps}
              onChange={(e) => setBgFps(parseInt(e.target.value, 10))}
              style={{
                verticalAlign: 'middle',
                width: '4rem',
              }}
            />
          </label>
          <label>
            BG Render Scale
            <input
              type="number"
              min="0.1"
              max="1"
              step="0.1"
              value={bgRenderScale}
              onChange={(e) => setBgRenderScale(parseFloat(e.target.value))}
              style={{
                verticalAlign: 'middle',
                width: '4rem',
              }}
            />
          </label>
          <label>
            BG Flow Rate
            <input
              type="number"
              min="0.5"
              max="4"
              step="0.1"
              value={bgFlowRate}
              onChange={(e) => setBgFlowRate(parseFloat(e.target.value))}
              style={{
                verticalAlign: 'middle',
                width: '4rem',
              }}
            />
          </label>
          <label>
            Align Anchor
            <select
              value={alignAnchor}
              onChange={(e) =>
                setAlignAnchor(e.target.value as 'top' | 'bottom' | 'center')
              }
            >
              <option value="top">Top</option>
              <option value="center">Center</option>
              <option value="bottom">Bottom</option>
            </select>
          </label>
          <label>
            <input
              type="checkbox"
              checked={enableSpring}
              onChange={() => setEnableSpring((v) => !v)}
              style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}
            />
            Enable Spring
          </label>
          <label>
            <input
              type="checkbox"
              checked={enableHideLines}
              onChange={() => setPassedLines((v) => !v)}
              style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}
            />
            Hide passed lines
          </label>
          <label>
            <input
              type="checkbox"
              checked={enableScale}
              onChange={() => setEnableScale((v) => !v)}
              style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}
            />
            Enable Scale
          </label>
          <label>
            <input
              type="checkbox"
              checked={enableBlur}
              onChange={() => setEnableBlur((v) => !v)}
              style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}
            />
            Enable Blur
          </label>
        </fieldset>
        <fieldset className="settings-group">
          <legend>Animation</legend>
          <div>
            <span>Line X Spring</span>
            <input
              type="number"
              step="0.1"
              value={linePosXSpring.mass}
              onChange={(e) =>
                setLinePosXSpring({
                  ...linePosXSpring,
                  mass: parseFloat(e.target.value),
                })
              }
              style={{ width: '3rem' }}
            />
            <input
              type="number"
              step="0.1"
              value={linePosXSpring.damping}
              onChange={(e) =>
                setLinePosXSpring({
                  ...linePosXSpring,
                  damping: parseFloat(e.target.value),
                })
              }
              style={{ width: '3rem' }}
            />
            <input
              type="number"
              step="0.1"
              value={linePosXSpring.stiffness}
              onChange={(e) =>
                setLinePosXSpring({
                  ...linePosXSpring,
                  stiffness: parseFloat(e.target.value),
                })
              }
              style={{ width: '3rem' }}
            />
          </div>
          <div>
            <span>Line Y Spring</span>
            <input
              type="number"
              step="0.1"
              value={linePosYSpring.mass}
              onChange={(e) =>
                setLinePosYSpring({
                  ...linePosYSpring,
                  mass: parseFloat(e.target.value),
                })
              }
              style={{ width: '3rem' }}
            />
            <input
              type="number"
              step="0.1"
              value={linePosYSpring.damping}
              onChange={(e) =>
                setLinePosYSpring({
                  ...linePosYSpring,
                  damping: parseFloat(e.target.value),
                })
              }
              style={{ width: '3rem' }}
            />
            <input
              type="number"
              step="0.1"
              value={linePosYSpring.stiffness}
              onChange={(e) =>
                setLinePosYSpring({
                  ...linePosYSpring,
                  stiffness: parseFloat(e.target.value),
                })
              }
              style={{ width: '3rem' }}
            />
          </div>
          <div>
            <span>Line Scale Spring</span>
            <input
              type="number"
              step="0.1"
              value={lineScaleSpring.mass}
              onChange={(e) =>
                setLineScaleSpring({
                  ...lineScaleSpring,
                  mass: parseFloat(e.target.value),
                })
              }
              style={{ width: '3rem' }}
            />
            <input
              type="number"
              step="0.1"
              value={lineScaleSpring.damping}
              onChange={(e) =>
                setLineScaleSpring({
                  ...lineScaleSpring,
                  damping: parseFloat(e.target.value),
                })
              }
              style={{ width: '3rem' }}
            />
            <input
              type="number"
              step="0.1"
              value={lineScaleSpring.stiffness}
              onChange={(e) =>
                setLineScaleSpring({
                  ...lineScaleSpring,
                  stiffness: parseFloat(e.target.value),
                })
              }
              style={{ width: '3rem' }}
            />
          </div>
          <label>
            Fade-in (s)
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={fadeInDuration}
              onChange={(e) => setFadeInDuration(parseFloat(e.target.value))}
              style={{
                verticalAlign: 'middle',
                width: '4rem',
              }}
            />
          </label>
          <label>
            Fade-out (s)
            <input
              type="number"
              min="0"
              max="5"
              step="0.1"
              value={fadeOutDuration}
              onChange={(e) => setFadeOutDuration(parseFloat(e.target.value))}
              style={{
                verticalAlign: 'middle',
                width: '4rem',
              }}
            />
          </label>
          <label>
            <input
              type="checkbox"
              checked={useBlurBg}
              onChange={() => setUseBlurBg((b) => !b)}
              style={{ verticalAlign: 'middle', marginRight: '0.25rem' }}
            />
            Use album art blur instead of color
          </label>
          {useBlurBg && (
            <label>
              Blur Level
              <input
                type="range"
                min="0"
                max="100"
                step="1"
                value={blurAmount}
                onChange={(e) => setBlurAmount(parseInt(e.target.value, 10))}
                style={{ verticalAlign: 'middle' }}
              />
            </label>
          )}
          <div style={{ display: 'inline-block' }}>
            <FileDropZone
              id="bg-upload"
              title="Custom background (optional)"
              accept="image/*"
              hint="Images only"
              onFile={async (file) =>
                onCustomBgChange(await readFileAsDataURL(file))
              }
              fileName={customBg ? 'Background selected' : null}
              icon={<DefaultFolderIcon />}
              onRemove={() => onCustomBgChange(null)}
            />
          </div>
        </fieldset>
      </div>
      <ManageProfilesModal
        visible={showProfiles}
        profiles={profiles}
        current={currentProfile}
        onSave={setProfiles}
        onLoadProfile={(p) => {
          setStoredArtPos(p.artPos);
          setArtPos(p.artPos);
          setStoredMetaPos(p.metaPos);
          setMetaPos(p.metaPos);
          setStoredLyricsPos(p.lyricsPos);
          setLyricsPos(p.lyricsPos);
          setArtScale(p.artScale);
          setFontSize(p.fontSize);
          setLineHeight(p.lineHeight);
          setLyricFontWeight(p.fontWeight);
          setLyricFontFamily(p.fontFamily);
          setLyricCjkFontFamily(p.cjkFontFamily);
          setLyricShadow(p.textShadow);
          setLyricsColor(p.lyricsColor);
          setMetaFontSize(p.metaFontSize);
          setAutoMeta(p.autoMeta);
        }}
        onClose={() => setShowProfiles(false)}
      />
      <RecordModal
        visible={showRecordModal}
        onClose={() => setShowRecordModal(false)}
        openRecordingPopup={openRecordingPopup}
        start={start}
        stop={stop}
        recording={recording}
        onOpenSettings={() => setShowRecordSettings(true)}
      />
      <RecordSettingsModal
        visible={showRecordSettings}
        settings={recordSettings}
        onSave={setRecordSettings}
        onClose={() => setShowRecordSettings(false)}
      />
    </div>
  );
};

export default RepositionPage;

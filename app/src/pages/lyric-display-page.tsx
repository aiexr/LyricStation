import React from 'react';
import type { LrcLine } from '../utils/parse-lrc';
import MediaControls from '../components/media-controls';
import {
  BackgroundRender,
  EplorRenderer,
  LyricPlayer,
} from '@applemusic-like-lyrics/react';
import useImageGradient from '../hooks/use-image-gradient';
import type { DisplaySettings } from '../types/display-settings';
import { mapLines } from '../utils/map-lines';
import useDisplaySettings from '../hooks/use-display-settings';

const BASE_ART_SIZE = 300;
const BAR_HEIGHT = 6;

interface SharedControls {
  currentTime: number;
  duration: number;
  playing: boolean;
  seek: (t: number) => void;
  togglePlay: () => void;
}

export interface LyricDisplayPageHandle {
  fadeIn: (seconds: number) => void;
  fadeOut: (seconds: number) => void;
  play: () => void;
}

interface Props {
  lines: LrcLine[];
  /** Optional translated lyric text for each line */
  translation?: string[];
  albumArtUrl: string | null;
  songName: string;
  artistName: string;
  albumName: string;
  audioUrl: string | null;
  customBg: string | null;
  onBack: () => void;
  recordingMode?: boolean;
  showExtraControls?: boolean;
  controls?: SharedControls;
  settings?: DisplaySettings;
  /**
   * When true the component creates its own copy of the provided audioUrl
   * so audio playback originates from within the component rather than
   * relying on external controls.
   */
  audioCopy?: boolean;
  /**
   * When true the play/pause button covers the entire window and is invisible.
   */
  fullscreenPlayButton?: boolean;
  /**
   * Defines where scaling is anchored from. Defaults to center.
   */
  scaleAnchor?: 'center' | 'top';
}

const LyricDisplayPage = React.forwardRef<LyricDisplayPageHandle, Props>(
  (
    {
      lines,
      translation,
      albumArtUrl,
      songName,
      artistName,
      albumName,
      audioUrl,
      customBg,
      onBack,
      recordingMode,
      showExtraControls = true,
      controls,
      settings,
      audioCopy = false,
      fullscreenPlayButton = false,
      scaleAnchor = 'center',
    },
    ref,
  ) => {
    React.useEffect(() => {
      window.scrollTo({ top: 0 });
    }, []);
    React.useEffect(() => {
      document.body.classList.add('lyrics-display-mode');
      return () => document.body.classList.remove('lyrics-display-mode');
    }, []);
    const {
      artPos,
      metaPos,
      lyricsPos,
      barPos,
      setBarPos,
      fontSize,
      lineHeight,
      fontWeight,
      combinedFontFamily,
      textShadow,
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
      linePosXSpringParams,
      linePosYSpringParams,
      lineScaleSpringParams,
      widthRatio,
      heightRatio,
    } = useDisplaySettings(settings);
    const gradient = useImageGradient(albumArtUrl);

    const effectiveMeta = autoMeta
      ? (settings?.metaPos ?? {
          // use override when autoMeta is true
          x: artPos.x,
          y: artPos.y + BASE_ART_SIZE * artScale,
        })
      : metaPos;

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

    const [localCurrentTime, setLocalCurrentTime] = React.useState(0);
    const [localDuration, setLocalDuration] = React.useState(0);
    const [localPlaying, setLocalPlaying] = React.useState(false);
    const [volume, setVolume] = React.useState(1);
    const [playbackRate, setPlaybackRate] = React.useState(1);
    const [copiedAudioUrl, setCopiedAudioUrl] = React.useState<string | null>(
      null,
    );
    const audioRef = React.useRef<HTMLAudioElement>(null);
    const containerRef = React.useRef<HTMLDivElement>(null);
    const [overlayOpacity, setOverlayOpacity] = React.useState(
      recordingMode ? 1 : 0,
    );
    const toggleUIVisibility = React.useCallback(() => {
      setOverlayOpacity((prev) => (prev === 1 ? 0 : 1));
    }, []);

    const storedFadeDuration = React.useMemo(
      () => parseFloat(localStorage.getItem('fade-in-duration') ?? '0'),
      [],
    );
    const storedFadeOutDuration = React.useMemo(
      () => parseFloat(localStorage.getItem('fade-out-duration') ?? '0'),
      [],
    );
    const [fadeOpacity, setFadeOpacity] = React.useState(
      storedFadeDuration > 0 ? 1 : 0,
    );
    const [fadeDuration, setFadeDuration] = React.useState(storedFadeDuration);
    const fadeStartedRef = React.useRef(false);

    const effectiveAudioUrl = audioCopy ? copiedAudioUrl : audioUrl;
    React.useEffect(() => {
      let canceled = false;
      if (!audioCopy || !audioUrl) {
        if (copiedAudioUrl) {
          URL.revokeObjectURL(copiedAudioUrl);
          setCopiedAudioUrl(null);
        }
        return;
      }
      fetch(audioUrl)
        .then((r) => r.blob())
        .then((blob) => {
          if (canceled) return;
          const url = URL.createObjectURL(blob);
          setCopiedAudioUrl(url);
        })
        .catch(() => {
          if (!canceled) setCopiedAudioUrl(audioUrl);
        });
      return () => {
        canceled = true;
        if (copiedAudioUrl) URL.revokeObjectURL(copiedAudioUrl);
      };
    }, [audioCopy, audioUrl]);

    const fadeIn = React.useCallback((seconds: number) => {
      fadeStartedRef.current = true;
      setFadeDuration(seconds);
      setFadeOpacity(1);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setFadeOpacity(0));
      });
    }, []);

    const fadeOut = React.useCallback((seconds: number) => {
      setFadeDuration(seconds);
      setFadeOpacity(0);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setFadeOpacity(1));
      });
    }, []);

    const play = React.useCallback(() => {
      const el = audioRef.current;
      if (!el) return;
      el.play().catch(() => {});
      setLocalPlaying(true);
    }, []);

    React.useImperativeHandle(ref, () => ({ fadeIn, fadeOut, play }), [
      fadeIn,
      fadeOut,
      play,
    ]);

    const usingControls = controls && !audioCopy;

    React.useEffect(() => {
      if (usingControls) setLocalCurrentTime(controls.currentTime);
    }, [usingControls, controls?.currentTime]);

    React.useEffect(() => {
      if (usingControls) setLocalDuration(controls.duration);
    }, [usingControls, controls?.duration]);

    React.useEffect(() => {
      if (usingControls) setLocalPlaying(controls.playing);
    }, [usingControls, controls?.playing]);

    const currentTime = usingControls ? controls.currentTime : localCurrentTime;
    const duration = usingControls ? controls.duration : localDuration;
    const playing = usingControls ? controls.playing : localPlaying;

    React.useEffect(() => {
      if (
        !fadeStartedRef.current &&
        playing &&
        (usingControls ? controls.currentTime : localCurrentTime) === 0 &&
        storedFadeDuration > 0
      ) {
        fadeIn(storedFadeDuration);
      }
    }, [
      playing,
      usingControls,
      controls,
      localCurrentTime,
      fadeIn,
      storedFadeDuration,
    ]);

    React.useEffect(() => {
      window.opener?.postMessage('recordingReady', '*');
      const audio = audioRef.current;
      const handleEnded = () => {
        setOverlayOpacity(1);
        if (storedFadeOutDuration > 0) {
          fadeOut(storedFadeOutDuration);
          setTimeout(() => {
            window.opener?.postMessage('stopRecording', '*');
          }, storedFadeOutDuration * 1000);
        } else {
          setTimeout(() => {
            window.opener?.postMessage('stopRecording', '*');
          }, 500);
        }
      };
      if (audio) audio.addEventListener('ended', handleEnded);
      return () => {
        if (audio) audio.removeEventListener('ended', handleEnded);
      };
    }, [audioRef, fadeOut, storedFadeOutDuration]);

    React.useLayoutEffect(() => {
      const container = containerRef.current;
      if (!container) return;
      if (barPos.x === 0 && barPos.y === 0) {
        const sideMargin = 12;
        const bottomMargin = 8;
        const x = sideMargin;
        const y = container.offsetHeight - BAR_HEIGHT - bottomMargin;
        setBarPos({ x, y });
      }
    }, []);

    const togglePlay = () => {
      if (usingControls) {
        controls.togglePlay();
        return;
      }
      const el = audioRef.current;
      if (!el) return;
      if (el.paused) {
        el.play();
        setLocalPlaying(true);
      } else {
        el.pause();
        setLocalPlaying(false);
      }
    };

    React.useEffect(() => {
      const handler = (e: MessageEvent) => {
        if (e.data === 'togglePlay') {
          togglePlay();
        }
      };
      window.addEventListener('message', handler);
      return () => window.removeEventListener('message', handler);
    }, [togglePlay]);

    const seek = (time: number) => {
      const clamped = Math.min(Math.max(time, 0), duration);
      if (usingControls) {
        controls.seek(clamped);
        setLocalCurrentTime(clamped);
        return;
      }
      if (audioRef.current) {
        audioRef.current.currentTime = clamped;
      }
      setLocalCurrentTime(clamped);
    };

    React.useEffect(() => {
      const handler = (e: KeyboardEvent) => {
        const target = e.target as HTMLElement;
        if (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable
        ) {
          return;
        } // Media keys
        if (e.code === 'Space' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          togglePlay();
        } else if (e.code === 'ArrowLeft') {
          e.preventDefault();
          seek(currentTime - 5);
        } else if (e.code === 'ArrowRight') {
          e.preventDefault();
          seek(currentTime + 5);
        } else if (e.code === 'KeyH') {
          e.preventDefault();
          toggleUIVisibility();
        }
      };
      window.addEventListener('keydown', handler);
      return () => window.removeEventListener('keydown', handler);
    }, [currentTime, duration, overlayOpacity, toggleUIVisibility]);

    const amLines = React.useMemo(
      () => mapLines(lines, translation ?? []),
      [lines, translation],
    );

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: scaleAnchor === 'top' ? 'flex-end' : 'center',
          justifyContent: 'center',
          zIndex: 1000,
        }}
      >
        <div
          ref={containerRef}
          style={{
            position: 'relative',
            width: showExtraControls ? '100%' : '100%',
            height: audioCopy ? '100%' : 'undefined', // the first field controls the actual height of both popup and normal display
            maxWidth: showExtraControls ? '1280px' : undefined,
            aspectRatio: showExtraControls
              ? `${widthRatio} / ${heightRatio}`
              : undefined,
            overflow: 'hidden',
            transform: `scale(${displayScale})`,
            transformOrigin: scaleAnchor === 'top' ? 'top center' : 'center',
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
              albumIsVideo={false} // properly update this if user uploads a video as the album art
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
          {albumArtUrl && (
            <img
              src={albumArtUrl}
              alt="Album Art"
              style={{
                position: 'absolute',
                transform: `translate(${artPos.x - 640}px, ${artPos.y}px)`,
                width: BASE_ART_SIZE * artScale,
                height: BASE_ART_SIZE * artScale,
                objectFit: 'cover',
                borderRadius: 8,
                boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                zIndex: 1,
              }}
            />
          )}
          {autoMeta ? (
            <div
              style={{
                position: 'absolute',
                transform: `translate(${effectiveMeta.x}px, ${effectiveMeta.y + 10}px)`,
                color: metaColor,
                fontSize: `${metaFontSize}rem`,
                fontFamily: combinedFontFamily || undefined,
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                textAlign: 'center',
                // fontSize: settings?.fontSize,
                width: BASE_ART_SIZE * artScale,
                zIndex: 1,
              }}
            >
              <div>{songName}</div>
              <div>
                {artistName} - {albumName}
              </div>
            </div>
          ) : (
            <div
              style={{
                position: 'absolute',
                transform: `translate(${metaPos.x}px, ${metaPos.y}px)`,
                color: metaColor,
                fontSize: `${metaFontSize}rem`,
                fontFamily: combinedFontFamily || undefined,
                textShadow: '0 1px 3px rgba(0,0,0,0.8)',
                textAlign: 'center',

                // fontSize: '1.2rem',
                // lineHeight: 1.2,
                zIndex: 1,
              }}
            >
              <div>{songName}</div>
              <div>
                {artistName} - {albumName}
              </div>
            </div>
          )}
          <div
            style={
              {
                position: 'absolute',
                transform: `translate(${lyricsPos.x + 2}px, ${!audioCopy ? lyricsPos.y - 960 : lyricsPos.y - 960}px)`,
                width: '60%',
                height: !audioCopy ? '2000px' : '2000px',
                fontSize: `${fontSize}rem`,
                lineHeight,
                fontFamily: combinedFontFamily || undefined,
                fontWeight,
                textShadow,
                '--amll-lyric-player-font-size': `${fontSize}rem`,
                '--amll-lyric-player-line-height': lineHeight.toString(),
                '--amll-lyric-player-font-weight': fontWeight.toString(),
                '--amll-lyric-player-font-family': combinedFontFamily,
                '--amll-lyric-player-text-shadow': textShadow,
                textAlign: 'center',
                overflow: 'hidden',
                zIndex: 1,
              } as React.CSSProperties
            }
          >
            {/* docs at: https://steve-xmh.github.io/applemusic-like-lyrics/guides/react/lyric-player/ */}

            <LyricPlayer
              lyricLines={amLines}
              currentTime={Math.round(currentTime * 1000)}
              playing={playing}
              alignAnchor={alignAnchor}
              alignPosition={0.5}
              enableScale={enableScale}
              enableBlur={enableBlur}
              enableSpring={enableSpring}
              hidePassedLines={enableHideLines}
              linePosXSpringParams={linePosXSpringParams}
              linePosYSpringParams={linePosYSpringParams}
              lineScaleSpringParams={lineScaleSpringParams}
              style={
                {
                  color: lyricsColor,
                  width: '100%',
                  height: '100%',
                  mixBlendMode: 'plus-lighter',
                  fontWeight,
                  lineHeight,
                  fontFamily: combinedFontFamily || undefined,
                  textShadow,
                  '--amll-lyric-view-color': lyricsColor,
                } as React.CSSProperties
              }
            />
          </div>
          {effectiveAudioUrl && (
            <div
              style={{
                position: 'absolute',
                transform: `translate3d(${barPos.x}px, ${!audioCopy ? barPos.y : barPos.y - displayScale}px, 0)`,
                width: 'calc(100% - 24px)',
                height: BAR_HEIGHT,
                zIndex: 2,
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
                    if (usingControls) {
                      controls.seek(newTime);
                    } else if (audioRef.current) {
                      audioRef.current.currentTime = newTime;
                    }
                    setLocalCurrentTime(newTime);
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
                      duration > 0
                        ? `${(currentTime / duration) * 100}%`
                        : '0%',
                    height: '100%',
                    background: 'rgba(255,255,255,0.9)',
                    borderRadius: 3,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    left:
                      duration > 0
                        ? `${(currentTime / duration) * 100}%`
                        : '0%',
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
          )}
        </div>
        {showExtraControls && (
          <div
            style={{
              position: 'absolute',
              top: 16,
              left: 0,
              zIndex: 1001,
              opacity: overlayOpacity,
            }}
          >
            <button onClick={onBack}>Back</button>
          </div>
        )}
        {effectiveAudioUrl && showExtraControls && (
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1001,
              opacity: overlayOpacity, // <-
            }}
          >
            <div style={{ textAlign: 'center', marginBottom: '0.25rem' }}>
              H to hide UI
            </div>
            <MediaControls
              audioUrl={effectiveAudioUrl}
              audioRef={audioRef}
              playing={playing}
              onTogglePlay={togglePlay}
              currentTime={currentTime}
              setCurrentTime={setLocalCurrentTime}
              duration={duration}
              setDuration={setLocalDuration}
              volume={volume}
              setVolume={setVolume}
              playbackRate={playbackRate}
              setPlaybackRate={setPlaybackRate}
              fullscreenPlayButton={fullscreenPlayButton}
            />
          </div>
        )}
        {recordingMode && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'black',
              opacity: overlayOpacity,
              transition: 'opacity 0.5s',
              pointerEvents: 'none',
              zIndex: 1002,
            }}
          />
        )}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'black',
            opacity: fadeOpacity,
            transition: `opacity ${fadeDuration}s linear`,
            pointerEvents: 'none',
            zIndex: 1003,
          }}
        />
      </div>
    );
  },
);

export default LyricDisplayPage;

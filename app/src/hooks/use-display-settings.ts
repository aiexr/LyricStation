import React from 'react';
import useSetting from './use-setting';
import {
  DEFAULT_SPRING,
  type DisplaySettings,
} from '../types/display-settings';

const useDisplaySettings = (settings?: DisplaySettings) => {
  const [artPos] = useSetting('pos-art', { x: 20, y: 20 }, settings?.artPos);
  const [metaPos] = useSetting(
    'pos-meta',
    { x: 200, y: 20 },
    settings?.metaPos,
  );
  const [lyricsPos] = useSetting(
    'pos-lyrics',
    { x: 20, y: 220 },
    settings?.lyricsPos,
  );
  const [barPos, setBarPos] = useSetting(
    'pos-bar',
    { x: 0, y: 0 },
    settings?.barPos,
  );
  const [fontSize] = useSetting('lyrics-font-size', 1.5, settings?.fontSize);
  const [lineHeight] = useSetting(
    'lyrics-line-height',
    1.2,
    settings?.lineHeight,
  );
  const [fontWeight] = useSetting(
    'lyrics-font-weight',
    700,
    settings?.fontWeight,
  );
  const [fontFamily] = useSetting(
    'lyrics-font-family',
    '',
    settings?.fontFamily,
  );
  const [cjkFontFamily] = useSetting(
    'lyrics-cjk-font-family',
    '',
    settings?.cjkFontFamily,
  );
  const combinedFontFamily = React.useMemo(
    () => [fontFamily, cjkFontFamily].filter(Boolean).join(', '),
    [fontFamily, cjkFontFamily],
  );
  const [textShadow] = useSetting(
    'lyrics-text-shadow',
    '0 1px 3px rgba(0,0,0,0.8)',
    settings?.textShadow,
  );
  const [lyricsColor] = useSetting(
    'lyrics-color',
    '#ffffff',
    settings?.lyricsColor,
  );
  const [metaColor] = useSetting('meta-color', '#ffffff', settings?.metaColor);
  const [metaFontSize] = useSetting(
    'meta-font-size',
    1,
    settings?.metaFontSize,
  );
  const [artScale] = useSetting('art-scale', 1, settings?.artScale);
  const [useBlurBg] = useSetting('use-blur-bg', false, settings?.useBlurBg);
  const [blurAmount] = useSetting('blur-amount', 40, settings?.blurAmount);
  const [autoMeta] = useSetting('auto-meta', false, settings?.autoMeta);
  const [displayScale] = useSetting('display-scale', 1, settings?.scale);
  const [bgFps] = useSetting('bg-fps', 30, settings?.bgFps);
  const [bgRenderScale] = useSetting(
    'bg-render-scale',
    0.5,
    settings?.bgRenderScale,
  );
  const [bgFlowRate] = useSetting('bg-flow-rate', 2, settings?.bgFlowRate);
  const [alignAnchor] = useSetting<'top' | 'bottom' | 'center'>(
    'align-anchor',
    'center',
    settings?.alignAnchor,
  );
  const [enableBlur] = useSetting('enable-blur', true, settings?.enableBlur);
  const [enableScale] = useSetting('enable-scale', true, settings?.enableScale);
  const [enableSpring] = useSetting(
    'enable-spring',
    false,
    settings?.enableSpring,
  );
  const [enableHideLines] = useSetting(
    'enable-hide-lines',
    false,
    settings?.enableHideLines,
  );
  const [linePosXSpringParams] = useSetting(
    'line-posx-spring',
    DEFAULT_SPRING,
    settings?.linePosXSpringParams,
  );
  const [linePosYSpringParams] = useSetting(
    'line-posy-spring',
    DEFAULT_SPRING,
    settings?.linePosYSpringParams,
  );
  const [lineScaleSpringParams] = useSetting(
    'line-scale-spring',
    DEFAULT_SPRING,
    settings?.lineScaleSpringParams,
  );
  const [widthRatio] = useSetting('width-ratio', 16, settings?.widthRatio);
  const [heightRatio] = useSetting('height-ratio', 9, settings?.heightRatio);

  return {
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
  } as const;
};

export default useDisplaySettings;

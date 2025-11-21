export type SimpleSpring = { mass: number; damping: number; stiffness: number };

export const DEFAULT_SPRING: SimpleSpring = {
  mass: 1,
  damping: 10,
  stiffness: 100,
};

export interface DisplaySettings {
  artPos: { x: number; y: number };
  metaPos: { x: number; y: number };
  lyricsPos: { x: number; y: number };
  barPos: { x: number; y: number };
  fontSize: number;
  lineHeight: number;
  fontWeight: number;
  fontFamily: string;
  cjkFontFamily: string;
  textShadow: string;
  lyricsColor: string;
  metaColor: string;
  metaFontSize: number;
  artScale: number;
  useBlurBg: boolean;
  blurAmount: number;
  autoMeta: boolean;
  scale: number;
  bgFps: number;
  bgRenderScale: number;
  bgFlowRate: number;
  alignAnchor: 'top' | 'bottom' | 'center';
  enableBlur: boolean;
  enableScale: boolean;
  enableSpring: boolean;
  enableHideLines: boolean;
  linePosXSpringParams: SimpleSpring;
  linePosYSpringParams: SimpleSpring;
  lineScaleSpringParams: SimpleSpring;
  widthRatio: number;
  heightRatio: number;
}

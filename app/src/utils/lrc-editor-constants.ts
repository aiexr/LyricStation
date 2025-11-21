import {
  DEFAULT_DISPLAY_PREFS,
  type DisplayPrefs,
} from '../settings/editor-display-settings';

export const CANVAS_HEIGHT = 160;
export const BASE_RESOLUTION = 100;
export const DEFAULT_BLOCK_HEIGHT = 32; // ⬆ slightly larger for readability
export const SNAP_THRESHOLD_SEC = 0.1; // approx 1 frame at 10 fps

// Extended ranges for zoom and sensitivity
export const MIN_ZOOM = 10;
export const MAX_ZOOM = 500;
export const MIN_SENSITIVITY = 0.1;
export const MAX_SENSITIVITY = 10;

export const DEFAULT_PREFS: DisplayPrefs = {
  ...DEFAULT_DISPLAY_PREFS,
  blockHeight: DEFAULT_BLOCK_HEIGHT,
};

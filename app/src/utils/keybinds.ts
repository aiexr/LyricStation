export interface KeybindConfig {
  jumpToPlayhead: string;
  setStart: string;
  setEnd: string;
  newBlock: string;
  addAfter: string;
  deleteBlock: string;
  removeGapsRight: string;
  removeGapsLeft: string;
}

export const defaultKeybinds: KeybindConfig = {
  jumpToPlayhead: 'W',
  setStart: 'A',
  setEnd: 'D',
  newBlock: 'E',
  addAfter: 'S',
  deleteBlock: 'G',
  removeGapsRight: 'Q',
  removeGapsLeft: 'F',
};

const COOKIE_NAME = 'keybinds';

export function loadKeybinds(): KeybindConfig {
  const cookie = document.cookie
    .split('; ')
    .find((row) => row.startsWith(`${COOKIE_NAME}=`));
  if (cookie) {
    try {
      const data = JSON.parse(decodeURIComponent(cookie.split('=')[1]));
      return { ...defaultKeybinds, ...data } as KeybindConfig;
    } catch {
      // ignore parse errors
    }
  }
  return { ...defaultKeybinds };
}

export function saveKeybinds(cfg: KeybindConfig): void {
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(
    JSON.stringify(cfg),
  )}; path=/; max-age=31536000`;
}

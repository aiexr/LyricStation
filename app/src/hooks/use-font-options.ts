import React from 'react';
import usePersistedState from './use-persisted-state';
import useIndexedDbState from './use-indexed-db-state';
import { readFileAsDataURL } from '../utils/file-utils';
import { registerCustomFont } from '../utils/font-utils';

export const WEB_SAFE_FONTS = [
  'Roboto',
  'Open Sans',
  'Lato',
  'Fira Sans',
  'Source Sans Pro',
  'Noto Sans',
  'Fira Code',
  'Inter',
] as const;

export const CJK_FONTS = [
  'Noto Sans JP',
  'Noto Serif JP',
  'Noto Sans SC',
  'Noto Sans TC',
  'ZCOOL XiaoWei',
  'ZCOOL KuaiLe',
] as const;

const GOOGLE_FONT_URLS: Record<(typeof WEB_SAFE_FONTS)[number], string> = {
  Roboto:
    'https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap',
  'Open Sans':
    'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;700&display=swap',
  Lato: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap',
  'Fira Sans':
    'https://fonts.googleapis.com/css2?family=Fira+Sans:wght@400;700&display=swap',
  'Source Sans Pro':
    'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:wght@400;700&display=swap',
  'Noto Sans':
    'https://fonts.googleapis.com/css2?family=Noto+Sans:wght@400;700&display=swap',
  'Fira Code':
    'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;700&display=swap',
  Inter:
    'https://fonts.googleapis.com/css2?family=Inter:wght@400;700&display=swap',
};

const GOOGLE_CJK_FONT_URLS: Record<(typeof CJK_FONTS)[number], string> = {
  'Noto Sans JP':
    'https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;700&display=swap',
  'Noto Serif JP':
    'https://fonts.googleapis.com/css2?family=Noto+Serif+JP:wght@400;700&display=swap',
  'Noto Sans SC':
    'https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;700&display=swap',
  'Noto Sans TC':
    'https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;700&display=swap',
  'ZCOOL XiaoWei':
    'https://fonts.googleapis.com/css2?family=ZCOOL+XiaoWei&display=swap',
  'ZCOOL KuaiLe':
    'https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&display=swap',
};

export default function useFontOptions() {
  const [lyricFontFamily, setLyricFontFamily] = usePersistedState(
    'lyrics-font-family',
    '',
  );
  const [lyricCjkFontFamily, setLyricCjkFontFamily] = usePersistedState(
    'lyrics-cjk-font-family',
    '',
  );

  const [customFonts, setCustomFonts] = useIndexedDbState<
    Record<string, string>
  >('custom-fonts', {});
  const [customCjkFonts, setCustomCjkFonts] = useIndexedDbState<
    Record<string, string>
  >('custom-cjk-fonts', {});

  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const cjkFileInputRef = React.useRef<HTMLInputElement>(null);

  const loadWebFont = React.useCallback(
    (font: (typeof WEB_SAFE_FONTS)[number]) => {
      const url = GOOGLE_FONT_URLS[font];
      const id = `font-link-${font.replace(/\s+/g, '-')}`;
      if (!url || document.getElementById(id)) return;
      const link = document.createElement('link');
      link.id = id;
      link.rel = 'stylesheet';
      link.href = url;
      document.head.appendChild(link);
    },
    [],
  );

  const loadCjkFont = React.useCallback((font: (typeof CJK_FONTS)[number]) => {
    const url = GOOGLE_CJK_FONT_URLS[font];
    const id = `font-link-${font.replace(/\s+/g, '-')}`;
    if (!url || document.getElementById(id)) return;
    const link = document.createElement('link');
    link.id = id;
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);
  }, []);

  const handleCustomFontUpload = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dataUrl = await readFileAsDataURL(file);
      const fontName = file.name.replace(/\.(ttf|otf|woff2?|woff)$/i, '');
      registerCustomFont(fontName, dataUrl);
      setCustomFonts((prev) => ({ ...prev, [fontName]: dataUrl }));
      setLyricFontFamily(fontName);
    },
    [setCustomFonts, setLyricFontFamily],
  );

  const handleCustomCjkFontUpload = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dataUrl = await readFileAsDataURL(file);
      const fontName = file.name.replace(/\.(ttf|otf|woff2?|woff)$/i, '');
      registerCustomFont(fontName, dataUrl);
      setCustomCjkFonts((prev) => ({ ...prev, [fontName]: dataUrl }));
      setLyricCjkFontFamily(fontName);
    },
    [setCustomCjkFonts, setLyricCjkFontFamily],
  );

  React.useEffect(() => {
    if (!lyricFontFamily) return;
    if ((WEB_SAFE_FONTS as readonly string[]).includes(lyricFontFamily)) {
      loadWebFont(lyricFontFamily as (typeof WEB_SAFE_FONTS)[number]);
    }
  }, [lyricFontFamily, loadWebFont]);

  React.useEffect(() => {
    Object.entries(customFonts).forEach(([name, url]) => {
      registerCustomFont(name, url);
    });
  }, [customFonts]);

  React.useEffect(() => {
    if (!lyricCjkFontFamily) return;
    if ((CJK_FONTS as readonly string[]).includes(lyricCjkFontFamily)) {
      loadCjkFont(lyricCjkFontFamily as (typeof CJK_FONTS)[number]);
    }
  }, [lyricCjkFontFamily, loadCjkFont]);

  React.useEffect(() => {
    Object.entries(customCjkFonts).forEach(([name, url]) => {
      registerCustomFont(name, url);
    });
  }, [customCjkFonts]);

  return {
    lyricFontFamily,
    setLyricFontFamily,
    lyricCjkFontFamily,
    setLyricCjkFontFamily,
    customFonts,
    customCjkFonts,
    fileInputRef,
    cjkFileInputRef,
    handleCustomFontUpload,
    handleCustomCjkFontUpload,
  };
}

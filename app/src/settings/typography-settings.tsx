import React from 'react';
import useFontOptions, {
  WEB_SAFE_FONTS,
  CJK_FONTS,
} from '../hooks/use-font-options';

interface Props {
  fontSize: number;
  setFontSize: (v: number) => void;
  lineHeight: number;
  setLineHeight: (v: number) => void;
  lyricFontWeight: number;
  setLyricFontWeight: (v: number) => void;
  lyricShadow: string;
  setLyricShadow: (v: string) => void;
  fontOptions: ReturnType<typeof useFontOptions>;
}

const TypographySettings: React.FC<Props> = ({
  fontSize,
  setFontSize,
  lineHeight,
  setLineHeight,
  lyricFontWeight,
  setLyricFontWeight,
  lyricShadow,
  setLyricShadow,
  fontOptions,
}) => {
  const {
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
  } = fontOptions;

  return (
    <fieldset className="settings-group">
      <legend>Typography</legend>
      <label>
        Font Size
        <input
          type="number"
          min="0.1"
          max="200"
          step="0.1"
          value={fontSize}
          onChange={(e) => setFontSize(parseFloat(e.target.value))}
          style={{ verticalAlign: 'middle', width: '4rem' }}
        />
      </label>
      <label>
        Line Height
        <input
          type="number"
          min="0.1"
          max="200"
          step="0.1"
          value={lineHeight}
          onChange={(e) => setLineHeight(parseFloat(e.target.value))}
          style={{ verticalAlign: 'middle', width: '4rem' }}
        />
      </label>
      <label>
        Font Weight
        <input
          type="number"
          min="100"
          max="900"
          step="100"
          value={lyricFontWeight}
          onChange={(e) => setLyricFontWeight(parseInt(e.target.value, 10))}
          style={{ verticalAlign: 'middle', width: '4rem' }}
        />
      </label>
      <label>
        Font Family
        <select
          value={lyricFontFamily}
          onChange={(e) => {
            if (e.target.value === '__custom__') {
              fileInputRef.current?.click();
            } else {
              setLyricFontFamily(e.target.value);
            }
          }}
          style={{ verticalAlign: 'middle', width: '10rem' }}
        >
          {Object.keys(customFonts).map((name) => (
            <option key={`custom-${name}`} value={name}>
              {name}
            </option>
          ))}
          {!(WEB_SAFE_FONTS as readonly string[]).includes(lyricFontFamily) &&
            lyricFontFamily &&
            !customFonts[lyricFontFamily] && (
              <option value={lyricFontFamily}>{lyricFontFamily}</option>
            )}
          {WEB_SAFE_FONTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
          <option value="__custom__">Upload custom…</option>
        </select>
        <input
          ref={fileInputRef}
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          style={{ display: 'none' }}
          onChange={handleCustomFontUpload}
        />
      </label>
      <label>
        CJK Font
        <select
          value={lyricCjkFontFamily}
          onChange={(e) => {
            if (e.target.value === '__custom__') {
              cjkFileInputRef.current?.click();
            } else {
              setLyricCjkFontFamily(e.target.value);
            }
          }}
          style={{ verticalAlign: 'middle', width: '10rem' }}
        >
          <option value="">(none)</option>
          {Object.keys(customCjkFonts).map((name) => (
            <option key={`custom-cjk-${name}`} value={name}>
              {name}
            </option>
          ))}
          {!(CJK_FONTS as readonly string[]).includes(lyricCjkFontFamily) &&
            lyricCjkFontFamily &&
            !customCjkFonts[lyricCjkFontFamily] && (
              <option value={lyricCjkFontFamily}>{lyricCjkFontFamily}</option>
            )}
          {CJK_FONTS.map((f) => (
            <option key={f} value={f}>
              {f}
            </option>
          ))}
          <option value="__custom__">Upload custom…</option>
        </select>
        <input
          ref={cjkFileInputRef}
          type="file"
          accept=".ttf,.otf,.woff,.woff2"
          style={{ display: 'none' }}
          onChange={handleCustomCjkFontUpload}
        />
      </label>
      <label>
        Text Shadow
        <input
          type="text"
          value={lyricShadow}
          onChange={(e) => setLyricShadow(e.target.value)}
          style={{ verticalAlign: 'middle', width: '8rem' }}
        />
      </label>
    </fieldset>
  );
};

export default TypographySettings;

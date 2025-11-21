import React from 'react';
import useIndexedDbState from '../hooks/use-indexed-db-state';
import { readFileAsDataURL } from '../utils/file-utils';
import { registerCustomFont, unregisterCustomFont } from '../utils/font-utils';
import type { ProjectSnapshot } from '../hooks/use-library';

interface Props {
  projects: ProjectSnapshot[];
  onLoad: (p: ProjectSnapshot) => void;
  onQuickView: (p: ProjectSnapshot) => void;
  onDelete: (name: string) => void;
  onBack: () => void;
}

const LibraryPage: React.FC<Props> = ({
  projects,
  onLoad,
  onQuickView,
  onDelete,
  onBack,
}) => {
  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
  const [customFonts, setCustomFonts] = useIndexedDbState<
    Record<string, string>
  >('custom-fonts', {});
  const [customCjkFonts, setCustomCjkFonts] = useIndexedDbState<
    Record<string, string>
  >('custom-cjk-fonts', {});
  const fontInputRef = React.useRef<HTMLInputElement>(null);
  const cjkFontInputRef = React.useRef<HTMLInputElement>(null);

  const handleFontUpload = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dataUrl = await readFileAsDataURL(file);
      const fontName = file.name.replace(/\.(ttf|otf|woff2?|woff)$/i, '');
      registerCustomFont(fontName, dataUrl);
      setCustomFonts((prev) => ({ ...prev, [fontName]: dataUrl }));
    },
    [setCustomFonts, registerCustomFont],
  );

  const handleCjkFontUpload = React.useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const dataUrl = await readFileAsDataURL(file);
      const fontName = file.name.replace(/\.(ttf|otf|woff2?|woff)$/i, '');
      registerCustomFont(fontName, dataUrl);
      setCustomCjkFonts((prev) => ({ ...prev, [fontName]: dataUrl }));
    },
    [setCustomCjkFonts, registerCustomFont],
  );

  const handleFontDelete = React.useCallback(
    (name: string) => {
      setCustomFonts((prev) => {
        if (!prev[name]) return prev;
        const rest = { ...prev };
        delete rest[name];
        return rest;
      });
      setCustomCjkFonts((prev) => {
        if (!prev[name]) return prev;
        const rest = { ...prev };
        delete rest[name];
        return rest;
      });
      unregisterCustomFont(name);
    },
    [setCustomFonts, setCustomCjkFonts, unregisterCustomFont],
  );

  const fontNames = React.useMemo(
    () =>
      Array.from(
        new Set([...Object.keys(customFonts), ...Object.keys(customCjkFonts)]),
      ).sort(),
    [customFonts, customCjkFonts],
  );

  const storageUsed = React.useMemo(() => {
    const libraryBytes = new Blob([JSON.stringify(projects)]).size;
    let localBytes = 0;
    for (let i = 0; i < localStorage.length; i += 1) {
      const key = localStorage.key(i);
      if (!key) continue;
      const value = localStorage.getItem(key) ?? '';
      localBytes += new Blob([key]).size + new Blob([value]).size;
    }
    const totalBytes = libraryBytes + localBytes;
    const mb = (totalBytes / (1024 * 1024)).toFixed(2);
    const kb = Math.round(totalBytes / 1024);
    return `${mb} MB (${kb} KB)`;
  }, [projects]);

  return (
    <div style={{ textAlign: 'left' }}>
      <div className="section-header">
        <div>
          <h2 style={{ margin: '0 0 0.25rem' }}>Project Library</h2>
          <div className="muted">Storage Used: {storageUsed}</div>
        </div>
        <button className="back-button" onClick={onBack}>
          Back to editor
        </button>
      </div>

      <div className="card-grid">
        <div className="glass-panel">
          <div className="section-header">
            <div>
              <h3 style={{ margin: 0 }}>Projects</h3>
              <div className="muted">
                {projects.length === 0
                  ? 'No saved projects yet'
                  : `${projects.length} saved project${
                      projects.length === 1 ? '' : 's'
                    }`}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {projects.map((p) => (
              <div key={p.name} className="list-tile">
                <div>
                  <div style={{ fontWeight: 600 }}>{p.name}</div>
                  <div className="muted" style={{ fontSize: '0.85rem' }}>
                    Quick preview or re-open later
                  </div>
                </div>
                <div className="inline-actions">
                  <button onClick={() => onQuickView(p)}>Quick View</button>
                  <button onClick={() => onLoad(p)}>Load</button>
                  <button onClick={() => onDelete(p.name)}>Delete</button>
                </div>
              </div>
            ))}
            {projects.length === 0 && (
              <div className="list-tile" style={{ justifyContent: 'center' }}>
                <span className="muted">Save a project from the editor to see it here.</span>
              </div>
            )}
          </div>
        </div>

        <div className="glass-panel">
          <div className="section-header">
            <div>
              <h3 style={{ margin: 0 }}>Uploaded Fonts</h3>
              <div className="muted">Attach custom lettering for lyrics and metadata.</div>
            </div>
            <div className="inline-actions">
              <button onClick={() => fontInputRef.current?.click()}>Add Font</button>
              <button onClick={() => cjkFontInputRef.current?.click()}>
                Add CJK Font
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {fontNames.map((name) => (
              <div key={name} className="list-tile">
                <div style={{ fontWeight: 600 }}>{name}</div>
                <div className="inline-actions">
                  <button onClick={() => handleFontDelete(name)}>Delete</button>
                </div>
              </div>
            ))}
            {fontNames.length === 0 && (
              <div className="list-tile" style={{ justifyContent: 'center' }}>
                <span className="muted">No fonts uploaded yet.</span>
              </div>
            )}
          </div>
          <input
            ref={fontInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            onChange={handleFontUpload}
            style={{ display: 'none' }}
          />
          <input
            ref={cjkFontInputRef}
            type="file"
            accept=".ttf,.otf,.woff,.woff2"
            onChange={handleCjkFontUpload}
            style={{ display: 'none' }}
          />
        </div>
      </div>
    </div>
  );
};

export default LibraryPage;

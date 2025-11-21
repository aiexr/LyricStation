import React from 'react';
import type { Point } from '../hooks/use-draggable';

export interface PositionProfile {
  name: string;
  artPos: Point;
  metaPos: Point;
  lyricsPos: Point;
  artScale: number;
  fontSize: number;
  metaFontSize: number;
  lineHeight: number;
  fontWeight: number;
  fontFamily: string;
  cjkFontFamily: string;
  textShadow: string;
  lyricsColor: string;
  autoMeta: boolean;
}

interface Props {
  visible: boolean;
  profiles: PositionProfile[];
  onSave: (profiles: PositionProfile[]) => void;
  onLoadProfile: (p: PositionProfile) => void;
  onClose: () => void;
  current: Omit<PositionProfile, 'name'>;
}

const ManageProfilesModal: React.FC<Props> = ({
  visible,
  profiles,
  onSave,
  onLoadProfile,
  onClose,
  current,
}) => {
  const [name, setName] = React.useState('');
  const [importText, setImportText] = React.useState('');

  if (!visible) return null;

  const saveProfile = () => {
    if (!name.trim()) return;
    const profile: PositionProfile = { ...current, name: name.trim() };
    const updated = profiles.filter((p) => p.name !== profile.name);
    updated.push(profile);
    onSave(updated);
    setName('');
  };

  const deleteProfile = (n: string) => {
    onSave(profiles.filter((p) => p.name !== n));
  };

  const exportProfiles = () => {
    setImportText(JSON.stringify(profiles, null, 2));
  };

  const importProfiles = () => {
    try {
      const data = JSON.parse(importText);
      if (Array.isArray(data)) {
        onSave(data as PositionProfile[]);
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="modal-overlay">
      <div
        className="modal"
        style={{ width: '100%', maxWidth: 420, maxHeight: '90vh', overflowY: 'auto' }}
      >
        <h3 style={{ marginTop: 0 }}>Manage Profiles</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
          {profiles.map((p) => (
            <div key={p.name} className="list-tile">
              <div style={{ fontWeight: 600 }}>{p.name}</div>
              <div className="inline-actions">
                <button onClick={() => onLoadProfile(p)}>Load</button>
                <button onClick={() => deleteProfile(p.name)}>Delete</button>
              </div>
            </div>
          ))}
          {profiles.length === 0 && (
            <div className="list-tile" style={{ justifyContent: 'center' }}>
              <span className="muted">Save a layout to reuse it later.</span>
            </div>
          )}
        </div>
        <div style={{ marginTop: '0.75rem' }}>
          <label style={{ display: 'block', marginBottom: '0.35rem' }}>
            <span style={{ display: 'block', marginBottom: '0.25rem' }}>Save current as</span>
            <div className="inline-actions">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Profile name"
                style={{ flex: 1, minWidth: 0 }}
              />
              <button onClick={saveProfile}>Save</button>
            </div>
          </label>
        </div>
        <div className="inline-actions" style={{ marginTop: '0.5rem' }}>
          <button onClick={exportProfiles}>JSON (All)</button>
          <button onClick={importProfiles}>Overwrite/Import</button>
        </div>
        <textarea
          value={importText}
          onChange={(e) => setImportText(e.target.value)}
          placeholder="Profile JSON"
          style={{
            width: '100%',
            height: '90px',
            marginTop: '0.5rem',
            background: '#111827',
            color: '#f9fafb',
            border: '1px solid #4b5563',
          }}
        />
        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default ManageProfilesModal;

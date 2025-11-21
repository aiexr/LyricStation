import React from 'react';
import type { RecordingSettings } from '../hooks/use-screen-recorder';

interface Props {
  visible: boolean;
  settings: RecordingSettings;
  onSave: (s: RecordingSettings) => void;
  onClose: () => void;
}

const RecordSettingsModal: React.FC<Props> = ({
  visible,
  settings,
  onSave,
  onClose,
}) => {
  const [local, setLocal] = React.useState(settings);

  React.useEffect(() => {
    if (visible) setLocal(settings);
  }, [visible, settings]);

  const update = (partial: Partial<RecordingSettings>) => {
    setLocal({ ...local, ...partial });
  };

  const mp4Mime = 'video/mp4;codecs=avc1.42E01E,mp4a.40.2';
  const mp4Supported = React.useMemo(
    () => MediaRecorder.isTypeSupported(mp4Mime),
    [],
  );

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div className="modal" style={{ width: '100%', maxWidth: 420 }}>
        <h3 style={{ marginTop: 0 }}>Recording Settings</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
          <label className="list-tile" style={{ alignItems: 'center' }}>
            <span style={{ flex: 1 }}>Frame Rate</span>
            <input
              type="number"
              min={1}
              max={60}
              value={local.frameRate}
              onChange={(e) =>
                update({ frameRate: parseInt(e.target.value, 10) })
              }
              style={{ width: '5rem' }}
            />
          </label>
          <label className="list-tile" style={{ alignItems: 'center' }}>
            <span style={{ flex: 1 }}>Bitrate (Mbps)</span>
            <input
              type="number"
              min={1}
              value={Math.round(local.videoBitsPerSecond / 1000000)}
              onChange={(e) =>
                update({
                  videoBitsPerSecond: parseInt(e.target.value, 10) * 1000000,
                })
              }
              style={{ width: '5rem' }}
            />
          </label>
          <label className="list-tile" style={{ alignItems: 'center' }}>
            <span style={{ flex: 1 }}>Format</span>
            <select
              value={local.fileExtension}
              onChange={(e) => {
                const ext = e.target.value;
                if (ext === 'mp4') {
                  update({ fileExtension: 'mp4', mimeType: mp4Mime });
                } else {
                  update({ fileExtension: 'webm', mimeType: 'video/webm' });
                }
              }}
              style={{ minWidth: '6rem' }}
            >
              <option value="webm">WebM</option>
              {mp4Supported && <option value="mp4">MP4</option>}
            </select>
          </label>
        </div>
        <div className="modal-actions">
          <button onClick={onClose}>Cancel</button>
          <button
            onClick={() => {
              onSave(local);
              onClose();
            }}
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

export default RecordSettingsModal;

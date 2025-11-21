import React from 'react';

interface Props {
  visible: boolean;
  onClose: () => void;
  openRecordingPopup: () => Promise<Window | null>;
  start: (onStarted?: () => void) => Promise<void>;
  stop: () => void;
  recording: boolean;
  onOpenSettings: () => void;
}

const RecordModal: React.FC<Props> = ({
  visible,
  onClose,
  openRecordingPopup,
  start,
  stop,
  recording,
  onOpenSettings,
}) => {
  const popupRef = React.useRef<Window | null>(null);
  const readyRef = React.useRef(false);

  React.useEffect(() => {
    const handler = (e: MessageEvent) => {
      if (e.data === 'stopRecording') {
        stop();
        popupRef.current?.close();
        onClose();
      } else if (e.data === 'recordingReady') {
        readyRef.current = true;
      }
    };
    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [stop, onClose]);

  const openPopup = async () => {
    const win = await openRecordingPopup(); // wait until window exists
    popupRef.current = win; // store the actual Window
  };

  const startRecording = async () => {
    await start(() => {
      const focusPopup = () => {
        if (readyRef.current) {
          popupRef.current?.focus();
        } else {
          setTimeout(focusPopup, 50);
          console.log(recording); //dont remove this line lol
        }
      };
      focusPopup();
    });
  };

  if (!visible) return null;

  return (
    <div className="modal-overlay">
      <div
        className="modal"
        style={{ width: '100%', maxWidth: 620, position: 'relative' }}
      >
        <button
          onClick={onOpenSettings}
          style={{
            position: 'absolute',
            top: '0.5rem',
            right: '0.5rem',
            padding: '0.4rem 0.8rem',
          }}
        >
          Recording Settings
        </button>
        <h3 style={{ marginTop: 0 }}>Record</h3>
        <p style={{ marginBottom: '0.5rem' }}>
          Open a popup window to stage the lyric display.
        </p>
        <div className="inline-actions" style={{ marginBottom: '0.5rem' }}>
          <button onClick={openPopup}>Open Popup</button>
          <button onClick={startRecording}>Start Recording</button>
        </div>
        <p style={{ marginBottom: '0.5rem' }}>
          Click anywhere inside the window to begin playback. Recording will stop when playback ends.
        </p>
        <div className="modal-actions">
          <button onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default RecordModal;

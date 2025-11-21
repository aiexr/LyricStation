import React, { useState } from 'react';
import FileDropZone from './file-drop-zone';
import { readFileAsDataURL } from '../utils/file-utils';

interface Props {
  onBack: () => void;
  onNext: (data: {
    albumArtUrl: string | null;
    songName: string;
    artistName: string;
    albumName: string;
  }) => void;
  initialAlbumArtUrl?: string | null;
  /** Optional initial file name for the uploaded album art */
  initialAlbumArtFileName?: string | null;
  /**
   * Callback when the album art file name changes. Used so the parent can
   * persist the uploaded state when navigating away and back to this page.
   */
  onAlbumArtFileNameChange?: (name: string | null) => void;
  initialSongName?: string;
  initialArtistName?: string;
  initialAlbumName?: string;
}

const MetadataForm: React.FC<Props> = ({
  onBack,
  onNext,
  initialAlbumArtUrl = null,
  initialAlbumArtFileName = null,
  onAlbumArtFileNameChange,
  initialSongName = '',
  initialArtistName = '',
  initialAlbumName = '',
}) => {
  React.useEffect(() => {
    window.scrollTo({ top: 0 });
  }, []);
  const [albumArtUrl, setAlbumArtUrl] = useState<string | null>(
    initialAlbumArtUrl,
  );
  const [albumArtFileName, setAlbumArtFileName] = useState<string | null>(
    initialAlbumArtFileName,
  );
  const [songName, setSongName] = useState(initialSongName);
  const [artistName, setArtistName] = useState(initialArtistName);
  const [albumName, setAlbumName] = useState(initialAlbumName);

  const handleAlbumArt = async (file: File) => {
    setAlbumArtUrl(await readFileAsDataURL(file));
    setAlbumArtFileName(file.name);
    onAlbumArtFileNameChange?.(file.name);
  };

  const removeAlbumArt = () => {
    setAlbumArtUrl(null);
    setAlbumArtFileName(null);
    onAlbumArtFileNameChange?.(null);
  };

  return (
    <div className="metadata-form">
      <div className="navigation-row">
        <button className="back-button" onClick={onBack}>
          Back to Lyrics
        </button>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="next-button"
            onClick={() =>
              onNext({ albumArtUrl, songName, artistName, albumName })
            }
          >
            Next: Reposition
          </button>
        </div>
      </div>
      <h2>Album Art &amp; Metadata</h2>
      <div className="metadata-upload">
        <FileDropZone
          id="album-art-upload"
          title="Upload album art"
          accept=".jpg,.jpeg,.png"
          hint="Supports: .jpg, .jpeg, .png"
          onFile={handleAlbumArt}
          fileName={albumArtFileName}
          onRemove={removeAlbumArt}
        />
        {albumArtUrl && (
          <div className="metadata-preview">
            <img src={albumArtUrl} alt="Album Art Preview" />
          </div>
        )}
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        className="metadata-fields"
      >
        <label>
          Song Name:
          <input
            type="text"
            value={songName}
            onChange={(e) => setSongName(e.target.value)}
          />
        </label>
        <label>
          Artist:
          <input
            type="text"
            value={artistName}
            onChange={(e) => setArtistName(e.target.value)}
          />
        </label>
        <label>
          Album:
          <input
            type="text"
            value={albumName}
            onChange={(e) => setAlbumName(e.target.value)}
          />
        </label>
      </form>
    </div>
  );
};

export default MetadataForm;

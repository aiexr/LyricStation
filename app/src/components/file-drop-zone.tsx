import React, { useRef, useState } from 'react';

interface FileDropZoneProps {
  id: string;
  title: string;
  accept: string;
  hint: string;
  onFile: (file: File) => void;
  icon?: React.ReactNode;
  /**
   * Optional externally controlled file name to display. When provided,
   * the component will ignore its internal state for the file name.
   */
  fileName?: string | null;
  /** Optional callback to remove the currently selected file */
  onRemove?: () => void;
}

const FileDropZone: React.FC<FileDropZoneProps> = ({
  id,
  title,
  accept,
  hint,
  onFile,
  icon,
  fileName: controlledFileName,
  onRemove,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [internalFileName, setInternalFileName] = useState<string | null>(null);

  const fileName = controlledFileName ?? internalFileName;

  const handleFiles = (files: FileList | null) => {
    const file = files?.[0];
    if (file) {
      onFile(file);
      if (controlledFileName === undefined) {
        setInternalFileName(file.name);
      }
    }
  };

  return (
    <div className="zone-wrapper">
      <div className="zone-title">{title}</div>
      <label
        className={`drop-zone${dragOver ? ' dragover' : ''}${fileName ? ' uploaded' : ''}`}
        htmlFor={id}
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          handleFiles(e.dataTransfer.files);
        }}
      >
        <input
          id={id}
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => handleFiles(e.target.files)}
        />
        {fileName ? (
          <div className="zone-uploaded">{fileName}</div>
        ) : (
          <div className="zone-inner">
            <div className="zone-icon">{icon}</div>
            <div className="zone-primary">Drag &amp; Drop</div>
            <div className="zone-secondary">
              or <span className="zone-browse">browse</span>
            </div>
            <div className="zone-hint">{hint}</div>
          </div>
        )}
      </label>
      {fileName && onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="remove-file-button"
          style={{ marginTop: '0.5rem' }}
        >
          Remove File
        </button>
      )}
    </div>
  );
};

export const DefaultFolderIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M3 6a3 3 0 013-3h4l2 2h9a2 2 0 012 2v10a3 3 0 01-3 3H6a3 3 0 01-3-3z" />
  </svg>
);

export default FileDropZone;

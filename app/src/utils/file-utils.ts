export const readFileAsDataURL = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
};

export const saveTextFile = async (
  text: string,
  suggestedName: string,
  mimeType = 'text/plain',
): Promise<void> => {
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (
        window as unknown as {
          showSaveFilePicker: (
            options: SaveFilePickerOptions,
          ) => Promise<FileSystemFileHandle>;
        }
      ).showSaveFilePicker({
        suggestedName,
        types: [{ description: 'Text file', accept: { [mimeType]: ['.lrc'] } }],
      });
      const writable = await handle.createWritable();
      await writable.write(text);
      await writable.close();
      return;
    } catch {
      return;
    }
  }
  const blob = new Blob([text], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = suggestedName;
  a.click();
  URL.revokeObjectURL(url);
};

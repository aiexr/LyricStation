export const registerCustomFont = (name: string, dataUrl: string): void => {
  const id = `custom-font-${name}`;
  if (document.getElementById(id)) return;
  const style = document.createElement('style');
  style.id = id;
  style.textContent = `@font-face { font-family: '${name}'; src: url('${dataUrl}'); }`;
  document.head.appendChild(style);
};

export const unregisterCustomFont = (name: string): void => {
  const id = `custom-font-${name}`;
  const style = document.getElementById(id);
  if (style) style.remove();
};

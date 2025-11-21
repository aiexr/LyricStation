import { useEffect, useState } from 'react';

const useImageGradient = (url: string | null): string | null => {
  const [gradient, setGradient] = useState<string | null>(null);

  useEffect(() => {
    if (!url) {
      setGradient(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = url;
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.drawImage(img, 0, 0);
      const { width, height } = canvas;
      const getAvg = (x: number, y: number, w: number, h: number) => {
        const data = ctx.getImageData(x, y, w, h).data;
        let r = 0;
        let g = 0;
        let b = 0;
        const len = data.length / 4;
        for (let i = 0; i < data.length; i += 4) {
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
        }
        r = Math.round(r / len);
        g = Math.round(g / len);
        b = Math.round(b / len);
        return `rgb(${r}, ${g}, ${b})`;
      };
      const c1 = getAvg(0, 0, width / 2, height / 2);
      const c2 = getAvg(width / 2, height / 2, width / 2, height / 2);
      setGradient(`linear-gradient(135deg, ${c1}, ${c2})`);
    };
  }, [url]);

  return gradient;
};

export default useImageGradient;

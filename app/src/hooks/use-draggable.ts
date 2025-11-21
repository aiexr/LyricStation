import { useCallback, useEffect, useRef, useState } from 'react';

export interface Point {
  x: number;
  y: number;
}

/**
 * Simple draggable hook supporting mouse and touch events.
 */
const useDraggable = <T extends HTMLElement>(
  initial: Point,
): [Point, React.Ref<T>, React.Dispatch<React.SetStateAction<Point>>] => {
  const [pos, setPos] = useState<Point>(initial);
  const [el, setEl] = useState<T | null>(null);
  const ref = useCallback((node: T | null) => {
    setEl(node);
  }, []);
  const posRef = useRef(pos);

  // keep ref in sync with state
  useEffect(() => {
    posRef.current = pos;
  }, [pos]);

  useEffect(() => {
    const elRef = el;
    if (!elRef) return;
    elRef.style.touchAction = 'none';
    elRef.style.userSelect = 'none';

    let startX = 0;
    let startY = 0;
    let baseX = 0;
    let baseY = 0;
    let dragging = false;
    let pointerId: number | null = null;

    const onPointerMove = (e: PointerEvent) => {
      if (!dragging) return;
      e.preventDefault();
      const x = baseX + e.clientX - startX;
      const y = baseY + e.clientY - startY;
      elRef.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      setPos({ x, y });
    };

    const endDrag = () => {
      dragging = false;
      if (pointerId !== null) {
        elRef.releasePointerCapture(pointerId);
        pointerId = null;
      }
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
    };

    const startDrag = (e: PointerEvent) => {
      e.preventDefault();
      startX = e.clientX;
      startY = e.clientY;
      baseX = posRef.current.x;
      baseY = posRef.current.y;
      dragging = true;
      pointerId = e.pointerId;
      elRef.setPointerCapture(pointerId);
      window.addEventListener('pointermove', onPointerMove);
      window.addEventListener('pointerup', endDrag);
    };

    const preventDefaultDrag = (e: DragEvent) => e.preventDefault();

    elRef.addEventListener('pointerdown', startDrag);
    elRef.addEventListener('dragstart', preventDefaultDrag);
    return () => {
      elRef.removeEventListener('pointerdown', startDrag);
      elRef.removeEventListener('dragstart', preventDefaultDrag);
      window.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', endDrag);
    };
  }, [el]);

  return [pos, ref, setPos];
};

export default useDraggable;

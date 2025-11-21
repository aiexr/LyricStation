import { useEffect } from 'react';

export default function useBeforeUnload(enabled: boolean) {
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (enabled) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [enabled]);
}

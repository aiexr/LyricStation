import { useState, useEffect } from 'react';
import { get, set } from 'idb-keyval';

function useIndexedDbState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(defaultValue);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    get(key)
      .then((stored) => {
        if (!cancelled && stored !== undefined) {
          setValue((current) => {
            if (Array.isArray(current) && Array.isArray(stored)) {
              if (current.length === 0) {
                return stored as T;
              }
              const existing = new Set(
                (current as Array<{ name?: string }>).map((p) => p?.name),
              );
              const merged = [
                ...(stored as Array<{ name?: string }>).filter(
                  (p) => !existing.has(p?.name),
                ),
                ...current,
              ];
              return merged as T;
            }
            return stored as T;
          });
        }
      })
      .catch((err) => {
        console.error('Failed to read from IndexedDB', err);
      })
      .finally(() => {
        if (!cancelled) setLoaded(true);
      });
    return () => {
      cancelled = true;
    };
  }, [key]);

  useEffect(() => {
    if (!loaded) return;
    set(key, value).catch((err) => {
      console.error('Failed to write to IndexedDB', err);
    });
  }, [key, value, loaded]);

  return [value, setValue];
}

export default useIndexedDbState;

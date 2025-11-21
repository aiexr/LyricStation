import { useEffect, useState } from 'react';
import { getCookie, setCookie } from '../utils/cookie-utils';

export default function useCookieState<T>(
  key: string,
  defaultValue: T,
): [T, React.Dispatch<React.SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => {
    const stored = getCookie(key);
    return stored ? (JSON.parse(stored) as T) : defaultValue;
  });

  useEffect(() => {
    const stored = getCookie(key);
    if (stored) setValue(JSON.parse(stored) as T);
  }, [key]);

  useEffect(() => {
    setCookie(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue];
}

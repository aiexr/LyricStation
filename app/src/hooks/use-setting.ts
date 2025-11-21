import React from 'react';

const useSetting = <T>(
  key: string,
  defaultValue: T,
  override: T | undefined,
): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = React.useState<T>(() => {
    if (override !== undefined) return override;
    const stored = localStorage.getItem(key);
    return stored ? (JSON.parse(stored) as T) : defaultValue;
  });

  React.useEffect(() => {
    if (override !== undefined) {
      setState(override);
    }
  }, [override]);

  React.useEffect(() => {
    if (override === undefined) {
      localStorage.setItem(key, JSON.stringify(state));
    }
  }, [key, state, override]);

  return [state, setState];
};

export default useSetting;

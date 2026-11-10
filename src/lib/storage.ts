import { useCallback, useState } from 'react';

export function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return fallback;
    const value = JSON.parse(raw);
    return typeof value === typeof fallback ? value : fallback;
  } catch { return fallback; }
}

export function useStoredState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => readStored(key, fallback));
  const update = useCallback((next: T | ((prev: T) => T)) => {
    setValue(prev => {
      const result = next instanceof Function ? next(prev) : next;
      try { localStorage.setItem(key, JSON.stringify(result)); } catch { /* Private browsing is supported. */ }
      return result;
    });
  }, [key]);
  return [value, update] as const;
}

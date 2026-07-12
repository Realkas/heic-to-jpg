import { useState, useEffect } from 'react';

/**
 * A hook that syncs state to localStorage.
 * Only primitive/JSON-serializable values are stored.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (v: T) => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item === null) return initialValue;
      return JSON.parse(item) as T;
    } catch {
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(key, JSON.stringify(storedValue));
    } catch {
      // localStorage may be unavailable (private mode etc.)
    }
  }, [key, storedValue]);

  return [storedValue, setStoredValue];
}

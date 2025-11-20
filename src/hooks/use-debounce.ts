/**
 * Custom hook for debouncing values
 * Useful for search inputs to avoid excessive API calls
 */

import { useState, useEffect } from 'react';

/**
 * Hook that debounces a value by the specified delay
 * @param value - The value to debounce
 * @param delay - The debounce delay in milliseconds
 * @returns The debounced value
 */
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

/**
 * Hook for debounced callback function
 * @param callback - The callback function to debounce
 * @param delay - The debounce delay in milliseconds
 * @param deps - Dependencies array for the callback
 * @returns The debounced callback function
 */
export const useDebouncedCallback = (
  callback: (...args: any[]) => void,
  delay: number,
  deps?: React.DependencyList
) => {
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null);

  const debouncedCallback = (...args: any[]) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer);
    }

    const newTimer = setTimeout(() => {
      callback(...args);
    }, delay);

    setDebounceTimer(newTimer);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, deps ? deps : []);

  return debouncedCallback;
};

export default useDebounce;
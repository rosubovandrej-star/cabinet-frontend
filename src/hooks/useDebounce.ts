import { useState, useEffect } from 'react';

/**
 * Hook to debounce a rapidly changing value.
 * Useful for delaying API calls until the user has stopped typing.
 *
 * @param value The value to debounce.
 * @param delay The debounce delay in milliseconds (default: 300).
 * @returns The debounced value.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    // Set debouncedValue to value (passed in) after the specified delay
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes (also on delay change or unmount)
    // This is how we prevent debouncedValue from updating if value is changed
    // within the delay period. Timeout gets cleared and restarted.
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

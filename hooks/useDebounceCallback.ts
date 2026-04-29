import { useCallback, useEffect, useRef } from 'react';

/**
 * Hook personnalisé pour debounce une fonction callback
 * @param callback La fonction à debounce
 * @param delay Le délai en millisecondes (par défaut 500ms)
 * @returns La fonction debouncée
 */
function useDebounceCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  delay: number = 500
): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return useCallback(function (this: unknown, ...args: Parameters<T>) {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback.apply(this, args);
    }, delay);
  }, [callback, delay]) as T;
}

export default useDebounceCallback;

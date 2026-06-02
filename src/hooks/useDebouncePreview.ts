import { useRef, useCallback } from 'react';

/**
 * Hook to debounce preview generation and prevent rate limit errors
 * Ensures preview API is called at most once per debounceMs milliseconds
 */
export function useDebouncePreview(
  onGeneratePreview: (designFiles?: any[]) => Promise<void>,
  debounceMs = 2000 // Wait 2 seconds after last change before generating
) {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCallTimeRef = useRef<number>(0);
  const isGeneratingRef = useRef(false);

  const debouncedGeneratePreview = useCallback(
    async (designFiles?: any[]) => {
      // Clear any pending timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new debounced call
      timeoutRef.current = setTimeout(async () => {
        const now = Date.now();
        const timeSinceLastCall = now - lastCallTimeRef.current;

        // Enforce minimum time between calls
        if (timeSinceLastCall < debounceMs && lastCallTimeRef.current > 0) {
          const waitTime = debounceMs - timeSinceLastCall;
          timeoutRef.current = setTimeout(() => {
            debouncedGeneratePreview(designFiles);
          }, waitTime);
          return;
        }

        if (isGeneratingRef.current) {
          console.log('⏳ Preview generation already in progress, queuing next call...');
          return;
        }

        try {
          isGeneratingRef.current = true;
          lastCallTimeRef.current = now;
          console.log('🎬 Executing debounced preview generation...');
          await onGeneratePreview(designFiles);
        } catch (error) {
          console.error('❌ Debounced preview generation failed:', error);
        } finally {
          isGeneratingRef.current = false;
        }
      }, debounceMs);
    },
    [onGeneratePreview, debounceMs]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  return { debouncedGeneratePreview, cancel };
}

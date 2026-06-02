/**
 * Retry logic with exponential backoff for API calls
 * Helps handle 429 Too Many Requests and other transient errors
 */
export async function retryWithExponentialBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
  }
): Promise<T> {
  const {
    maxRetries = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
  } = options || {};

  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      const isRateLimited = (error as any)?.response?.status === 429;
      const shouldRetry = attempt < maxRetries && (isRateLimited || isTransientError(error));

      if (!shouldRetry) {
        throw error;
      }

      // Calculate backoff delay
      const delayMs = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt),
        maxDelayMs
      );

      // Add jitter to prevent thundering herd
      const jitter = Math.random() * 0.1 * delayMs;
      const totalDelay = delayMs + jitter;

      console.log(
        `🔄 Retry attempt ${attempt + 1}/${maxRetries} after ${Math.round(totalDelay)}ms`,
        {
          isRateLimited,
          error: (error as any)?.message,
        }
      );

      await new Promise(resolve => setTimeout(resolve, totalDelay));
    }
  }

  throw lastError || new Error('Max retries exceeded');
}

function isTransientError(error: any): boolean {
  const status = error?.response?.status;
  // Retry on: 429 (rate limit), 503 (service unavailable), 504 (gateway timeout), network errors
  return status === 429 || status === 503 || status === 504 || !status;
}

/**
 * Centralized utility to get the API base URL
 * Works in both server and client components
 */
export const getApiUrl = (): string => {
  // In browser environment
  if (typeof window !== 'undefined') {
    return (process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media').replace(/\/$/, '');
  }

  // On server side
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://catalog.loka.media';
  return apiUrl.replace(/\/$/, '');
};

/**
 * React hook for getting API URL in client components
 */
export const useApiUrl = (): string => {
  return getApiUrl();
};

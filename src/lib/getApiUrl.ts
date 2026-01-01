/**
 * Centralized utility to get the API base URL
 * Works in both server and client components
 */
export const getApiUrl = (): string => {
  // In browser environment
  if (typeof window !== 'undefined') {
    return (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/').replace(/\/$/, '');
  }

  // On server side
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/';
  return apiUrl.replace(/\/$/, '');
};

/**
 * React hook for getting API URL in client components
 */
export const useApiUrl = (): string => {
  return getApiUrl();
};

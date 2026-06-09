interface APIErrorResponse {
  response?: {
    data?: {
      error?: string;
      message?: string;
      requiresVerification?: boolean;
    };
  };
  message?: string;
}

export function extractErrorMessage(
  error: unknown,
  defaultMessage = "An error occurred"
): string {
  if (!error) {
    return defaultMessage;
  }

  if (typeof error === "object" && error !== null && "response" in error) {
    const apiError = error as APIErrorResponse;

    if (apiError.response?.data?.error && typeof apiError.response.data.error === "string") {
      return apiError.response.data.error;
    }

    if (apiError.response?.data?.message && typeof apiError.response.data.message === "string") {
      return apiError.response.data.message;
    }
  }

  if (error instanceof Error) {
    // If it's an Axios error and the backend sent a 404 but no specific error message
    if ((error as any).isAxiosError && (error as any).response?.status === 404 && error.message.includes('404')) {
      return "The requested resource was not found or the email does not exist.";
    }
    return error.message || defaultMessage;
  }

  if (typeof error === "string") {
    return error;
  }

  if (
    typeof error === "object" && error !== null &&
    "message" in error &&
    typeof (error as any).message === "string"
  ) {
    return (error as any).message;
  }

  return defaultMessage;
}

export function requiresEmailVerification(error: unknown): boolean {
  if (!error || typeof error !== "object") {
    return false;
  }

  const apiError = error as APIErrorResponse;
  return !!apiError.response?.data?.requiresVerification;
}

export async function handleFormSubmission<T>(
  submitFn: () => Promise<T>,
  onError?: (message: string) => void,
  defaultErrorMessage = "Submission failed"
): Promise<T | undefined> {
  try {
    return await submitFn();
  } catch (error) {
    const errorMessage = extractErrorMessage(error, defaultErrorMessage);
    onError?.(errorMessage);
    return undefined;
  }
}

export enum ErrorType {
  VALIDATION = "validation",
  AUTHENTICATION = "authentication",
  NETWORK = "network",
  SERVER = "server",
  UNKNOWN = "unknown",
}

export function categorizeError(error: unknown): ErrorType {
  const message = extractErrorMessage(error).toLowerCase();

  if (message.includes("invalid") || message.includes("required")) {
    return ErrorType.VALIDATION;
  }

  if (
    message.includes("unauthorized") ||
    message.includes("authentication") ||
    message.includes("password") ||
    message.includes("credentials")
  ) {
    return ErrorType.AUTHENTICATION;
  }

  if (
    message.includes("network") ||
    message.includes("timeout") ||
    message.includes("connection")
  ) {
    return ErrorType.NETWORK;
  }

  if (message.includes("server") || message.includes("500")) {
    return ErrorType.SERVER;
  }

  return ErrorType.UNKNOWN;
}

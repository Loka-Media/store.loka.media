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

  if (error instanceof Error) {
    return error.message || defaultMessage;
  }

  if (typeof error === "object" && "response" in error) {
    const apiError = error as APIErrorResponse;

    if (apiError.response?.data?.error) {
      return apiError.response.data.error;
    }

    if (apiError.response?.data?.message) {
      return apiError.response.data.message;
    }
  }

  if (typeof error === "string") {
    return error;
  }

  if (
    typeof error === "object" &&
    "message" in error &&
    typeof error.message === "string"
  ) {
    return error.message;
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

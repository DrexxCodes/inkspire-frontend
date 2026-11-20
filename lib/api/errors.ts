export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly status: number,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }

  is(...codes: string[]) {
    return codes.includes(this.code);
  }
}

export const isApiError = (e: unknown): e is ApiError => e instanceof ApiError;

/** A message that is always safe to show to a person. */
export function errorMessage(e: unknown, fallback = "Something went wrong. Please try again."): string {
  if (isApiError(e)) return e.message || fallback;
  return fallback;
}

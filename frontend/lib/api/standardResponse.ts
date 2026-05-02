/**
 * Standard backend envelope for JSON APIs.
 */
export type StandardApiEnvelope<T = unknown> = {
  error?: boolean;
  message?: string;
  statusCode?: number;
  responseData?: T;
};

/**
 * Returns `responseData` when `body` is a standard envelope; otherwise returns `body`
 * (useful during migration or for non-wrapped endpoints).
 */
export function extractResponseData<T = unknown>(body: unknown): T {
  if (body !== null && typeof body === "object" && "responseData" in body) {
    return (body as StandardApiEnvelope<T>).responseData as T;
  }
  return body as T;
}

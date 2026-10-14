import { log } from "@/lib/log";

export interface RetryOptions {
  maxRetries: number;
  onRetry?: (attempt: number, error: unknown) => void;
}

export async function withRetry<T>(
  fn: () => Promise<T>,
  label: string,
  options: RetryOptions = { maxRetries: 2 }
): Promise<{ result: T; retries: number }> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= options.maxRetries; attempt++) {
    try {
      const result = await fn();
      return { result, retries: attempt };
    } catch (e) {
      lastError = e;
      if (attempt < options.maxRetries) {
        log.warn("Retrying operation", {
          label,
          attempt: attempt + 1,
          maxRetries: options.maxRetries,
          error: e instanceof Error ? e.message : String(e),
        });
        options.onRetry?.(attempt + 1, e);
      }
    }
  }
  throw lastError;
}
